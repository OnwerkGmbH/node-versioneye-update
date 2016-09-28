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

const config = require('./config');
const constants = require('./constants');
const messages = require('./messages');
const VersionEyeApi = require('./versioneyeApi');


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

function fileExists(filePath) {
    var itExists = false;

    try {
        itExists = fs.lstatSync(filePath).isFile();
    } catch (ex) {
        // ignore exceptions, file does not exist
    }

    return itExists;
}

function directoryExists(filePath) {
    var itExists = false;

    try {
        itExists = fs.lstatSync(filePath).isDirectory();
    } catch (ex) {
        // ignore exceptions, directory does not exist
    }

    return itExists;
}

function tryLoadOptionsFile(filename, dump, cliOptions, hintMessage) {
    if (fs.existsSync(filename)) {
        if (fs.lstatSync(filename).isDirectory()) {
            filename = path.join(filename, constants.configFileName);
        }
    }

    if (fs.existsSync(filename)) {
        var absoluteFileName = path.resolve(filename);
        if (dump) {
            console.log('Using config file', absoluteFileName, hintMessage);
        }

        var loadedOptions = require(absoluteFileName); /* eslint global-require: "off" */

        cliOptions = _.extend(cliOptions, loadedOptions);
    }

    return cliOptions;
}

function directoryFromFileArgument(file) {
    var dir = '';

    var fullFilePath = path.resolve(file);

    if (directoryExists(fullFilePath)) {
        dir = fullFilePath;
    }

    if (!dir) {
        if (fileExists(fullFilePath)) {
            dir = path.dirname(fullFilePath);
        }
    }

    return dir;
}

function loadOptions() {
    var parsedCommandLineArguments = cli.parse();

    var cliOptions = {};

    // *** Load cliOptions from home dir, typically api key
    var optionsFileName = path.join(os.homedir(), constants.configFileName);
    cliOptions = tryLoadOptionsFile(optionsFileName, parsedCommandLineArguments.dump, cliOptions, '(~)');

    // *** Load cliOptions from the file given in command line
    if (parsedCommandLineArguments.configfile) {
        cliOptions = tryLoadOptionsFile(parsedCommandLineArguments.configfile, parsedCommandLineArguments.dump, cliOptions, '(--configfile)');
    } else {
        // *** Load fom project file directory
        var tryCwd = true;
        if (parsedCommandLineArguments.file) {
            var optionFileDir = directoryFromFileArgument(parsedCommandLineArguments.file);

            var optionFile = path.join(optionFileDir, constants.configFileName);

            if (fileExists(optionFile)) {
                tryCwd = false;

                cliOptions = tryLoadOptionsFile(optionFile, parsedCommandLineArguments.dump, cliOptions, '(projectfile)');
            }
        }

        // *** load from current working directory
        if (tryCwd) {
            cliOptions = tryLoadOptionsFile(path.join(process.cwd(), constants.configFileName), parsedCommandLineArguments.dump, cliOptions, '(cwd)');
        }
    }

    cliOptions = _.extend(cliOptions, parsedCommandLineArguments);

    return cliOptions;
}

var cliOptions = loadOptions();

function exitProcess(exitCode) {
    if (cliOptions && cliOptions.ignorechecks) {
        exitCode = 0;
    }

    process.exit(exitCode); /* eslint no-process-exit: "off" */
}

function getProjectFileName(fileName) {
    if (!fileName) {
        fileName = '.';
    }

    var fileDir = directoryFromFileArgument(fileName);

    var nameOfProjectFile = '';

    var fullFilePath = path.resolve(fileName);
    if (directoryExists(fullFilePath)) {
        nameOfProjectFile = constants.defaultProjectFile;
    } else {
        nameOfProjectFile = path.basename(fullFilePath);
    }

    var pathToProjectFile = path.join(fileDir, nameOfProjectFile);

    return pathToProjectFile;
}

function createOptionFile(parsedBody) {
    var saveFileName = '';
    if (cliOptions.configfile) {
        saveFileName = path.resolve(cliOptions.configfile);

        if (directoryExists(saveFileName)) {
            saveFileName = path.join(saveFileName, constants.configFileName);
        }
    } else {
        if (cliOptions.file) {
            var optionFileDir = directoryFromFileArgument(cliOptions.file);

            saveFileName = path.join(optionFileDir, constants.configFileName);
        }
    }

    if (!saveFileName) {
        saveFileName = path.join(process.cwd(), constants.configFileName);
    }

    if (fs.existsSync(saveFileName)) {
        console.log(colors.red(util.format(messages.skippingCreationOptionFileExist, saveFileName)));

        return;
    }

    var parsedCommandLineArguments = cli.parse();
    var saveObject = _.clone(parsedCommandLineArguments);
    delete saveObject.apikey;
    delete saveObject.configfile;
    delete saveObject.createproject;
    saveObject.projectid = parsedBody.id;

    if (!cliOptions.globalinstalls) {
        var pathToProjectFile = getProjectFileName(cliOptions.file);
        saveObject.file = path.basename(pathToProjectFile);
    } else {
        delete saveObject.file;
    }

    fs.writeFileSync(saveFileName, JSON.stringify(saveObject, null, 4));

    console.log(colors.green(util.format(messages.savedOptionFile, saveFileName)));
}

function displayReceivedDependencies(parsedBody) {
    if (parsedBody.dependencies) {
        if (cliOptions.failonoutdated || cliOptions.listoutdated) {
            var outdated = [];
            _.forEach(parsedBody.dependencies, function (dependency) {
                if (dependency.outdated) {
                    outdated.push(dependency);
                }
            });

            if (outdated.length > 0) {
                console.log(colors.red(messages.outdated));
                _.forEach(outdated, function (dependency) {
                    console.log(colors.red(util.format('%s (%s/%s)', dependency.name, dependency.version_requested, dependency.version_current)));
                });

                if (cliOptions.failonoutdated) {
                    exitProcess(ReturnCode.OutdatedComponentsFailed);

                    return;
                }
            } else {
                console.log(colors.green(messages.allComponentsAreUpToDate));
            }
        }
    }
}

function licenseCheck(parsedBody) {
    if (cliOptions.licensecheck) {
        if (parsedBody.licenses_red && parsedBody.licenses_red > 0) {
            console.log(colors.red(messages.licenseRed));
            exitProcess(ReturnCode.LicenseCheckFailed);

            return;
        } else {
            console.log(colors.green(messages.licenseCheckPass));
        }
    }
}

function securityCheck(parsedBody) {
    if (cliOptions.securitycheck) {
        if (parsedBody.sv_count && parsedBody.sv_count > 0) {
            console.log(colors.red(util.format(messages.securityVulnerabilityKnown, parsedBody.sv_count)));
            exitProcess(ReturnCode.SecurityViolationCheckFailed);

            return;
        } else {
            console.log(colors.green(messages.securityCheckPass));
        }
    }
}

function handleVersionEyeUpdateResponse(parsedBody, err) {
    if (cliOptions.dump) {
        console.log('VersionEye API says:');
        console.log(parsedBody);
    }

    if (err) {
        console.log(colors.red(err));
        exitProcess(ReturnCode.ApiCallFailed);

        return;
    }

    if (cliOptions.createproject) {
        console.log(colors.green(util.format(messages.successCreation, parsedBody.name, parsedBody.id)));

        createOptionFile(parsedBody);
    } else {
        console.log(colors.green(util.format(messages.success)));
    }

    displayReceivedDependencies(parsedBody);

    licenseCheck(parsedBody);

    securityCheck(parsedBody);
}

function createPackageName() {
    return cliOptions.globalpackagename ? cliOptions.globalpackagename : 'GlobalNpmPackageFile' + os.hostname();
}

function uploadGloballyInstalledPackages() {
    console.log(colors.green(messages.creatingGlobalPackageFile));
    var stdout = child_process.execSync('npm list -g --depth=0 -json');
    var npmOutput = JSON.parse(stdout);

    if (!npmOutput || !npmOutput.dependencies) {
        console.log(colors.red(messages.failedToCallNpm));
        console.log(stdout);
    }

    var npmPackageDependencySection = {};
    _.each(npmOutput.dependencies, function(value, key) {
        npmPackageDependencySection[key] = value.version;
    }) ;

    var newNpmPackageFile = {
        name: createPackageName(),
        description: 'Package file for VersionEye, created for globally installed packaged on ' + os.hostname(),
        author: 'Automatically created by node-versioneye-update ' + versionInfo.version,
        version: new moment().format('YYYYMMDDHHMMSS'),
        dependencies: npmPackageDependencySection
    };

    var fileContent = JSON.stringify(newNpmPackageFile, null, 2);

    if (cliOptions.dump) {
        console.log('Uploading generated package.json file:');
        console.log(fileContent);
    }

    var tempDir = temp.path();

    fs.mkdirSync(tempDir);

    var tempName = path.join(tempDir, 'package.json');
    fs.writeFileSync(tempName, fileContent);

    var versionEyeApi = new VersionEyeApi(cliOptions.apikey, cliOptions.baseUrl);

    if (cliOptions.createproject) {
        versionEyeApi.createProjectByFile(tempName, cliOptions.createproject, function(parsedBody, err) {
            handleVersionEyeUpdateResponse(parsedBody, err);

            fs.unlinkSync(tempName);
            fs.rmdirSync(tempDir);
        });
    } else {
        versionEyeApi.updateProjectByFile(cliOptions.projectid, tempName, function(parsedBody, err) {
            handleVersionEyeUpdateResponse(parsedBody, err);

            fs.unlinkSync(tempName);
            fs.rmdirSync(tempDir);
        });
    }
}

function uploadFile() {
    var pathToProjectFile = getProjectFileName(cliOptions.file);
    var nameOfProjectFile = path.basename(pathToProjectFile);

    var isFileAllowed = _.any(constants.allowedProjectFiles, function (allowedFile) {
        return minimatch(nameOfProjectFile, allowedFile);
    });

    if (!isFileAllowed) {
        console.log(colors.red(messages.invalidFileType));
        console.log(prettyJson.render(constants.allowedProjectFiles));

        exitProcess(ReturnCode.InvalidFileType);

        return;
    }

    var projectFileExists = fileExists(pathToProjectFile);

    if (!projectFileExists) {
        var fileNotFoundMessage = colors.red(util.format(messages.fileNotFound, pathToProjectFile));
        console.log(fileNotFoundMessage);

        exitProcess(ReturnCode.FileNotFound);

        return;
    }

    console.log(colors.green(util.format(messages.uploadingFile, pathToProjectFile)));

    var versionEyeApi = new VersionEyeApi(cliOptions.apikey, cliOptions.baseUrl);

    if (cliOptions.createproject) {
        versionEyeApi.createProjectByFile(pathToProjectFile, cliOptions.createproject, handleVersionEyeUpdateResponse);
    } else {
        versionEyeApi.updateProjectByFile(cliOptions.projectid, pathToProjectFile, handleVersionEyeUpdateResponse);
    }
}

function checkCliOptions() {
    if (!cliOptions.apikey) {
        console.log(colors.red(messages.missingApiKey));

        exitProcess(ReturnCode.MissingApiKey);

        return;
    }

    if (typeof cliOptions.createproject !== 'undefined') {
        if (typeof cliOptions.createproject !== 'string' ||
            typeof cliOptions.createproject.length === 'undefined' ||
            cliOptions.createproject.length === 0) {
            cliOptions.createproject = 'public';
        }

        if (cliOptions.projectid) {
            console.log(colors.red(util.format(messages.cannotUseCliTogether, 'createproject', 'projectid')));

            exitProcess(ReturnCode.InvalidCommandLineOption);

            return;
        }
    } else {
        if (!cliOptions.projectid) {
            console.log(colors.red(messages.missingProjectId));

            exitProcess(ReturnCode.MissingProjectId);

            return;
        }
    }

    if (cliOptions.globalinstalls && cliOptions.file) {
        console.log(colors.red(util.format(messages.cannotUseCliTogether, 'globalinstalls', 'file')));

        exitProcess(ReturnCode.InvalidCommandLineOption);

        return;
    }
}

function go() {
    if (cliOptions.help) {
        console.log(cli.getUsage({
            header: config.cli.usage
        }));

        exitProcess(ReturnCode.Ok);

        return;
    }

    if (cliOptions.version) {
        console.log(module.exports.version);

        exitProcess(ReturnCode.Ok);

        return;
    }

    cliOptions.baseUrl = cliOptions.baseurl || constants.defaultApiBaseUrl;

    checkCliOptions();

    if (cliOptions.globalinstalls) {
        uploadGloballyInstalledPackages();

        return;
    } else {
        uploadFile();
    }
}

go();
