# Changelog

All notable changes to this project will be documented in this file.

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
