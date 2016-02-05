[![Dependency Status](https://www.versioneye.com/nodejs/versioneye-update/badge.svg)](https://www.versioneye.com/nodejs/versioneye-update)

# versioneye-update

[VersionEye](https://www.versioneye.com) can monitor your project on GitHub/Bitbucket and notify you about out-dated dependencies and license violations. The integration via the GitHub/Bitbucket API works very well and is very convenient. However, this only works with publicly hosted repositories. 

This module uses the VersionEye API to update an already created VersionEye project with the current revision of a monitored file. VersionEye will automatically check your project and notify you about outdated dependencies. This can be used to monitor dependency files of internally hosted projects.

The command line tool can be integrated in build jobs running on continuous integration systems like Jenkins.

## Installation

```bash
$ npm install versioneye-update -g
```

## Usage

Update a node.js project in the current directory:

```bash
$ versioneye-update --apikey <API_KEY> --projectid <PROJECT_ID> 
```

Upload an other project type: 

```bash
$ versioneye-update --apikey <API_KEY> --projectid <PROJECT_ID> --file <PROJECT_FILE>
```
Upload using enterprise VersionEye API:

```bash
$ versioneye-update --apikey <API_KEY> --projectid <PROJECT_ID> --file <PROJECT_FILE> --baseurl <ENTERPRISE_API_URL>
```


## API Key
You can use some of the resources at the VersionEye API without an API KEY, but for uploading project files you need one. If you are signed up you can find your API KEY here: https://www.versioneye.com/settings/api.

![VersionEye Dependencies](https://raw.githubusercontent.com/versioneye/versioneye_maven_plugin/master/src/site/images/VersionEyeApiKey.png)

## Example integration 

Use versioneye-update as a [Jenkins](https://jenkins-ci.org/) Post-build Action

![Jenkins integration](http://www.onwerk.de/wp-content/uploads/2015/09/jenkins-integration.png)	

## Supported project files 

Currently VersionEye supports various package managers. You can throw any of this project files against the [VersionEye API](https://www.versioneye.com/api/). 

 - Gemfile 
 - Gemfile.lock 
 - Podfile 
 - Podfile.lock 
 - package.json 
 - composer.json 
 - composer.lock
 - bower.json 
 - requirements.txt 
 - setup.py 
 - biicode.conf 
 - pom.xml 
 - project.clj 
 - *.gradle 
 - *.sbt 

## Feedback 

For feedback please open a ticket here on GitHub. 