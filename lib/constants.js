'use strict';

module.exports = {
    /**
     * The URI where to send the project update request to.
     */
    uriUpdateProject: 'https://%s/api/v2/projects/%s?api_key=%s',

    /**
     * The URI where to send the project creation request to.
     */
    uriCreateProject: 'https://%s/api/v2/projects/?api_key=%s',

    /**
     * The URI where to send the project list request to.
     */
    uriListProjects: 'https://%s/api/v2/projects?api_key=%s',

    /**
     * The name of file that gets uploaded to versioneye.com
     */
    defaultProjectFile: 'package.json',

    /**
     * Default VersionEye API base path
     */
    defaultApiBaseUrl: 'www.versioneye.com',

    /**
     * Configuration file name
     */
    configFileName: '.versioneye-update.json',

    /**
     * List all allowed file names or file pattern for uploading to versioneye.com
     */
    allowedProjectFiles: [
        'package.json',         // NPM (Node.JS)
        'npm-shrinkwrap.json',
        'package-lock.json',
        'JSPN.io',
        'yarn.lock',            // Yarn (Node.JS)
        'bower.json',           // Bower (JavaScript)
        'Gemfile',              // Bundler (Ruby)
        'Gemfile.lock',
        'Podfile',              // CocoaPods (Objective-C)
        'Podfile.lock',
        'composer.json',        // Composer (PHP)
        'composer.lock',
        'requirements.txt',     // PIP (Python)
        'setup.py',
        'biicode.conf',         // Biicode (C/C++)
        'pom.xml',              // Maven (Java)
        'project.clj',          // Leiningen (Clojure)
        '*.gradle',             // Gradle (Groovy)
        '*.sbt',                // SBT (Scala)
        'project.json',         // Nuget (Microsoft .NET platform)
        'package.conf',
        '*.nuspec',
        'metadata.rb',          // Berkshelf (Chef)
        'Berksfile',
        'Berksfile.lock'
    ]
};
