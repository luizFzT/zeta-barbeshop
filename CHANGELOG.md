# Changelog

All notable changes to the Zeta Barbershop project will be documented in this file.

## [Unreleased]
### Fixes
- **Queue System:** Resolved an issue resulting in duplicate queue entries. Removed side effects from React state updaters in the `useBarbershop` hook to prevent multiple consecutive saves in StrictMode. Added an `isJoining` state to the client side join flow, preventing simultaneous API calls due to double clicks.

### Changed
- **Branding & Logos:** Generated a premium Cyberpunk Neon visual identity. Applied an image-based shield logo for the `LandingPage` and `AuthLayout` screens, and created a custom horizontal SVG (`logo-zeta-neon.svg`) for the `DashboardPage` top navbar.
- **Dashboard UI:** Removed the defunct hamburger menu icon from the top header to encourage bottom bar navigation. Renamed "Command Center" to "Dashboard" for clarity.
- Dashboard redesign (`DashboardPage.jsx`, `.css`): Centered layout horizontally for bigger screens to mirror mobile harmony.
- Fixed animated queue timer synchronization bug on `ClientQueuePage.jsx`. The SVG path now correctly uses a normalized `pathLength` to match the CSS rotation of the glowing dot.

### Added
- **PWA Capabilities:** Added `manifest.json` pointing to the new Cyberpunk shield logo, allowing users to install the system to their phone home screen with a proper native App Icon. Replaced the generic Vite favicons.
- **Analytics Tab:** Restored the "Analytics" (Estatísticas) tab to the Barber Dashboard's bottom navigation, correctly rendering the `StatsSection` component for performance insights.
- **Barber Identity Profile (Single-Professional):** Added the ability for barbers to define their personal name and picture independently from the Barbershop brand. The Dashboard Settings now features a "Perfil do Barbeiro" image upload logic, and the Client Queue Page has a restored dual-card layout visually separating the Shop from the Barber.
- Created `CHANGELOG.md` to track all future alterations as requested by the user.
