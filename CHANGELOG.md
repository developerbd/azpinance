# Changelog

All notable changes to this project will be documented in this file.

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
