# Ignis Fatuus

**Status:** Core Engine — In Development

---

## Project Overview

*Ignis Fatuus* (Latin: "foolish fire") is a top-down, browser-based game built with Vanilla JavaScript and the HTML5 Canvas API. The player controls a glowing wisp of light — a 'Spark' — navigating a dark arena where an autonomous Hero NPC battles waves of enemies.

The core loop revolves around a **Cleaner Mechanic**: enemies slain by the Hero leave 'Shadow Piles'. The player must hover their Spark over each pile for 1.5 seconds to cleanse it, which then spawns a Heal Orb that seeks the Hero. Without the player's intervention, the Hero is overwhelmed by both enemies and accumulated shadow.

**Technology Stack:**
- Vanilla JavaScript (ES6 Classes — no frameworks)
- HTML5 Canvas API (dual-canvas lighting technique)
- CSS3 (full-viewport layout)

**Key Design Patterns:**
- `Game` class as the single source of truth for all entity interaction
- Off-screen canvas for the `destination-out` radial lighting pass
- Linear interpolation (lerp) for smooth HealOrb movement
- Frame-counted state machine for Hero AI

---

## AI Ethics & Compliance Statement

This project, *Ignis Fatuus*, was developed for the IIE Game Design 3A Portfolio of Evidence. In alignment with academic integrity policies, I declare that AI tools (Cursor and Claude) were used as technical and creative collaborators. AI assisted in scaffolding the initial codebase, generating documentation structures, and advising on architectural decisions.

While AI generated foundational scripts, I acted as Lead Designer and Programmer — directing the 'Cleaner' gameplay loop, managing state transitions, and ensuring all components integrate into a stable functional prototype.

All AI-generated contributions are documented in `refinements-changes.md` to maintain full transparency of the development process. No copyrighted pre-made assets were used. This declaration is made in accordance with IIE Academic Integrity Policy (The Independent Institute of Education, 2023).

---

## References

The Independent Institute of Education. 2023. *Academic Integrity and AI Use Policy*. Sandton: IIE. [Internal policy document].
