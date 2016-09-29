'use strict';

module.exports = {
    /**
     * Command line cliOptions
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
            name: 'baseurl',
            type: String,
            alias: 'b',
            description: 'set the base URL for the VersionEye API. Only needed for VersionEye Enterprise!'
        }, {
            name: 'help',
            type: Boolean,
            alias: 'h',
            description: 'prints usage information'
        }, {
            name: 'version',
            type: Boolean,
            alias: 'v',
            description: 'prints the version number'
        }, {
            name: 'dump',
            type: Boolean,
            alias: 'd',
            description: 'dumps VersionEye output'
        }, {
            name: 'licensecheck',
            type: Boolean,
            alias: 'l',
            description: 'fails if any license is violated'
        }, {
            name: 'securitycheck',
            type: Boolean,
            alias: 's',
            description: 'fails if any of the used components is known to have security vulnerabilities'
        }, {
            name: 'listoutdated',
            type: Boolean,
            alias: 'o',
            description: 'lists used components that are noted as outdated'
        }, {
            name: 'failonoutdated',
            type: Boolean,
            description: 'fails if any of the used components is noted as outdated'
        }, {
            name: 'ignorechecks',
            type: Boolean,
            alias: 'i',
            description: 'does not use special exit codes to signal failed license, security or up-to-date checks'
        }, {
            name: 'globalinstalls',
            type: Boolean,
            alias: 'g',
            description: 'creates a pseudo package.json file from the globally installed npm packages and uploads this file. ' +
                'Used to be notified when new versions of the globally installed packages become available. ' +
                'Cannot be used together with the \'file\' parameter'
        }, {
            name: 'globalpackagename',
            type: String,
            description: 'defines the name of the package.json file that gets created with --globlainstalls.'
        }, {
            name: 'configfile',
            alias: 'c',
            type: String,
            description: 'Specifies the config file to use'
        }, {
            name: 'createproject',
            type: String,
            description: 'Creates a new project on VersionEye. It is possible to specify the visibility by adding `public` or `private`. ' +
                'It does not check if there is already a project with the same name. Cannot be used with --projectid.'
        }],
        messages: {
            relativeFilePathNotFound: '"%s" not found, trying as relative file specification to cwd "%s"',
            fileNotFound: 'Sorry, but we could not find "%s"',
            invalidFileType: 'Unknown file type, please upload one of the following files to versioneye.com: ',
            missingApiKey: 'Sorry, please provide your api key like "-a <API_KEY>" from versioneye.com',
            missingProjectId: 'Sorry, please provide your project id like "-p <PROJECT_ID>" from versioneye.com',
            licenseRed: 'At least one license violation occurred',
            outdated: 'The following components are outdated:',
            licenseCheckPass: 'License check passed',
            allComponentsAreUpToDate: 'All components are up to date.',
            securityVulnerabilityKnown: '%d known security vulnerability',
            securityCheckPass: 'Security vulnerability check passed',
            success: 'Successfully updated your VersionEye project',
            successCreation: 'Successfully created your VersionEye project "%s", new project ID is: %s',
            cannotUseCliTogether: 'Cannot use command line argument %s with command line argument %s',
            failedToCallNpm: 'Failed to get a list of globally installed packages from npm',
            uploadingFile: 'Uploading file %s',
            creatingGlobalPackageFile: 'Creating package file from globally installed packages',
            cannotCreateProjectWhenKeyIsGiven: 'Cannot use -createproject in combination with --projectid',
            skippingCreationOptionFileExist: 'Skipping creation of option file because file already exists, please update it manually: %s',
            savedOptionFile: 'Saved cliOptions to config file: %s\nYou may add this file to your repository.'
        }
    }
};