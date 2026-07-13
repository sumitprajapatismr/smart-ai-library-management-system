# Changelog - Smart AI Powered Library Management System

All notable upgrades and architectural improvements to the system are documented in this ledger.

---

## [1.2.0] - 2026-07-11

### Added
- **AI Digital Librarian (ALPHA Pro)**: Speech-to-Text inputs, Text-to-Speech audio reads, and LocalStorage history cache persistence.
- **AI Study Suite Tab panels**:
  - `MoodTrackerTab.tsx`: Select moods to retrieve matching Gemini book recommendations.
  - `StudyRoomsTab.tsx`: Book smart group study rooms.
  - `ReadingChallengeTab.tsx`: Join the 30-Day streak challenge and page logs.
  - `KnowledgeGraphTab.tsx`: Visual SVG category relation mappings.
  - `NotesCitationTab.tsx`: Format IEEE, APA, and MLA citations.
  - `MindMapTab.tsx`: Expandable vector study trees.
  - `CodingPracticeTab.tsx`: Placements MCQ testing hubs.
  - `LearningTimelineTab.tsx`: Milestone checkpoints tracker.
  - `DigitalTwinTab.tsx`: Real-time seat occupancy and hourly chekout heatmaps.
- **Publications Archive Hub**: `ResearchHub.tsx` lists IEEE/White papers with DOI queries and bookmarks.
- **Events & Timelines**: `EventsManagement.tsx` schedules hackathons and downloads completion certificates.
- **Smart Notification Drawer**: `NotificationsDrawer.tsx` filters alarms.
- **Operations Analytics**: `AdminDashboard.tsx` tracks revenue forecasts and inactive accounts.
- **Offline Caching wrapper**: `offlineSync.ts` stores request caches offline.

### Changed
- **Branding Update**: All pages, navbars, dashboards, and README footers updated to **Created by Sumit Prajapati**.
- **Developer Info**: Swapped support address to `prajapatisumitop@gmail.com`.
- **jsPDF autotable Fix**: Corrected prototype autoTable syntax to prevent tree-shaking compilation crashes.
- **E-Book fullscreen iframe** and **Audiobook player drawers** integrated.
