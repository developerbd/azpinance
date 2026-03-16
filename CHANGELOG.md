# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.1](https://github.com/developerbd/azpinance/compare/v1.4.0...v1.4.1) (2026-03-16)


### Bug Fixes

* bypass fetch caching in getContactsWithDue ([e37e6eb](https://github.com/developerbd/azpinance/commit/e37e6eb7047ee09b5921f3bb4d4c85000ae633f2))
* **contacts:** fetch all payment/forex rows bypassing 1000 API limit ([5268daf](https://github.com/developerbd/azpinance/commit/5268daf6a99ab43f83a5e7b5f1abf395114449ce))
* **contacts:** invalidate client router cache on new supplier payment ([07bf26e](https://github.com/developerbd/azpinance/commit/07bf26e0aa9c253358ab348f40b953fd8c9837e4))
* **hooks:** Refactor useMediaQuery to useSyncExternalStore ([10d728c](https://github.com/developerbd/azpinance/commit/10d728c3aff473532cb073583af514e5cc75a95f))

## [1.4.0] - 2026-01-15
### Features
- **Disaster Recovery**: Implemented universal JS backup with restoration scripts and detailed guides.
- **Backup System**: Added Backup & Disaster Recovery System.
- **Bulk Import**: Added Bulk Import capabilities.
- **Global Timezone**: Implemented Global Timezone support.
- **Optimization**: Codebase optimization and MobileNav hydration mismatch fix.

## [1.3.1] - 2026-01-12
### Features
- **Bulk Import**: Added bulk import functionality.
- **Timezone**: Added global timezone support.
- **Optimization**: General codebase optimizations.

## [1.3.0] - 2026-01-11
### Features
- **Signup Control System**:
  - Global `signup_enabled` toggle in General Settings.
  - New `pending` user status workflow.
  - Automatic blocking of pending/suspended users.
  - `handle_new_user` database trigger.
- **Admin Features**:
  - "Approve User" action for pending users.
  - Mutually exclusive status actions (Approve/Suspend/Activate).
- **UX Improvements**:
  - "Account Under Review" dedicated view.
  - Server-side signout enforcement.

## [1.2.0] - 2026-01-04
### Features
- **Supplier Portal**: Implemented comprehensive Supplier Portal with pagination and accurate stats.
- **Account Management**: Added category column and filtering to financial accounts list.
- **Reporting**: Enhanced forex filtering/export.
- **Branding**: Updated branding elements and stats cards themes.
- **Performance**: Significant performance optimizations and security hardening.

## [1.1.0] - 2025-12-08
### Features
- **AI Integration**: AI Chatbot Enhancement.
- **Security**: Added Zod validation, auth checks, and role-based access control.
- **UI/UX**: Fixed UI glitches, flickering delete menus, and navigation issues.
- **Forex**: Major refactor of Forex forms for mobile responsiveness and dropdown stability.

## [1.0.0] - 2025-12-07
### Initial Release
- **Core Platform**: Complete app overhaul with modern UI.
- **Modules**: Dashboard, Transactions, Digital Expenses, Contacts.
- **Security**: Basic security implementation and optimizations.
- **System Status**: Implemented system status monitoring.
- **Exports**: Secure export functionality.
