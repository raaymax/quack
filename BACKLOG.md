# Quack Chat - Backlog

## Overview

Ideas for cleanup, refactoring, and features. Not prioritized - pick what makes sense.

---

## 1. Storybook Cleanup ✅ COMPLETE

**Goal:** Unify all 58 story files with consistent patterns, fix broken config, add missing features.

### 1.1 Config Fixes ✅

- [x] **Remove broken theme.tsx** - References non-existent `my-theme-folder`
- [x] **Enable modes.ts** - Mobile/desktop viewport modes defined but not wired up
- [x] **Move styles import to preview.tsx** - Stop requiring manual import in every story
- [x] **Add default layout parameter** - Set global `centered` or `padded` layout

### 1.2 Story Template Standardization ✅

Create standard story template with:
- [x] Explicit `title` following `{Category}/{ComponentName}` pattern
- [x] `parameters.layout` (centered for atoms/molecules, fullscreen for pages/organisms)
- [x] `argTypes` with controls and descriptions
- [x] Multiple stories showing variants (not just `Primary`)

### 1.3 Story File Updates (58 files) ✅

**Atoms (25 files):** ✅
- [x] ActionButton.stories.tsx - Added title, argTypes
- [x] Badge.stories.tsx - Added title, argTypes, multiple variants
- [x] BaseButton.stories.tsx - Added title, argTypes
- [x] CollapsableColumns.stories.tsx - Added title, argTypes, fullscreen layout
- [x] DateSeparator.stories.tsx - Added title, argTypes, multiple variants
- [x] File.stories.tsx - Added title, argTypes
- [x] FormInput.stories.tsx - Already good
- [x] Icon.stories.tsx - Added title, argTypes, AllIcons gallery
- [x] Image.stories.tsx - Added title, argTypes
- [x] Link.stories.tsx - Added title, argTypes, multiple variants
- [x] LinkPreview.stories.tsx - Added title, argTypes
- [x] Loader.stories.tsx - Added title
- [x] Logo.stories.tsx - Added title, argTypes, LogoPic variants
- [x] MessageHeader.stories.tsx - Added title, argTypes
- [x] Modal.stories.tsx - Already good
- [x] ProfilePic.stories.tsx - Added title, argTypes
- [x] Resizer.stories.tsx - Added title, fullscreen layout, interactive demo
- [x] SearchBox.stories.tsx - Added title, argTypes, multiple variants
- [x] StatusLine.stories.tsx - Added title
- [x] Tag.stories.tsx - Added title, argTypes, multiple variants
- [x] Text.stories.tsx - Added title, argTypes, size variants
- [x] ThemeButton.stories.tsx - Added title, argTypes, theme variants
- [x] Toolbar.stories.tsx - Added title, argTypes, demo with icons
- [x] Tooltip.stories.tsx - Added title, argTypes, multi-line variant
- [x] Wrap.stories.tsx - Added title, argTypes

**Molecules (25 files):** ✅
- [x] Attachments.stories.tsx - Added title
- [x] Button.stories.tsx - Added title, argTypes, variants
- [x] ButtonWithEmoji.stories.tsx - Added title, argTypes, variants
- [x] ButtonWithIcon.stories.tsx - Added title, argTypes, variants
- [x] ChannelCreateForm.stories.tsx - Already good
- [x] ChannelLink.stories.tsx - Added title
- [x] DescriptionBar.stories.tsx - Added title, argTypes, variants
- [x] DiscussionHeader.stories.tsx - Added title
- [x] Emoji.stories.tsx - Added title, argTypes, variants
- [x] Files.stories.tsx - Added title
- [x] LoadingIndicator.stories.tsx - Added title
- [x] LoggedUser.stories.tsx - Added title, argTypes
- [x] MessageBody.stories.tsx - Added title, argTypes
- [x] MessageToolbar.stories.tsx - Added title
- [x] NavButton.stories.tsx - Added title, argTypes, variants
- [x] NavChannel.stories.tsx - Added title, argTypes, variants
- [x] NavChannels.stories.tsx - Added title, argTypes
- [x] NavUsers.stories.tsx - Added title, argTypes
- [x] Reactions.stories.tsx - Added title
- [x] ReadReceipt.stories.tsx - Added title
- [x] TextMenu.stories.tsx - Added title, argTypes
- [x] TextWithIcon.stories.tsx - Added title, argTypes, variants
- [x] ThreadInfo.stories.tsx - Added title, argTypes
- [x] ThreadLink.stories.tsx - Added title, argTypes
- [x] UserMention.stories.tsx - Added title, argTypes, variants

**Organisms (4 files):** ✅
- [x] EmojiSearch.stories.tsx - Added title
- [x] Input.stories.tsx - Added title, loader, container wrapper
- [x] Message.stories.tsx - Added title, argTypes
- [x] Workspaces.stories.tsx - Added title, fullscreen layout

**Pages (4 files):** ✅
- [x] ErrorPage.stories.tsx - Added title, argTypes, variants, fullscreen layout
- [x] LoginPage.stories.tsx - Added title, argTypes, fullscreen layout
- [x] PasswordResetPage.stories.tsx - Added title, argTypes, variants, fullscreen layout
- [x] RegistrationPage.stories.tsx - Added title, argTypes, fullscreen layout

### 1.4 Add Missing Stories ✅

**Audit completed:** 12 components without stories identified, 3 added, 9 skipped (internal/complex).

**Added:**
- [x] PasswordResetPage.stories.tsx
- [x] Workspaces.stories.tsx
- [x] DescriptionBar.stories.tsx

**Skipped (not practical):** InputChannelSelector, InputEmojiSelector, InputUserSelector (internal input selectors), Conversation, MessageListRenderer, MessageListScroller, Pins, Search, Sidebar (heavy context/router dependencies)

### 1.5 Bug Fixes ✅

- [x] EmojiSearch infinite loop - cached Fuse instance (PR #252)
- [x] Input organism story - added loader and container wrapper
- [x] Message story broken images - mocked getUrl for placeholder images (PR #254)

---

## 2. Code Cleanup

### 2.1 Type Safety (HIGH PRIORITY)
- [ ] Fix pre-existing TypeScript errors (17 errors in base)
- [x] Remove `any` types from API module (`deno/api/`) — ApiError, callApi, fetchWithCredentials, files, messageTypes
- [ ] Remove `any` types from frontend (`app/src/`) — ~20 instances
- [ ] Remove `any` types from test files — ~98 instances across 19 files
- [ ] Fix `style: any` unused prop in `ActionButton.tsx:10`
- [ ] Remove `@ts-ignore` comments in `deno/api/files.ts` (5+ instances)
- [ ] Standardize Props interface naming

### 2.2 Dead Code & Unused Exports
- [ ] Remove unused `style` prop from `ActionButton.tsx`
- [ ] Audit and remove `window.Chat = plugins` exposure in `core/plugins.ts`
- [ ] Clean up unused imports across component files
- [ ] Address TODO/FIXME comments (4 remaining):
  - `deno/api/messageTypes.ts:105` - "make this a separate entity"
  - `deno/server/core/message/flatten.ts:9` - mentions/channel links search
  - `deno/server/inter/http/routes/auth/getSession.ts:13-14` - 2 FIXMEs marked "remove"

### 2.3 Dependency Updates
- [x] **React version mismatch** - ESLint now uses 'detect' instead of hardcoded 18.2 (PR #255)
- [x] **npm packages updated** - Updated within semver range: Sentry, Storybook, Vite, React Router, etc. (PR #255)
- [x] **@std library aligned** - Server @std versions now match root (assert, path, uuid) (PR #255)
- [x] **MongoDB aligned** - Server now uses 6.19.0 matching root (PR #255)
- [x] **deno.lock regenerated** - Clean lock file with aligned versions (PR #255)
- [x] **Valibot version aligned** - Server updated from 0.31.1 to 1.1.0 (BaseSchema→GenericSchema, transform type fixes)
- [ ] **Chromatic major update** - 13.3.5 → 15.0.0 (DEFERRED - review changelog first)
- [x] **@planigale versions** - Audited: 5 packages at latest versions, no conflicts (different packages, not version conflicts)

### 2.4 Console Statements
- [ ] Replace ~41 `console.*` calls in app source with structured logging
- [ ] Replace ~27 `console.*` calls in deno/server with proper logger
- [ ] Add proper logging abstraction

### 2.5 Configuration Fixes
- [x] Update `.eslintrc.cjs` React version - Now uses 'detect' for auto-detection (PR #255)
- [ ] Add TypeScript-specific ESLint rules
- [ ] Re-enable `no-unused-vars` in `deno.jsonc` (currently excluded)
- [ ] Review `skipLibCheck: true` in tsconfig - masks type issues
- [ ] Add `.prettierrc` for consistent formatting

### 2.6 Testing (HIGH PRIORITY)
- [ ] **React components** - 0 test files for 90+ components (63 have stories)
- [ ] Add unit tests for core models (`app/src/js/core/models/`)
- [ ] Add tests for context providers
- [ ] **Deno backend** - 23 test files exist (all integration tests in `inter/http/routes/__tests__/`), but gaps remain:
  - `deno/server/core/` — no unit tests for commands, queries, or domain logic
  - Core models (channel.ts, message.ts, user.ts)
  - Encryption module utilities
- [ ] Set up visual regression testing with Storybook

### 2.7 Side Panel Hover Style Inconsistencies
**Problem:** Users and channels in the side panel have inconsistent hover styles - one has rounded corners, the other does not.

- [ ] Investigate all hover styles in NavChannels and NavUsers components
- [ ] Identify other potential inconsistencies (padding, colors, transitions, border-radius)
- [ ] Unify the styling to create a consistent look and feel

**Files to check:**
- `app/src/js/components/molecules/NavChannel.tsx`
- `app/src/js/components/molecules/NavChannels.tsx`
- `app/src/js/components/molecules/NavUsers.tsx`

---

## 3. Architecture Refactoring

### 3.1 API Module Refactoring (HIGH PRIORITY)
**Problem:** `deno/api/mod.ts` is 660+ lines with 80+ methods (God object pattern)
- [ ] Split into domain-specific modules (auth, channels, messages, users)
- [ ] Separate SSE management from HTTP requests
- [ ] Extract event handling into dedicated module
- [ ] Remove direct localStorage/fetch dependencies (inject instead)

### 3.2 Context Provider Consolidation
**Problem:** 10 context providers with similar patterns
- [ ] Audit which contexts are actually needed
- [ ] Create generic hook factory for common `useContext` + error pattern
- [ ] Consider unified state management (MobX is already used, consolidate)

### 3.3 Button Component Consolidation
**Problem:** 3 button components with overlapping functionality
- `BaseButton.tsx` (88 lines)
- `Button.tsx` (45 lines) - wraps BaseButton with tooltip
- `ActionButton.tsx` (33 lines)
- [ ] Consolidate into single flexible Button component

### 3.4 Error Handling Standardization
**Problem:** Multiple error types without consistent handling
- [x] Fix blank screen on non-existent/loading channels — `getThread()`/`getMessages()` now return null instead of throwing, Router gates on `isLoading`, channels upserted into store on navigation
- [ ] Audit error classes in `deno/server/core/errors.ts` and `deno/server/inter/http/errors.ts`
- [ ] Create unified error handling pattern
- [ ] Standardize error responses across API

### 3.5 Repository Pattern Improvements
**Problem:** 57 instances of direct `repo.*` calls scattered throughout
- [ ] Add abstraction for common operations (exists check, batch ops)
- [ ] Centralize query logic

### 3.6 Atomic Design Refactoring
**Problem:** Component hierarchy (atoms/molecules/organisms/pages) is inconsistent

**Audit Results:** 72 components (25 atoms, 30 molecules, 10 organisms, 7 pages)

#### Phase 1: Reclassify Misplaced Atoms ✅
- [x] Move `ActionButton.tsx` → `molecules/` (has business logic) (PR #257)
- [x] Move `Toolbar.tsx` → `molecules/` (provides context) (PR #257)
- [ ] Split `ProfilePic.tsx` (192 lines) → `ProfilePicBase` + `ProfilePicWithStatus`
- [x] Split `SearchBox.tsx` → pure `SearchBoxInput` (atom) + `SearchBox` (molecule) (PR #260)

#### Phase 2: Extract New Atoms from Molecules ✅
- [x] Extract `TooltipTag` atom from DiscussionHeader + NavChannel (50+ LOC saved) (PR #257)
- [x] Extract `SectionHeader` atom from NavChannels + NavUsers (30+ LOC saved) (PR #257)
- [x] Extract `FlexRow` utility atom (used in 6+ molecules) (PR #260)
- [x] Extract `MessageInfo` molecule from Message organism (PR #260)

#### Phase 3: Extract New Molecules ✅
- [x] Create `BaseInputSelector` from InputChannelSelector/UserSelector (200+ LOC saved) (PR #257)
- [ ] Extract `FileListSection` from Files.tsx

#### Phase 4: Cleanup
- [ ] Refactor `Modal.tsx` — currently exports separate styled components (`ModalOverlay`, `ModalContainer`, `ModalHeader`, `ModalCloseButton`); consider proper compound component pattern
- [ ] Review `Tooltip.tsx` context complexity (currently 46 lines, low-medium)
- [ ] Consider splitting `Message.tsx` (230 lines) into sub-organisms

### 3.7 Architectural Rules Documentation ✅
- [x] Define and document project architecture rules (`docs/ARCHITECTURE.md`)
- [x] Establish coding conventions and patterns (`docs/CONVENTIONS.md`)
- [x] Create decision records for key architectural choices (`docs/adr/` — 14 ADRs, including ADR 014 repository pattern via PR #258)
- [x] Add CLAUDE.md with project guidance and git workflow rules (PR #261)
- [ ] Add linting/tooling to enforce rules where possible (PR #259 open — ESLint atomic design import rules)

### 3.8 Add Valibot to Database Layer (Type Safety First Step)
**Problem:** Entity shapes are defined in 5 places (API types, backend types, Valibot command schemas, HTTP JSON schemas, frontend models). Adding/removing a property requires updating multiple files — frequent source of bugs.
**Goal:** Use Valibot entity schemas as the single source of truth. Repos validate data through schemas on read/write, replacing hand-written serializers.
- [ ] Define canonical Valibot schemas for all entities (Message, Channel, User, Session, Badge, Invitation, Emoji)
- [ ] Derive TypeScript types via `v.InferOutput` — replace hand-written types in `deno/server/types.ts` and `deno/api/types.ts`
- [ ] Use `v.parse(schema, raw)` in repo read path — replaces `deno/server/infra/repo/serializer.ts` deserialize
- [ ] Use schema-derived types in repo write path — replaces serializer serialize
- [ ] Derive command/query input schemas from entity schemas via `v.pick`/`v.partial`
- [ ] Remove `deno/server/core/serializer.ts` (EntityId→string conversion) — no longer needed with string IDs
- [ ] Frontend models `implements` derived types for compiler-enforced sync

---

## 4. File/Attachment Database Refactoring

**Goal:** Extract file/attachment metadata from messages into dedicated database structure with proper relations.

### Steps

- [ ] **Scan all database messages** - Iterate through existing messages to identify attachments
- [ ] **Design file database structure** - Create schema for file metadata (type, size, url, mime, thumbnail, etc.)
- [ ] **Implement file entity/table** - Add database model for files
- [ ] **Create relations** - Establish message <-> file <-> channel relationships
- [ ] **Migration script** - Extract attachment info from messages into new file structure
- [ ] **Update message handling** - Modify message creation/retrieval to use new file relations
- [ ] **Verify data integrity** - Ensure all attachments migrated correctly

---

## 5. Features (Planned)

- [ ] **Markdown support in messages** - Parse and render markdown formatting when sending/displaying messages
- [ ] **Web/desktop notifications** - Push notifications for new messages and mentions
- [ ] **Channel files browser** - Dedicated view to browse/search all files shared in a channel
- [ ] **Frontend observability** - Error reporting, logging, stats, and diagnostics dashboard
- [ ] **Splash screen** - Add proper loading/splash screen on app startup
- [x] **Smooth channel loading transition** - Replace full-screen "Loading..." text with inline loading indicator in channel view to avoid screen blink when switching channels
- [ ] **Release process** - Fix release workflow, consider bundled/binary distribution

---

## Notes

- Created: 2026-02-06
- Last updated: 2026-02-09
- Progress:
  - ✅ **Section 1: Storybook Cleanup - COMPLETE**
    - PR #249: Config fixes
    - PR #250: Atom stories (25 files)
    - PR #251: Molecule/organism/page stories (28 files)
    - PR #252: EmojiSearch infinite loop fix
    - PR #253: Missing stories (DescriptionBar, Workspaces, PasswordResetPage)
    - PR #254: Message story image fix
  - 🔄 **Section 2: Code Cleanup - IN PROGRESS**
    - PR #255: Dependency updates (npm packages, @std alignment, ESLint React version)
    - PR #272: Remove `any` types from backend core
    - PR #273: Remove `any` types from storage, encryption, config, migrate, tools
    - PR #274: Remove `any` types from API module
  - 🔄 **Section 3: Architecture Refactoring - IN PROGRESS**
    - ✅ 3.7 Documentation: ARCHITECTURE.md, CONVENTIONS.md, 14 ADRs, CLAUDE.md
      - PR #256: Architecture docs
      - PR #258: ADR 014 repository pattern
      - PR #261: CLAUDE.md
    - ✅ 3.6 Atomic Design Phases 1-3 complete:
      - PR #257: ActionButton/Toolbar moved, TooltipTag/SectionHeader/BaseInputSelector extracted
      - PR #260: SearchBoxInput/FlexRow atoms, MessageInfo molecule extracted
    - 🔄 PR #259 (open): ESLint atomic design import rules + CI integration
