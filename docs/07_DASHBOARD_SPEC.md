
# ContextForge Dashboard Specification

## Purpose

The dashboard is the primary workspace of ContextForge.

Users should spend almost all of their time here.

The dashboard should feel like a professional IDE powered by AI.

Inspired by:

- Cursor
- VS Code
- Claude AI
- Linear

It should prioritize clarity, speed, and focus.

---

# Layout

The workspace consists of five major regions.

--------------------------------------------------

Top Navigation

--------------------------------------------------

Sidebar | Repository Tree | AI Chat | Sources Panel

--------------------------------------------------

Status Bar

--------------------------------------------------

Each panel should be resizable in future versions.

Maintain generous spacing and visual hierarchy.

---

# Top Navigation

Contains:

- ContextForge Logo
- Current Repository
- Search
- Theme (future)
- User Menu (future)

The top bar should remain minimal.

---

# Sidebar

The sidebar provides workspace navigation.

Items:

- Chat
- Repository
- README
- Explain
- Search
- Settings (future)

Use Lucide icons.

Collapsed sidebar support should be considered.

---

# Repository Explorer

Inspired by VS Code.

Requirements:

- Folder expand/collapse
- File icons
- Hover states
- Active file highlighting
- Search
- Scrollable

Future:

- Git status
- File filtering

---

# AI Chat Panel

This is the primary workspace.

Requirements:

- Streaming responses
- Markdown rendering
- Syntax highlighted code
- Tables
- Bullet lists
- Block quotes
- Copy button
- Regenerate button (future)

Messages should feel similar to Claude AI.

Large comfortable spacing.

Readable typography.

---

# Chat Input

Requirements:

- Large rounded input
- Auto growing textarea
- Send button
- Loading animation
- Keyboard shortcuts

Placeholder:

"Ask anything about this repository..."

---

# Thinking State

Instead of showing only a spinner, display progress.

Example:

✓ Searching ChromaDB

✓ Finding relevant files

✓ Building context

✓ Asking Gemini

Generating response...

Each stage should animate smoothly.

This builds user confidence.

---

# Sources Panel

Every answer should include supporting sources.

Display:

- File name
- Relative path
- Relevance score (future)
- Click to highlight

Selecting a source should:

- Highlight it
- Open the file in future versions

---

# Markdown Rendering

Support:

- Headings
- Lists
- Tables
- Code blocks
- Inline code
- Links
- Quotes

Use syntax highlighting.

Provide copy buttons for code.

---

# Empty State

Before a repository is loaded:

Display:

"Clone a repository to begin."

Provide:

Clone Repository button.

Minimal illustration.

---

# Repository Workflow

User flow:

GitHub URL

↓

Clone

↓

Scan

↓

Chunk

↓

Store Embeddings

↓

Repository Ready

↓

Ask Questions

↓

Receive AI Answers

The UI should communicate progress clearly.

---

# Notifications

Use Sonner.

Examples:

Repository cloned.

Embeddings generated.

Repository ready.

README created.

Errors.

Notifications should remain subtle.

---

# Keyboard Shortcuts

Future support:

Ctrl + K

Quick search

Ctrl + Enter

Send message

Esc

Close dialogs

---

# Motion

Animations should be subtle.

Examples:

Messages fade in.

Sources slide in.

Panels resize smoothly.

Repository nodes expand naturally.

Avoid excessive movement.

---

# Performance

Support large repositories.

Virtualize long file lists in future.

Lazy-load heavy components.

Maintain responsive interactions.

---

# Success Criteria

The dashboard should feel like a premium engineering workspace.

Users should feel comfortable spending hours inside it.

The interface should prioritize productivity over decoration.