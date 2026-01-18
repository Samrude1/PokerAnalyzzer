# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-12-16

### Added
- **Hand History Import**: A dedicated `/import` page for parsing external hand histories.
- **PokerStars Parser**: `HandHistoryParser` utility to extract hand metadata, board, and results from raw text.
- **Drag & Drop Support**: UI for easily uploading hand history files.

## [1.0.0] - 2025-12-15

### Added
- **Multi-Page Architecture**: Implemented React Router with Login, Home, and Game pages.
- **Local Persistence**: `StorageService` for saving users, sessions, and hand histories to browser LocalStorage.
- **Mock Authentication**: `AuthContext` to handle user state without a backend.
- **Rust Architecture Plan**: Added `ADR-002` and Roadmap for future GTO engine integration.

### Changed
- Refactored `App.tsx` into smaller page components.
- Updated `BotLogic` to support "Mixed" difficulty tables.
- Updated documentation (README, ARCHITECTURE, ROADMAP).

## [0.1.0] - 2025-12-14

### Added
- Initial MVP release.
- 6-Max No-Limit Hold'em game engine.
- Basic AI Bots (Beginner - Pro).
- Session Analytics Dashboard.
