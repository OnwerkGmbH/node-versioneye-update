'use strict';

module.exports = {
    relativeFilePathNotFound: '"%s" not found, trying as relative file specification to cwd "%s"',
    fileNotFound: 'Cannot find file "%s"',
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
    successCreation: 'Successfully created your VersionEye project "%s", new project ID is: "%s"',
    cannotUseCliTogether: 'Cannot use command line argument "%s" with command line argument "%s"',
    failedToCallNpm: 'Failed to get a list of globally installed packages from npm',
    uploadingFile: 'Uploading file %s',
    creatingGlobalPackageFile: 'Creating package file from globally installed packages',
    skippingCreationOptionFileExist: 'Skipping creation of option file because file already exists, please update it manually: %s',
    savedOptionFile: 'Saved options to config file: %s',
    addThisFileToRepository: 'You may add this file to your repository.',
    storeThisFileLocally: 'You can use this file for automated uploads to VersionEye, i.e. via cron.'
};