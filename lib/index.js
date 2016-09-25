'use strict';

const _ = require('underscore');
const cliArgs = require('command-line-args');
const colors = require('colors');
const fs = require('fs');
const minimatch = require('minimatch');
const path = require('path');
const pkgInfo = require('pkginfo');
const prettyJson = require('prettyjson');
const util = require('util');
const child_process = require('child_process');
const os = require('os');
const process = require('process');
const temp = require('temp');
const moment = require('moment');

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

function tryLoadOptionsFile(filename, dump, options, hintMessage) {
    if (fs.existsSync(filename)) {
        if (fs.lstatSync(filename).isDirectory()) {
            filename = path.join(filename, config.configFileName);
        }
    }

    if (fs.existsSync(filename)) {
        var absoluteFileName = path.resolve(filename);
        if (dump) {
            console.log('Using config file', absoluteFileName, hintMessage);
        }

        var loadedOptions = require(absoluteFileName);

        options = _.extend(options, loadedOptions);
    }

    return options;
}

function directoryFromFileArgument(file) {
    var dir = '';

    var fullFilePath = path.resolve(file);

    try {
        if (fs.lstatSync(fullFilePath).isDirectory()) {
            dir = fullFilePath;
        }
    } catch (ex) {
        //
    }

    if (!dir) {
        try {
            if (fs.lstatSync(fullFilePath).isFile()) {
                dir = path.dirname(fullFilePath);
            }
        } catch (ex) {
            //
        }
    }

    return dir;
}

function loadOptions() {
    var parsedCommandLineArguments = cli.parse();

    var options = {};

    // *** Load options from home dir, typically api key
    var optionsFileName = path.join(os.homedir(), config.configFileName);
    options = tryLoadOptionsFile(optionsFileName, parsedCommandLineArguments.dump, options, '(~)');

    // *** Load options from the file given in command line
    if (parsedCommandLineArguments.configfile) {
        options = tryLoadOptionsFile(parsedCommandLineArguments.configfile, parsedCommandLineArguments.dump, options, '(--configfile)');
    } else {
        // *** Load fom project file directory
        var tryCwd = true;
        if (parsedCommandLineArguments.file) {
            var optionFileDir = directoryFromFileArgument(parsedCommandLineArguments.file);

            var optionFile = path.join(optionFileDir, config.configFileName);

            try {
                if (fs.lstatSync(optionFile).isFile()) {
                    tryCwd = false;

                    options = tryLoadOptionsFile(optionFile, parsedCommandLineArguments.dump, options, '(projectfile)');
                }
            } catch (ex) {
                //
            }
        }

        // *** load from current working directory
        if (tryCwd) {
            options = tryLoadOptionsFile(path.join(process.cwd(), config.configFileName), parsedCommandLineArguments.dump, options, '(cwd)');
        }
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

function getProjectFileName(fileName) {
    if (!fileName) {
        fileName = '.';
    }

    var fileDir = directoryFromFileArgument(fileName);

    var nameOfProjectFile = '';
    try {
        var fullFilePath = path.resolve(fileName);
        if (fs.lstatSync(fullFilePath).isDirectory()) {
            nameOfProjectFile = config.defaultProjectFile;
        }
    } catch (ex) {
        //
    }

    var pathToProjectFile = path.join(fileDir, nameOfProjectFile);

    return pathToProjectFile;
}

function createOptionFile(parsedBody) {
    var saveFileName = '';
    if (options.configfile) {
        saveFileName = path.resolve(options.configfile);

        try {
            if (fs.lstatSync(saveFileName).isDirectory()) {
                saveFileName = path.join(saveFileName, config.configFileName);
            }
        } catch (ex) {
            //
        }
    } else {
        if (options.file) {
            var optionFileDir = directoryFromFileArgument(options.file);

            saveFileName = path.join(optionFileDir, config.configFileName);
        }
    }

    if (!saveFileName) {
        saveFileName = path.join(process.cwd(), config.configFileName);
    }

    if (fs.existsSync(saveFileName)) {
        console.log(colors.red(util.format(config.cli.messages.skippingCreationOptionFileExist, saveFileName)));

        return;
    }

    var parsedCommandLineArguments = cli.parse();
    var saveObject = _.clone(parsedCommandLineArguments);
    delete saveObject.apikey;
    delete saveObject.configfile;
    delete saveObject.createproject;
    saveObject.projectid = parsedBody.id;

    var pathToProjectFile = getProjectFileName(options.file);
    saveObject.file = path.basename(pathToProjectFile);

    fs.writeFileSync(saveFileName, JSON.stringify(saveObject, null, 4));

    console.log(colors.green(util.format(config.cli.messages.savedOptionFile, saveFileName)));
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

    if (options.createproject) {
        console.log(colors.green(util.format(config.cli.messages.successCreation, parsedBody.name, parsedBody.id)));

        createOptionFile(parsedBody);
    } else {
        console.log(colors.green(util.format(config.cli.messages.success)));
    }

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

    if (!npmOutput || !npmOutput.dependencies) {
        console.log(colors.red(config.cli.messages.failedToCallNpm));
        console.log(stdout);
    }

    var npmPackageDependencySection = {};
    _.each(npmOutput.dependencies, function(value, key) {
        npmPackageDependencySection[key] = value.version;
    }) ;

    var newNpmPackageFile = {
        name: options.globalpackagename ? options.globalpackagename : 'GlobalNpmPackageFile' + os.hostname(),
        description: 'Package file for VersionEye, created for globally installed packaged on ' + os.hostname(),
        author: 'Automatically created by node-versioneye-update ' + versionInfo.version,
        version: new moment().format('YYYYMMDDHHMMSS'),
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

    if (options.createproject) {
        versionEyeApi.createProjectByFile(tempName, options.createproject, function(parsedBody, err) {
            handleVersionEyeUpdateResponse(parsedBody, err);

            fs.unlinkSync(tempName);
            fs.rmdirSync(tempDir);
        });

    } else {
        versionEyeApi.updateProjectByFile(options.projectid, tempName, function(parsedBody, err) {
            handleVersionEyeUpdateResponse(parsedBody, err);

            fs.unlinkSync(tempName);
            fs.rmdirSync(tempDir);
        });
    }
}

function uploadFile() {
    var pathToProjectFile = getProjectFileName(options.file);
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

    try {
        projectFileExists = fs.lstatSync(pathToProjectFile).isFile();
    } catch (ex) {
        //
    }

    if (!projectFileExists) {
        var fileNotFoundMessage = colors.red(util.format(config.cli.messages.fileNotFound, pathToProjectFile));
        console.log(fileNotFoundMessage);

        setReturnCode(ReturnCode.FileNotFound);

        return;
    }

    console.log(colors.green(util.format(config.cli.messages.uploadingFile, pathToProjectFile)));

    var versionEyeApi = new VersionEyeApi(options.apikey, options.baseUrl);

    if (options.createproject) {
        versionEyeApi.createProjectByFile(pathToProjectFile, options.createproject, handleVersionEyeUpdateResponse);
    }
    else {
        versionEyeApi.updateProjectByFile(options.projectid, pathToProjectFile, handleVersionEyeUpdateResponse);
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

    if (typeof options.createproject !== 'undefined') {
        if (typeof options.createproject !== 'string' ||
            typeof options.createproject.length === 'undefined' ||
            options.createproject.length === 0) {
            options.createproject = 'public';
        }

        if (options.projectid) {
            console.log(colors.red(config.cli.messages.cannotCreateProjectWhenKeyIsGiven));

            setReturnCode(ReturnCode.InvalidCommandLineOption);
            return;
        }
    }
    else {
        if (!options.projectid) {
            console.log(colors.red(config.cli.messages.missingProjectId));

            setReturnCode(ReturnCode.MissingProjectId);
            return;
        }
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

go();

// 	"projectid": "57d5a142dc75d0000e2d63f5",
