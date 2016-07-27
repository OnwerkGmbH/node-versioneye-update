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
        'package.json', // NPM (Node.JS)
        'bower.json', // Bower (JavaScript)
        'Gemfile', // Bundler (Ruby)
        'Gemfile.lock',
        'Podfile', // CocoaPods (Objective-C)
        'Podfile.lock',
        'composer.json', // Composer (PHP)
        'composer.lock',
        'requirements.txt', // PIP (Python)
        'setup.py',
        'biicode.conf', // Biicode (C/C++)
        'pom.xml', // Maven (Java)
        'project.clj', // Leiningen (Clojure)
        '*.gradle', // Gradle (Groovy)
        '*.sbt', // SBT (Scala)
        'project.json', // Nuget (Microsoft .NET platform)
        'package.conf',
        '*.nuspec',
        'metadata.rb', // Berkshelf (Chef)
        'Berksfile',
        'Berksfile.lock'
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
        }],
        messages: {
            relativeFilePathNotFound: '"%s" not found, trying as relative file specification to cwd "%s"',
            fileNotFound: 'Sorry, but we could not find "%s"',
            invalidFileType: 'Sorry, please upload one of the following files to versioneye.com: ',
            missingApiKey: 'Sorry, please provide your api key like "-a <API_KEY>" from versioneye.com',
            missingProjectId: 'Sorry, please provide your project id like "-p <PROJECT_ID>" from versioneye.com',
            licenseRed: 'At least one license violation occurred',
            outdated: 'The following components are outdated:',
            licenseCheckPass: 'License check passed',
            allComponentsAreUpToDate: 'All components are up to date.',
            securityVulnerabilityKnown: '%d known security vulnerability',
            securityCheckPass: 'Security vulnerability check passed',
            success: 'Successfully updated your project file from %s'
        }
    }
};