'use strict';

var _ = require('underscore');
var cliArgs = require('command-line-args');
var colors = require('colors');
var fs = require('fs');
var minimatch = require('minimatch');
var path = require('path');
var pkgInfo = require('pkginfo');
var prettyJson = require('prettyjson');
var util = require('util');
var child_process = require('child_process');
var os = require('os');
var process = require('process');
var temp = require('temp');

var config = require('./config');
var VersionEyeApi = require('./versioneyeApi');

var versionInfo = pkgInfo(module, 'version');

var cli = cliArgs(config.cli.arguments);

var ReturnCode = {
    Ok: 0,
    ApiCallFailed: -1,
    FileNotFound: -2,
    LicenseCheckFailed: -3,
    SecurityViolationCheckFailed: -4,
    InvalidFileType: -5,
    MissingApiKey: -6,
    MissingProjectId: -7,
    OutdatedComponentsFailed: -8,
    InvalidCommandLineOption: -9
};

function loadOptions() {
    var parsedCommandLineArguments = cli.parse();

    var options = {};

    var optionsFileName;

    if (parsedCommandLineArguments.configFile) {
        optionsFileName = parsedCommandLineArguments.configFile;
    } else {
        optionsFileName = path.join(process.cwd(), '.versioneye-update.json');
    }

    if (options.dump) {
        console.log('Using config file', optionsFileName);
    }

    var loadedOptions = {};
    if (fs.existsSync(optionsFileName)) {
        loadedOptions = require(optionsFileName);

        options = loadedOptions;
    }

    options = _.extend(options, parsedCommandLineArguments);

    return options;
}

var options = loadOptions();

function setReturnCode(code) {
    if (options) {
        if (options.ignorechecks) {
            code = 0;
        }
    }

    process.exit(code);
}

function handleVersionEyeUpdateResponse(parsedBody, err) {
    if (options.dump) {
        console.log('VersionEye API says:');
        console.log(parsedBody);
    }

    if (err) {
        console.log(colors.red(err));
        setReturnCode(ReturnCode.ApiCallFailed);
        return;
    }

    console.log(colors.green(util.format(config.cli.messages.success)));

    if (parsedBody.dependencies) {
        if (options.failonoutdated || options.listoutdated) {
            var outdated = [];
            _.forEach(parsedBody.dependencies, function (dependency) {
                if (dependency.outdated) {
                    outdated.push(dependency);
                }
            });

            if (outdated.length > 0) {
                console.log(colors.red(config.cli.messages.outdated));
                _.forEach(outdated, function (dependency) {
                    console.log(colors.red(util.format('%s (%s/%s)', dependency.name, dependency.version_requested, dependency.version_current)));
                });

                if (options.failonoutdated) {
                    setReturnCode(ReturnCode.OutdatedComponentsFailed);
                    return;
                }
            } else {
                console.log(colors.green(config.cli.messages.allComponentsAreUpToDate));
            }
        }
    }

    if (options.licensecheck) {
        if (parsedBody.licenses_red && parsedBody.licenses_red > 0) {
            console.log(colors.red(config.cli.messages.licenseRed));
            setReturnCode(ReturnCode.LicenseCheckFailed);

            return;
        } else {
            console.log(colors.green(config.cli.messages.licenseCheckPass));
        }
    }

    if (options.securitycheck) {
        if (parsedBody.sv_count && parsedBody.sv_count > 0) {
            console.log(colors.red(util.format(config.cli.messages.securityVulnerabilityKnown, parsedBody.sv_count)));
            setReturnCode(ReturnCode.SecurityViolationCheckFailed);

            return;
        } else {
            console.log(colors.green(config.cli.messages.securityCheckPass));
        }
    }
}

function uploadGloballyInstalledPackages() {
    console.log(colors.green(config.cli.messages.creatingGlobalPackageFile));
    var stdout = child_process.execSync('npm list -g --depth=0 -json');
    var npmOutput = JSON.parse(stdout);
    if (npmOutput && npmOutput.dependencies) {
        var npmPackageDependencySection = {};
        _.each(npmOutput.dependencies, function(value, key) {
            npmPackageDependencySection[key] = value.version;
        }) ;

        var newNpmPackageFile = {
            name: options.globalpackagename ? options.globalpackagename : 'GlobalNpmPackageFile' + os.hostname(),
            description: 'Package file for VersionEye, created for globally installed packaged on ' + os.hostname(),
            author: 'Automatically created by node-versioneye-update ' + versionInfo.version,
            version: '20160911',
            dependencies: npmPackageDependencySection
        };

        var fileContent = JSON.stringify(newNpmPackageFile, null, 2);

        if (options.dump) {
            console.log('Uploading generated package.json file:');
            console.log(fileContent);
        }

        var tempDir = temp.path();

        fs.mkdirSync(tempDir);

        var tempName = path.join(tempDir, 'package.json');
        fs.writeFileSync(tempName, fileContent);

        var versionEyeApi = new VersionEyeApi(options.apikey, options.baseUrl);

        versionEyeApi.updateProjectByFile(options.projectid, tempName, function(parsedBody, err) {
            handleVersionEyeUpdateResponse(parsedBody, err);

            fs.unlinkSync(tempName);
            fs.rmdirSync(tempDir);
        });
    } else {
        console.log(colors.red(config.cli.messages.failedToCallNpm));
        console.log(stdout);
    }
}

function uploadFile() {
    var pathToProjectFile = options.file || config.defaultProjectFile;
    var nameOfProjectFile = path.basename(pathToProjectFile);

    var isFileAllowed = _.any(config.allowedProjectFiles, function (allowedFile) {
        return minimatch(nameOfProjectFile, allowedFile);
    });

    if (!isFileAllowed) {
        console.log(colors.red(config.cli.messages.invalidFileType));
        console.log(prettyJson.render(config.allowedProjectFiles));

        setReturnCode(ReturnCode.InvalidFileType);
        return;
    }

    var projectFileExists = false;

    var filePath = path.normalize(pathToProjectFile);

    try {
        projectFileExists = fs.lstatSync(filePath).isFile();
    } catch (ex) {
        // Will try next option
    }

    if (!projectFileExists) {
        console.log(util.format(config.cli.messages.relativeFilePathNotFound, pathToProjectFile, process.cwd()));

        filePath = path.join(process.cwd(), path.normalize(pathToProjectFile));

        try {
            projectFileExists = fs.lstatSync(filePath).isFile();
        } catch (ex) {
            // Will try next option
        }
    }

    if (!projectFileExists) {
        var fileNotFoundMessage = colors.red(util.format(config.cli.messages.fileNotFound, pathToProjectFile));
        console.log(fileNotFoundMessage);

        setReturnCode(ReturnCode.FileNotFound);

        return;
    } else {
        console.log(colors.green(util.format(config.cli.messages.uploadingFile, filePath)));

        var versionEyeApi = new VersionEyeApi(options.apikey, options.baseUrl);

        versionEyeApi.updateProjectByFile(options.projectid, filePath, handleVersionEyeUpdateResponse);
    }
}

function updateProject() {
    if (!options.projectid) {
        console.log(colors.red(config.cli.messages.missingProjectId));

        setReturnCode(ReturnCode.MissingProjectId);
        return;
    }

    if (options.globalinstalls && options.file) {
        console.log(colors.red(util.format(config.cli.messages.cannotUseCliTogether, 'globalinstalls', 'file')));

        setReturnCode(ReturnCode.InvalidCommandLineOption);
        return;
    }

    if (options.globalinstalls) {
        uploadGloballyInstalledPackages();

        return;
    } else {
        uploadFile();
    }
}

function go() {
    if (options.help) {
        console.log(cli.getUsage({
            header: config.cli.usage
        }));

        setReturnCode(ReturnCode.Ok);
        return;
    }

    if (options.version) {
        console.log(module.exports.version);

        setReturnCode(ReturnCode.Ok);
        return;
    }

    options.baseUrl = options.baseurl || config.defaultApiBaseUrl;

    if (!options.apikey) {
        console.log(colors.red(config.cli.messages.missingApiKey));

        setReturnCode(ReturnCode.MissingApiKey);
        return;
    }

    updateProject();
}

go();
