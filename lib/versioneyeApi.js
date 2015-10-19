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
VersioneyeApi.prototype.updateProject = function(projectId, filePath, callback) {
    var formData = {
        project_file: fs.createReadStream(filePath)
    };

    request.post({
        url: util.format(config.uri, this.baseUrl, projectId, this.apiKey),
        formData: formData
    }, function(err, response, body) {
        if (err) {
            callback(err);
            return;
        }

        var statusCode = response.statusCode;
        var parsedBody = JSON.parse(body);

        if (statusCode == 200 || statusCode == 201) {
            callback();
        } else {
            callback(new Error('VersionEye API says "' + parsedBody.error + '"'));
        }
    });
};

module.exports = VersioneyeApi;