# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Team selection modal no longer appears repeatedly due to username state changes

## [0.2.0] - 2026-01-23

### Added

- Shop functionality with improved asset merging
- Login state tracking for better user experience
- Persistent debugging logs for development
- Auth debug overlay for troubleshooting
- Rolling 24-hour filter for daily leaderboard period

### Fixed

- Strict null checks and lint errors across codebase
- Shop now preserves local cosmetic images when database has null values
- Team selection modal appearing repeatedly
- Type errors in achievements and translations systems
- Leaderboard filtering now correctly enforces rolling 24-hour period
- Mobile authentication flow using popup instead of redirect
- Browser local persistence explicitly set for authentication
- Redirect loop issues with username normalization
- Duplicate user handling in profile creation
- Race conditions in authentication state management

### Changed

- Consolidated authentication state management
- Improved mobile device authentication handling
- Final code formatting and consistency improvements

## [0.1.0] - Initial Release

### Added

- Interactive Barcelona streets quiz game
- Daily challenge system with date-based seeding
- Speed-based scoring system (250-1000 points)
- Firebase Authentication (Google & Email/Password)
- Firestore database for user profiles and scores
- Leaflet-powered interactive map
- Smart hint system with nearby street overlays
- Global leaderboards (daily, weekly, all-time, districts)
- District team system (10 Barcelona districts)
- Social features (friends, profiles, achievements)
- In-game shop with customizable avatars, frames, and titles
- Dark/Light/Auto theme support
- PWA support with offline capabilities
- Responsive design for mobile, tablet, and desktop

[unreleased]: https://github.com/robdoesthething/Girify/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/robdoesthething/Girify/releases/tag/v0.2.0
[0.1.0]: https://github.com/robdoesthething/Girify/releases/tag/v0.1.0
