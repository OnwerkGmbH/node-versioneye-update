'use strict';

var _ = require('underscore');
var cliArgs = require('command-line-args');
var colors = require('colors');
var fs = require('fs');
var minimatch = require('minimatch');
var path = require('path');
var pkginfo = require('pkginfo');
var prettyjson = require('prettyjson');
var util = require('util');

var config = require('./config');
var VersionEyeApi = require('./versioneyeApi');

pkginfo(module, 'version');

var ReturnCode = {
    Ok: 0,
    ApiCallFailed: -1,
    FileNotFound: -2,
    LicenseCheckFailed: -3,
    SecurityViolationCheckFailed: -4,
    InvalidFileType: -5,
    MissingApiKey: -6,
    MissingProjectId: -7,
    OutdatedComponentsFailed: -8
};

var cli = cliArgs(config.cli.arguments);
var options = cli.parse();

function setReturnCode(code) {
    if (options) {
        if (options.ignorechecks) {
            code = 0;
        }
    }

    process.exit(code);
}

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

var apiKey = options.apikey;

var baseUrl = options.baseurl || config.defaultApiBaseUrl;

if (!apiKey) {
    console.log(colors.red(config.cli.messages.missingApiKey));

    setReturnCode(ReturnCode.MissingApiKey);
    return;
}

var projectId = options.projectid;

if (!projectId) {
    console.log(colors.red(config.cli.messages.missingProjectId));

    setReturnCode(ReturnCode.MissingProjectId);
    return;
}

var pathToProjectFile = options.file || config.defaultProjectFile;
var nameOfProjectFile = path.basename(pathToProjectFile);

var isFileAllowed = _.any(config.allowedProjectFiles, function (allowedFile) {
    return minimatch(nameOfProjectFile, allowedFile);
});

if (!isFileAllowed) {
    console.log(colors.red(config.cli.messages.invalidFileType));
    console.log(prettyjson.render(config.allowedProjectFiles));

    setReturnCode(ReturnCode.InvalidFileType);
    return;
}

var projectFileExists = false;

var filePath = path.normalize(pathToProjectFile);

try {
    projectFileExists = fs.lstatSync(filePath).isFile();
} catch (ex) {
}

if (!projectFileExists) {
    console.log(util.format(config.cli.messages.relativeFilePathNotFound, pathToProjectFile, process.cwd()));

    filePath = path.join(process.cwd(), path.normalize(pathToProjectFile));

    try {
        projectFileExists = fs.lstatSync(filePath).isFile();
    } catch (ex) {
    }
}

if (!projectFileExists) {
    var fileNotFoundMessage = colors.red(util.format(config.cli.messages.fileNotFound, pathToProjectFile));
    console.log(fileNotFoundMessage);

    setReturnCode(ReturnCode.FileNotFound);
    return;
} else {
    var versionEyeApi = new VersionEyeApi(apiKey, baseUrl);

    versionEyeApi.updateProject(projectId, filePath, function (parsedBody, err) {
        if (options.dump) {
            console.log(parsedBody);
        }

        if (err) {
            console.log(colors.red(err));
            setReturnCode(ReturnCode.ApiCallFailed);
            return;
        }

        console.log(colors.green(util.format(config.cli.messages.success, filePath)));

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
                        console.log(colors.red(util.format("%s (%s/%s)", dependency.name, dependency.version_requested, dependency.version_current)));
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
    });
}