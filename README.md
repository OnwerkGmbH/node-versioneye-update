[![Dependency Status](https://www.versioneye.com/nodejs/versioneye-update/badge.svg)](https://www.versioneye.com/nodejs/versioneye-update)

# versioneye-update

VersionEye can monitor your project on GitHub/Bitbucket and notify you about out-dated dependencies and license violations. The integration via the GitHub/Bitbucket API works very well and is very convenient. However, this only works with publicly hosted repositories. 
This project uses the VersionEye API to update an already created VersionEye project with the current revision of a monitored file.
The command line tool can be integrated in build jobs running on continuous integration systems like Jenkins.

## Installation

```bash
$ npm install versioneye-update -g
```

## Usage

Update a node.js project in the current directory:

```bash
versioneye-update --apikey <API_KEY> --projectid <PROJECT_ID> 
```

Upload an other project type: 
```bash
versioneye-update --apikey <API_KEY> --projectid <PROJECT_ID> --file <PROJECT_FILE>
```
## Supported project files 

Currently VersionEye supports 11 package managers. You can throw any of this project files against the [VersionEye API](https://www.versioneye.com/api/). 

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
 
For Maven multi module projects (reactor builds) please use the [VersionEye Maven Plugin](https://github.com/versioneye/versioneye_maven_plugin). 

## Feedback 

For feedback please open a ticket here on GitHub. 
