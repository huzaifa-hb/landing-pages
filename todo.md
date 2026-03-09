# Landing Page Vault - TODO

## Database Schema
- [x] Create folders table (id, name, parentId, createdAt, updatedAt)
- [x] Create templates table (id, name, code, folderId, thumbnailUrl, createdAt, updatedAt)
- [x] Create tags table (id, name, color)
- [x] Create template_tags join table
- [x] Push schema to database

## Backend API (tRPC)
- [x] Folder CRUD procedures (list, create, rename, delete)
- [x] Template CRUD procedures (list, create, update, delete)
- [x] Tag CRUD procedures (list, create, delete)
- [x] Template-tag assignment procedures
- [x] Search procedure (search templates by name, tag, folder)

## Core UI
- [x] Dashboard layout with sidebar for folder navigation
- [x] Template grid view with thumbnail previews
- [x] Folder tree in sidebar (collapsible, nested)
- [x] Top search bar with tag filter
- [x] Empty state for folders with no templates

## Template Management
- [x] Add new template dialog (name, folder, tags, code input)
- [x] Monaco/CodeMirror code editor for HTML/CSS editing
- [x] Live preview panel (iframe rendering the HTML/CSS)
- [ ] Thumbnail generation from live preview
- [x] Edit template dialog with code editor
- [x] Delete template with confirmation
- [x] Copy code to clipboard button
- [x] Download code as .html file

## Folder & Tag Organization
- [x] Create folder dialog
- [x] Rename folder inline
- [x] Delete folder with confirmation
- [x] Move template to different folder
- [x] Tag creation with color picker
- [x] Tag assignment to templates
- [x] Filter templates by tag
- [x] Search templates by name

## Polish & UX
- [x] Dark theme with professional color palette
- [ ] Responsive design for mobile/tablet
- [ ] Loading skeletons for async data
- [x] Toast notifications for actions
- [ ] Keyboard shortcuts (Ctrl+K for search)

## Testing
- [x] Write vitest tests for folder CRUD
- [x] Write vitest tests for template CRUD
- [x] Write vitest tests for search

## UI Rebuild (Reference Design)
- [x] Switch to light theme: zinc/white palette matching reference
- [x] Sidebar: inline folder creation (input appears inline, Enter to confirm, Escape to cancel)
- [x] Sidebar: folder delete button visible on hover
- [x] Card grid: proper iframe thumbnail using container-query scaling (1280px scaled down)
- [x] Card grid: folder badge shown on card
- [x] Card grid: delete button on hover (no dropdown needed for quick delete)
- [x] Editor page: inline title editing (plain input in header, no separate dialog)
- [x] Editor page: preview/code tabs (not split toggle) matching reference layout
- [x] Editor page: folder selector dropdown in header bar
- [x] Editor page: tag selector in header bar
- [x] Enhancement: duplicate template button
- [x] Enhancement: notes/annotation field per template
- [x] Enhancement: inline folder rename (click to edit)

## New Features (Round 2)
- [x] Split view in editor (code + preview side by side, resizable)
- [x] Quick Preview sandbox (paste code, see live preview, no save required)
- [x] Sort dropdown on template grid (newest, oldest, name A-Z, name Z-A)
- [x] Multi-select tag filter on template grid
- [x] Fix folder sync: templates in a folder should appear in "All Templates" too
- [x] Fix all-templates query to return all templates regardless of folder

## Fixes (Round 3)
- [x] Split view: code on left, preview on right
- [x] Thumbnail: fix scaling so full first viewport is visible and properly scaled down inside card

## Mobile Fixes
- [x] VaultPage: sidebar becomes a slide-in drawer on mobile (hamburger menu button)
- [x] VaultPage: responsive grid (1 col on mobile, 2 on tablet, 3+ on desktop)
- [x] VaultPage: mobile-friendly top toolbar (search, sort, filter stack properly)
- [x] VaultPage: New Template button accessible on mobile
- [x] TemplatePage: responsive header (title, folder, tags wrap on small screens)
- [x] TemplatePage: split view disabled on mobile (preview/code tabs only)
- [x] TemplatePage: Monaco editor usable on mobile (no horizontal overflow)
- [x] QuickPreviewPage: responsive layout on mobile

## Mobile Keyboard Fix
- [x] Replace Monaco with plain textarea on mobile in TemplatePage (Monaco triggers keyboard on scroll)
- [x] Replace Monaco with plain textarea on mobile in QuickPreviewPage

## Monaco Mobile Fix (Round 2)
- [x] Restore Monaco on mobile with readOnly scroll mode and Edit toggle button in TemplatePage
- [x] Restore Monaco on mobile with readOnly scroll mode and Edit toggle button in QuickPreviewPage

## Dark Mode
- [x] Define .dark CSS variables in index.css for all surfaces (background, card, sidebar, border, text)
- [x] Wire ThemeContext to read system preference (prefers-color-scheme) on first load
- [x] Persist user's manual choice in localStorage
- [x] Add Sun/Moon toggle to desktop sidebar (bottom, above Manage Tags)
- [x] Add Sun/Moon toggle to mobile header
- [x] Apply dark classes to VaultPage (sidebar, header, cards, toolbar)
- [x] Apply dark classes to TemplatePage (header, tab bar, tag panel)
- [x] Apply dark classes to QuickPreviewPage (header, tab bar)
