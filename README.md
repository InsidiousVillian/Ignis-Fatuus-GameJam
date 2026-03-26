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

Project Reflection: Ignis Fatuus
AI Excellence & Limitations

AI was extremely good in Rapid Prototyping and Procedural Generation. It allowed me to implement a complex Web Audio synthesizer and a Finite State Machine in hours rather than days. However, it occasionally hallucinated during the Lumen Dash implementation, where it struggled to  the mouse-follow logic with velocity-based movement. I had to step in as the Lead Developer to manually override the input priority, proving that while AI can provide the "bricks," the developer must provide the "blueprint."
Alteration of Process

The collaboration shifted my process from "Writing Code" to "Architectural Orchestration." Instead of getting bogged down in syntax, I focused on Game Feel (Swink, 2009) and Difficulty Scaling. My technical process became iterative: I would prompt a core mechanic, test the "juice" (screenshake, particles), and then use AI to "refactor" for performance. Next time, I would spend more time defining the Data Schema upfront to prevent the AI from hallucinating variable names between sessions.
Ethical Considerations & Transparency

Originality was maintained by using AI as a Technical Consultant rather than a "black box" creator. Every mechanic—from the Wraith Prime's corruption to the Hero’s light decay—originated from my design goals. All AI-assisted code and synthesized audio have been documented in the Refinement Logs (Entry 001–019) to ensure full transparency. I believe this use constitutes Fair Use, as the AI synthesized generic programming patterns into a unique, transformative creative work.
Responsibility & Authenticity

To ensure future work remains authentic, I maintain a "Human-in-the-Loop" policy. I never "blind-copy" code; I analyze the logic to ensure I can maintain it manually. By treating the AI as a Junior Developer under my supervision, I ensure the creative "soul" of the game—the dark ambient atmosphere and the emotional weight of the escort mechanic—remains my own.

## References

The Independent Institute of Education. 2023. *Academic Integrity and AI Use Policy*. Sandton: IIE. [Internal policy document].
