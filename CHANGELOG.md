# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.4.1] - 09/30/2016
### Changed
- Changed Windows-style line endings to Unix-style line endings for bin/versioneye-update

## [1.4.0] - 09/25/2016
### Added
- Adding possibility to create and update projects containing the globally installed npm packages
- Added `--createproject` command line parameter to create projects via command line
- Added configuration files

## [1.3.0] - 07/27/2016
### Added
- Allow upload of project files for package manager Nuget (Microsoft .NET platform) and Berkshelf (Chef)

## [1.2.2] - 07/07/2016
### Changed
- Changed Windows-style line endings to Unix-style line endings for bin/versioneye-update, fixing [#7](https://github.com/OnwerkGmbH/node-versioneye-update/issues/7)

## [1.2.1] - 06/02/2016
### Changed
- Explicitly defining bin-path in package.json für [npm bug on windows](https://github.com/npm/npm/issues/10604), fixing [#6](https://github.com/OnwerkGmbH/node-versioneye-update/issues/6)

## [1.2.0] - 06/01/2016
### Added
- [#5](https://github.com/OnwerkGmbH/node-versioneye-update/issues/5) Implemented license check, security check.
- Added option to return exit code to signal outdated components.
- More options to control behaviour.


## [1.1.0] - 10/19/2015
### Added
- [#2](https://github.com/OnwerkGmbH/node-versioneye-update/pull/2) New command line parameter for server host. This enables the usage of versioneye-update for VersionEye Enterprise servers. (@kwiatekus)

### Changed
- Update dependency command-line-args from ^1.0.x to ^2.0.2

## [1.0.2] - 09/30/2015
### Changed
- Update dependency minimatch from ^2.0.10 to ^3.0.0

## [1.0.1] - 09/18/2015

### Added
- Add this changelog file 

### Changed
- Extend description and samples in README.md 

### Fixed
- Fix wrong data type of preferGlobal property in package.json
- Fix command line output with wrong usage of a format string