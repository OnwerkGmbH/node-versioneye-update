'use strict';

var fs = require('fs');
var util = require('util');
var request = require('request');

var config = require('./config');

/**
 * Create a new versioneye API client for a specific user account
 * @param {String} apiKey - The versioneye api key that belongs to a specific user account
 * @param {String} baseUrl - The baseUrl for the versionEye API
 */
function VersioneyeApi(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
}

/**
 * Update a project in versioneye via package file upload
 * @param  {String}   projectId - The versioneye project id
 * @param  {String}   filePath  - Path to package file
 * @param  {Function} callback  - Callback function(err)
 * @return {undefined}
 */
VersioneyeApi.prototype.updateProjectByFile = function (projectId, filePath, callback) {
    var fileContent = fs.createReadStream(filePath);

    return this.updateProjectByContent(projectId, fileContent, callback);
};

/**
 * Update a project in versioneye via package file upload
 * @param  {String}   projectId - The versioneye project id
 * @param  {object}   fileContent - The file content
 * @param  {Function} callback  - Callback function(err)
 * @return {undefined}
 */
VersioneyeApi.prototype.updateProjectByContent = function (projectId, fileContent, callback) {
    var formData = {
        project_file: fileContent
    };

    request.post({
        url: util.format(config.uriUpdateProject, this.baseUrl, projectId, this.apiKey),
        formData: formData
    }, function (err, response, body) {
        if (err) {
            callback(err);
            return;
        }

        var statusCode = response.statusCode;
        try {
            var parsedBody = JSON.parse(body);

            if (statusCode == 200 || statusCode == 201) {
                callback(parsedBody);
            } else {
                callback(parsedBody, new Error('VersionEye API says "' + parsedBody.error + '"'));
            }
        } catch (ex) {
            callback({}, new Error('Failed to parse VersionEye API return object: "' + ex + '"'));
        }
    });
};

/**
 * Update a project in versioneye via package file upload
 * @param  {String}   projectId - The versioneye project id
 * @param  {String}   filePath  - Path to package file
 * @param  {Function} callback  - Callback function(err)
 * @return {undefined}
 */
VersioneyeApi.prototype.listProjects = function (callback) {
    request.get({
        url: util.format(config.uriListProjects, this.baseUrl, this.apiKey)
    }, function (err, response, body) {
        if (err) {
            callback(err);
            return;
        }

        var statusCode = response.statusCode;
        try {
            var parsedBody = JSON.parse(body);

            if (statusCode == 200 || statusCode == 201) {
                callback(parsedBody);
            } else {
                callback(parsedBody, new Error('VersionEye API says "' + parsedBody.error + '"'));
            }
        } catch (ex) {
            callback({}, new Error('Failed to parse VersionEye API return object: "' + ex + '"'));
        }
    });
};

module.exports = VersioneyeApi;