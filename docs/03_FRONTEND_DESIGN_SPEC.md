# ContextForge Frontend Design Specification

## Purpose

The frontend should feel like a premium AI developer workspace.

It should communicate confidence, clarity, and intelligence.

The product should never resemble a generic React template or AI SaaS landing page.

The visual identity should be cohesive across the landing page and workspace.

---

# Design References

Overall inspiration:

- Apple
- Linear
- Cursor
- Arc Browser
- Claude AI
- Nothing

Use these products as inspiration for spacing, typography, and interaction quality—not to copy them.

---

# User Experience Goals

The interface should feel:

- Fast
- Calm
- Premium
- Modern
- Professional

Every interaction should reduce cognitive load.

Users should immediately understand where to look and what to do.

---

# Responsive Strategy

Desktop-first.

Support tablet.

Support mobile.

Layouts should adapt naturally without hiding important functionality.

---

# Navigation

Reference:

- Tubelight Navbar
- Navigation Menu

Requirements:

- Floating glass navigation
- Rounded pill container
- Active indicator
- Blur on scroll
- Smooth transitions
- Sticky navigation

Navigation Items:

- Home
- Features
- How It Works
- Demo

Primary CTA:

Launch Workspace

---

# Landing Page Structure

The landing page should follow this order:

1. Hero
2. How ContextForge Works
3. Features
4. Technology
5. Interactive Demo
6. Call To Action
7. Footer

Do not add unnecessary marketing sections.

The landing page should tell a clear story.

---

# Hero

Height:

90–100vh

Contains:

- Floating Navbar
- Small announcement badge
- Main headline
- Supporting description
- Primary CTA
- Secondary CTA
- Hero centerpiece
- Dashboard preview

---

# Hero Centerpiece

Use the Splite component.

The Spline scene should:

- Feel premium
- Blend into the background
- Avoid bright colors
- Support the typography

The centerpiece should enhance the hero, not overpower it.

The Spline scene should be configurable so it can be replaced later without changing the page layout.

---

# Dashboard Preview

The landing page should contain a realistic preview of the ContextForge workspace.

Show:

- Repository Tree
- AI Chat
- Source Panel
- Markdown
- Code Blocks

This should look like a real application rather than a static image.

---

# Feature Section

Use Bento Grid.

Each feature card should explain a real capability.

Examples:

- Repository Chat
- Semantic Search
- README Generation
- Repository Explanation
- Source Citations
- Fast Embeddings

Cards should have:

- Soft hover
- Slight lift
- Consistent spacing

---

# How It Works

Display the RAG pipeline.

GitHub

↓

Clone

↓

Scan

↓

Chunk

↓

Embeddings

↓

ChromaDB

↓

Gemini

↓

Answer

Each stage should animate into view.

Connections between stages should glow subtly.

---

# Technology Section

Display the technology stack clearly.

Include:

- FastAPI
- React
- TailwindCSS
- ChromaDB
- Sentence Transformers
- Gemini

Avoid oversized logos.

Focus on clean presentation.

---

# Call To Action

Simple.

One message.

One button.

Launch Workspace.

No unnecessary marketing text.

---

# Workspace

The application workspace should resemble a professional IDE.

Layout:

Sidebar

↓

Repository Explorer

↓

Chat Panel

↓

Sources Panel

↓

Top Navigation

Inspired by Cursor and VS Code.

---

# Chat

Inspired by Claude AI.

Requirements:

- Streaming messages
- Markdown
- Syntax highlighting
- Code blocks
- Source citations
- Copy buttons
- Thinking animation

---

# Repository Tree

Requirements:

- Expand/collapse folders
- File icons
- Search
- Hover states
- Active file highlighting

---

# Sources Panel

Each AI answer should display supporting files.

Selecting a source should highlight the referenced file.

---

# Buttons

Use the approved component references.

Buttons should feel:

- Premium
- Responsive
- Magnetic
- Minimal

Avoid oversized shadows.

---

# Cards

Rounded corners.

Thin borders.

Minimal shadows.

Soft hover transitions.

Consistent spacing.

---

# Scroll Animations

Reveal sections using:

- Fade
- Translate
- Slight blur
- Scale

Never use excessive motion.

Animations should feel intentional.

---

# Loading States

Use premium loading animations.

Examples:

- AI Loader
- Skeletons
- Typing indicators
- Progress states

Loading should reassure the user without distracting them.

---

# Accessibility

Maintain high color contrast.

Provide visible focus states.

Ensure keyboard accessibility.

Animations should respect reduced-motion preferences where possible.

---

# Performance

Lazy-load heavy assets.

Lazy-load Spline.

Optimize animations.

Maintain smooth scrolling and interactions.

---

# Success Criteria

The final frontend should look and feel like a polished developer product.

It should not resemble a template.

Every page should feel cohesive, consistent, and intentionally designed.