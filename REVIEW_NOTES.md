# Code review and verification - 2026-10-21

## Current result

The website has 27 demos grouped into six contiguous topics, eight lecture readers, and a two-page LaTeX midterm sheet. Repeated teaching slides open their demos only in the later lecture. The navigation map and source notes remain separate so earlier source references do not silently reopen demos.

## Bugs and inconsistencies fixed

- Conduction-electron steps previously traveled 7/8 of a site spacing. Motion now advances integer site indices and shares a tested hop model with playback and manual stepping, including contact wraparound and reversed fields.
- Duplicate slide assignments were removed from the earlier copies: intrinsic carriers (L1 to L2), density of states and Boltzmann approximation (L2 to L3), scattering and drift-current recaps (L3 to L4), and Schottky electrostatics (L5 to L6).
- A lecture with no unique demo assignments previously offered an unusable picker and promised a demo later in that same deck. Its disabled picker and empty panel now explain where the repeated material's demos appear.
- Interleaved registry categories caused repeated sidebar group headings. The registry now provides a stable topic order; tests reject noncontiguous groups and duplicate routes. Lecture titles now include subjects rather than only lecture numbers.
- Removed the unused simplified breakdown implementation and obsolete doping-diagram styles. The original avalanche and Zener demos remain active.
- Replaced the doping demo's inert diagram with live carrier and Fermi-level plots. Removed valence-band electron decorations from band formation. Simplified current-value equations and condensed controls.
- Lecture controls are docked inside the demo footer while its content scrolls; standalone controls remain at the bottom of the viewport. Slide and demo frames retain equal sizes on mapped and unmapped pages.
- Added phonon and impurity animations with bounded trails, field reversal, temperature, playback and single stepping; impurity ions can change density and charge. Their illustrative dynamics are explicitly distinguished from calibrated mobility calculations. Invalid model inputs fail before producing nonfinite SVG geometry.
- Rebuilt the formula guide in LaTeX with proper fractions, integrals, radicals, subscripts and consistent topic sections. The generator and export checker require exactly two pages. Removed the obsolete plain-text PDF generator.

Earlier review fixes retained: controls remain available on invalid physics settings; reset clears invalid drafts; nonfinite graph samples break curves; labels are clipped to valid domains; avalanche ionization includes the final segment before collection; automatic injection preserves fractional time; closed navigation is inert; expensive experiments load on demand; production and development use separate caches; generated exports are cleared safely to remove obsolete routes.

## Verification

- 52 physics, mapping and animation tests pass, including site-aligned hops, both field directions, ion-charge reversal, temperature trends, invalid settings, bounded trajectories, carrier conservation and PDF page counts.
- Strict TypeScript passes. Production export verifies all 27 demo routes, eight lecture readers, controls, KaTeX, finite graph geometry, referenced assets and the two-page guide.
- Both final LaTeX pages were rendered and visually checked. The desktop LaTeX compiler also confirmed successful compilation.
- Browser checks cover PDF rendering, bidirectional demo/slide navigation, fixed panel dimensions, empty pages, footer controls, scattering temperature/density/charge/playback, and conduction-electron positions on gray sites in both directions. Earlier checks cover all baseline demos, scientific input recovery, graph inspection, mobile navigation, doping, sand and Boltzmann interactions.

## Remaining limits

- Current npm audit reports 10 advisories: 6 high, 3 moderate and 1 low. Proposed full fixes require major Next.js, Tailwind and KaTeX migrations. Compatible audit fixes did not eliminate them. The static export does not run a Next.js server, but this does not make vulnerable dependencies harmless. A dedicated dependency migration remains necessary.
- Scattering, sand, avalanche and tunneling animations are educational approximations. Source scope and units are documented in PHYSICS_NOTES.md; they are not calibrated device simulators.
- DEMO_ROADMAP.md lists six proposed visual additions from the supplied slides. They are recommendations, not implemented features.
