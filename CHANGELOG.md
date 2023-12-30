# Change Log

All notable changes to the "gcp-switch-configuration" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Initial release

## [2.0.0] - 2023-12-30

### Added

- Create, Update and delete configurations.
- Autocomplete projects list in the gcp form.
- Add validations for the gcp form.
- Search for configurations by name, projectId and account.

### Changed

- Enhance Readme introduction toi the extension

## [1.1.0] - 2023-12-21

### Added

- Show spinner when changing config
- Enhance card selection UI

### Fixed

- Fix panel iconPath

## [0.3.0] - 2023-12-21

### Added

- Show ADC.json file after config switch
- Add ADC.json link to open manually

## [0.2.0] - 2023-12-20

### Changed

- Change extension repo to open source later
- Migrate base code to Typescript
- Run gcloud script commands with Nodejs instead of vscode terminal

### Added

- Add ADC cache (extension global cache)
- Show warning on undefined config Account and projectId

### Fixed

- Fix green flag indicator when switching config

## [0.1.4] - 2023-12-17

### Added

- Show current active gcp config on the topbar
- Show config account
- Enhance UX/UI
