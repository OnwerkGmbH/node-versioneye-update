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
var VersioneyeApi = require('./versioneyeApi');

pkginfo(module, 'version');

var cli = cliArgs(config.cli.arguments);
var options = cli.parse();

if (options.help) {
    console.log(cli.getUsage({
        header: config.cli.usage
    }));
    return;
}

if (options.version) {
    console.log(module.exports.version);
    return;
}

var apiKey = options.apikey;

var baseurl = options.baseurl;
if (!baseurl) {
    baseurl = 'versioneye.com';
}

if (!apiKey) {
    console.log(colors.red(config.cli.messages.missingApiKey));
    return;
}

var projectId = options.projectid;

if (!projectId) {
    console.log(colors.red(config.cli.messages.missingProjectId));
    return;
}

var pathToProjectFile = options.file || config.defaultProjectFile;
var nameOfProjectFile = path.basename(pathToProjectFile);

var isFileAllowed = _.any(config.allowedProjectFiles, function(allowedFile) {
    return minimatch(nameOfProjectFile, allowedFile);
});

if (!isFileAllowed) {
    console.log(colors.red(config.cli.messages.invalidFileType));
    console.log(prettyjson.render(config.allowedProjectFiles));
    return;
}

var filePath = path.join(process.cwd(), path.normalize(pathToProjectFile));
var projectFileExists = false;

try {
    projectFileExists = fs.lstatSync(filePath).isFile();
} catch (ex) {
    var fileNotFoundMessage = colors.red(util.format(config.cli.messages.fileNotFound, filePath));
    console.log(fileNotFoundMessage);
}

if (projectFileExists) {
    var versioneyeApi = new VersioneyeApi(apiKey);

    versioneyeApi.updateProject(baseurl, projectId, filePath, function(err) {
        if (err) {
            console.log(colors.red(err));
            return;
        }

        var successMessage = colors.green(util.format(config.cli.messages.success, filePath));
        console.log(successMessage);
        return;
    });
}