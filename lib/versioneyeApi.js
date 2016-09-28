'use strict';

const fs = require('fs');
const util = require('util');
const request = require('request');

const constants = require('./constants');

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
        url: util.format(constants.uriUpdateProject, this.baseUrl, projectId, this.apiKey),
        formData: formData
    }, function (err, response, body) {
        if (err) {
            callback(err);

            return;
        }

        var statusCode = response.statusCode;
        try {
            var parsedBody = JSON.parse(body);

            if (statusCode === 200 || statusCode === 201) {
                callback(parsedBody);

                return;
            } else {
                callback(parsedBody, new Error('VersionEye API says "' + parsedBody.error + '"'));

                return;
            }
        } catch (ex) {
            callback({}, new Error('Failed to parse VersionEye API return object: "' + ex + '"'));

            return;
        }
    });
};

/**
 * Update a project in versioneye via package file upload
 * @param  {Function} callback  - Callback function(err)
 * @return {undefined}
 */
VersioneyeApi.prototype.listProjects = function (callback) {
    request.get({
        url: util.format(constants.uriListProjects, this.baseUrl, this.apiKey)
    }, function (err, response, body) {
        if (err) {
            callback(err);

            return;
        }

        var statusCode = response.statusCode;
        try {
            var parsedBody = JSON.parse(body);

            if (statusCode === 200 || statusCode === 201) {
                callback(parsedBody);

                return;
            } else {
                callback(parsedBody, new Error('VersionEye API says "' + parsedBody.error + '"'));

                return;
            }
        } catch (ex) {
            callback({}, new Error('Failed to parse VersionEye API return object: "' + ex + '"'));

            return;
        }
    });
};

/**
 * Update a project in versioneye via package file upload
 * @param  {String}   filePath  - Path to package file
 * @param   {String}   visibility - The visibility of the project to be created
 * @param  {Function} callback  - Callback function(err)
 * @return {undefined}
 */
VersioneyeApi.prototype.createProjectByFile = function (filePath, visibility, callback) {
    var fileContent = fs.createReadStream(filePath);

    return this.createProjectByContent(fileContent, visibility, callback);
};

/**
 * Update a project in versioneye via package file upload
 * @param   {object}   fileContent - The file content
 * @param   {String}   visibility - The visibility of the project to be created
 * @param   {Function} callback  - Callback function(err)
 * @return  {undefined}
 */
VersioneyeApi.prototype.createProjectByContent = function (fileContent, visibility, callback) {
    var formData = {
        upload: fileContent,
        visibility: visibility
    };

    request.post({
        url: util.format(constants.uriCreateProject, this.baseUrl, this.apiKey),
        formData: formData
    }, function (err, response, body) {
        if (err) {
            callback(err);

            return;
        }

        var statusCode = response.statusCode;
        try {
            var parsedBody = JSON.parse(body);

            if (statusCode === 200 || statusCode === 201) {
                callback(parsedBody);

                return;
            } else {
                callback(parsedBody, new Error('VersionEye API says "' + parsedBody.error + '"'));

                return;
            }
        } catch (ex) {
            callback({}, new Error('Failed to parse VersionEye API return object: "' + ex + '"'));

            return;
        }
    });
};

module.exports = VersioneyeApi;