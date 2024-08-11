# Change Log

All notable changes to the "gcp-switch-configuration" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.6] - 2024-08-012

### Fixed

- update dependency (from github dependabot) 


## [2.2.5] - 2024-08-07

### Fixed

- Show refresh button with condition
- Refactor constants

## [2.2.4] - 2024-08-03

### Added

- Sync content between diffrent views
- Add refresh button on activity bar
- Refacto webview manager

## [2.2.3] - 2024-08-01

### Fixed

- fix text slice in gcp switch status bar item

## [2.2.2] - 2024-08-01

### Added

- Show spinner in status bar when switching configuration

### Changed

- Refactor status bar item

## [2.2.0] - 2024-02-09

### Added

- Enable clear ADC cache on individual configuration

### Changed

- Update README doc screenshots
- Enhance responsive ui

## [2.1.0] - 2024-01-06

### Added

- Add GCP config webview to activity bar & panel
- Enhance UI responsive when using activity bar

### Changed

- Change GCP Switch Config LOGO

## [2.0.3] - 2024-01-05

### Fixed

- Fix configuration rename when name didn't change

### Changed

- Enhance UI and dark/light theme colors
- speedUP configurations switch

### Added

- Auto publish new extension versions to VsCode marketplace

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
