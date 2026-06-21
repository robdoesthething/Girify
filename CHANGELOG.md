# Changelog

## [Unreleased] - 2026-06-20

### Added

- Your district team is now shown below your username in the individual leaderboard.
- The quiz now shows a live score countdown while you think — the faster you answer, the higher your score. Hints are more prominent and the quiz layout is more compact.

### Fixed

- Fixed a visual glitch where a leftover shadow appeared on an answer option at the start of a new question.
- Team names in the leaderboard now always display in their correct English form.
- New players signing in with Google are now correctly prompted to choose a district team.
- Score totals on the end-of-game summary now show the correct maximum value.

### Improved

- The app loads faster — the loading screen clears as soon as sign-in resolves, without waiting for background sync.
- Pages appear more quickly on first visit thanks to faster initial rendering.

## [Unreleased] - 2026-06-19

### Added

- The site is now discoverable by search engines and AI assistants — a sitemap and crawler guidance file have been added.
- Pages now include the correct shareable URL, so links posted to social media or messaging apps show the right preview.
- The leaderboard and About pages now have proper titles and descriptions for search results.

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

## [0.1.0] - 2026-01-01

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

[0.2.0]: https://github.com/robdoesthething/Girify/releases/tag/v0.2.0
[0.1.0]: https://github.com/robdoesthething/Girify/releases/tag/v0.1.0
