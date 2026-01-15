# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.4.0](https://github.com/developerbd/azpinance/compare/v1.3.1...v1.4.0) (2026-01-15)


### Features

* Implement Backup & Disaster Recovery System (v1.3.1) ([472f6bc](https://github.com/developerbd/azpinance/commit/472f6bce951b31e794a642e038a45f55f45dd290))
* implement universal js backup with restoration scripts and detailed guides ([d70e842](https://github.com/developerbd/azpinance/commit/d70e842cb139f762f70d670194297ae4de7fc374))


### Bug Fixes

* Resolve MobileNav hydration mismatch ([3282217](https://github.com/developerbd/azpinance/commit/3282217785ac473358afa7706db8d8842034b6cf))

## [1.3.0] - 2026-01-11
### Added
- **Signup Control System**:
  - Global `signup_enabled` toggle in General Settings.
  - New `pending` user status workflow.
  - Automatic blocking of pending/suspended users at login and layout levels.
  - `handle_new_user` database trigger to default public signups to 'pending'.
- **Admin Features**:
  - "Approve User" action for pending users in User List.
  - Mutually exclusive status actions (Approve/Suspend/Activate) in User List dropdown.
  - Admin-created users are now automatically set to `active` status.
- **UX Improvements**:
  - "Account Under Review" dedicated view for pending users attempting to login.
  - Server-side signout enforcement for suspended/pending users to prevent client-side loading loops.
  - "Sign Up" link now correctly toggles visibility on the Login page based on system settings.

### Fixed
- **Username Login**: Fixed an issue where usernames were not being saved during creation (both via signup and admin), preventing username-based login.
- **Login Redirect Loop**: Resolved an infinite loading/redirect loop for pending users by implementing server-side session termination and stable Supabase client initialization.
- **Authentication**: Fixed typo in `create-user` server action where `status` was not being updated for admin creations.
