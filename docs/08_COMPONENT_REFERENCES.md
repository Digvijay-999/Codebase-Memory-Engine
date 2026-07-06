# ContextForge Component References

## Purpose

This document defines the approved UI component references for ContextForge.

These references should be used as implementation bases whenever technically practical.

Do not recreate components from scratch if an approved implementation already exists.

Every imported component should be adapted into the ContextForge design language.

The final UI should feel like one cohesive product.

Never make the application look like multiple templates stitched together.

---

# Hero

Reference

https://21st.dev/@serafim/components/splite

Purpose

Interactive hero centerpiece.

Guidelines

- Use as the base implementation.
- Keep the Spline scene configurable.
- The scene should be easy to replace later.
- Hero should remain readable.

---

# Navigation

Primary Reference

https://21st.dev/@ayushmxxn/components/tubelight-navbar

Purpose

Main navigation.

Requirements

- Floating
- Rounded
- Glass effect
- Scroll blur
- Active indicator
- Smooth hover

---

Alternative Navigation

https://21st.dev/@reapollo/components/navigation-menu

Use only if additional navigation patterns are required.

---

# Buttons

Primary CTA

https://21st.dev/@bundui/components/magnetic-button

Requirements

- Magnetic interaction
- Chrome shine
- Matte black appearance
- Soft hover
- Smooth click animation

---

Secondary Button

https://21st.dev/@magicui/components/shimmer-button

Purpose

Secondary CTA

Use shimmer subtly.

---

Alternative Button

https://21st.dev/@cybergaz/components/neon-button

Only adapt the interaction.

Do not use bright neon colors.

---

# Cards

Primary

https://21st.dev/@aceternity/components/bento-grid

Purpose

Feature section.

---

Secondary

https://21st.dev/@aceternity/components/3d-pin

Purpose

Interactive showcase cards.

Use sparingly.

---

# AI Input

Reference

https://21st.dev/@kokonutd/components/ai-input-with-loading

Purpose

Chat input.

Requirements

- Auto-growing textarea
- Loading state
- Send button
- Premium interaction

---

# AI Loader

Reference

https://21st.dev/@beratberkay/components/ai-loader

Purpose

Thinking state.

Used while ContextForge generates responses.

---

# Additional Loaders

Reference

https://21st.dev/@erikx/components/loader

Purpose

Skeletons

Progress indicators

Section loading

---

# Icons

Use Lucide React.

Avoid mixing multiple icon libraries.

---

# Motion

Use Framer Motion.

Animations should be:

- Smooth
- Subtle
- Purposeful

Avoid:

- Bounce
- Overshoot
- Flashy transitions

---

# Design Rules

Every imported component must be adapted to match ContextForge.

Requirements

- Same spacing scale
- Same typography
- Same border radius
- Same color palette
- Same shadow system
- Same animation timing

The user should never recognize that components came from different libraries.

---

# Things to Avoid

Do NOT:

- Mix multiple design styles.
- Use default component colors.
- Keep original demo content.
- Use placeholder copy.
- Introduce visual inconsistency.

Every component should look native to ContextForge.

---

# Implementation Strategy

Use these references as implementation bases.

Modify them to follow:

- Brand Guidelines
- Frontend Design Specification
- Dashboard Specification
- Design Tokens

The documentation always takes priority over the original component styling.