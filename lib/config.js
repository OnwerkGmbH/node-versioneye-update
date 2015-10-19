'use strict';

module.exports = {
    /**
     * The URI where to send the API request to. 
     */
    uri: 'https://%s/api/v2/projects/%s?api_key=%s',

    /**
     * The name of file that gets uploaded to versioneye.com
     */
    defaultProjectFile: 'package.json',

    /**
     * Default VersionEye API base path
     */
    defaultApiBaseUrl: 'www.versioneye.com',

    /** 
     * List all allowed file names or file pattern for uploading to versioneye.com
     */
    allowedProjectFiles: [
        'package.json',
        'bower.json',
        'Gemfile',
        'Gemfile.lock',
        'Podfile',
        'Podfile.lock',
        'composer.json',
        'composer.lock',
        'requirements.txt',
        'setup.py',
        'biicode.conf',
        'pom.xml',
        'project.clj',
        '*.gradle',
        '*.sbt'
    ],

    /**
     * Command line options
     */
    cli: {
        usage: 'Upload the dependency file of your project to versioneye.com',
        arguments: [{
            name: 'apikey',
            type: String,
            alias: 'a',
            description: 'versioneye.com API Key for user authentification'
        }, {
            name: 'projectid',
            type: String,
            alias: 'p',
            description: 'project id of the current project in versioneye.com'
        }, {
            name: 'file',
            type: String,
            alias: 'f',
            description: 'project file to upload to versioneye.com (if not specified: package.json)'
        }, {
            name: 'help',
            type: Boolean,
            alias: 'h',
            description: 'output usage information'
        }, {
            name: 'version',
            type: Boolean,
            alias: 'v',
            description: 'output the version number'
        }, {
            name: 'baseurl',
            type: String,
            alias: 'b',
            description: 'set the base URL for the VersionEye API. Only needed for VersionEye Enterprise!'
        }],
        messages: {
            fileNotFound: 'Sorry, but we could not find "%s"',
            invalidFileType: 'Sorry, please upload one of the following files to versioneye.com: ',
            missingApiKey: 'Sorry, please provide your api key like "-a <API_KEY>" from versioneye.com',
            missingProjectId: 'Sorry, please provide your project id like "-p <PROJECT_ID>" from versioneye.com',
            success: 'Successfully updated your project file from %s'
        }
    }
};