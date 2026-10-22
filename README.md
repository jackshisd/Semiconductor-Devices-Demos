# ECE 121B Professor Emaminejad

An interactive Next.js laboratory organized around the eight supplied ECE 121B lecture PDFs. TypeScript, React, D3 and KaTeX power the simulations; PDF.js renders the bundled slides locally.

## Run and verify

Use Node.js 22.13 or newer.

```powershell
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

The development site runs at `http://localhost:3000`. A production build exports to `out/` and verifies every experiment and lecture route, equations, graph geometry, controls and local assets. Use `npm run format:check` to check formatting.

## Slides and demo navigation

Put source PDFs in `class slides/` and run `npm run slides:sync` (also runs before development and production builds). The script updates `public/lectures/`, `lib/lectures.json` and the local PDF.js runtime. Commit the public PDFs and manifest so builds work without the original local folder.

Readers support page numbers, previous/next, an index, zoom, keyboard navigation, downloads and links such as `/lectures/lecture-2#slide=29`. Mapped slides automatically open the relevant demo. Selecting a demo moves the reader to its associated slide. Slides without a matching demo show the PDF and keep the demo selector available.

Edit `lectureAssociations` in `lib/slide-demo-assignments.ts` to change the mapping. Page numbers are one-based PDF pages. The first entry for each demo is its selection destination; the other entries also open that demo:

```ts
'lecture-2': {
  'thermal-equilibrium': [29, 28],
  'boltzmann-approximation': [32, 30, 31],
}
```

All eight decks (260 pages) were scanned to make the initial assignments. `node scripts/scan-slides.mjs` regenerates the searchable extraction in `.openai/slide-review/slides.json`. Check rendered PDF pages when mathematical text is ambiguous. Mapping tests reject invalid pages, duplicate assignments and demo destinations that do not map back to the same demo.

Repeated slides open demos in their later lecture. Introductory intrinsic-carrier slides therefore defer to Lecture 2. Lecture 2 includes intrinsic silicon, band formation, electron versus hole motion, doping, the vibrating-table equilibrium analogy and temperature-dependent occupation. The repeated Boltzmann approximation opens in Lecture 3. Phonon and ionized-impurity scattering open in Lecture 4, slides 4–8. Repeated Schottky electrostatics open in Lecture 6. Distinct slides developing the same subject can still share a demo.

The 24 demos are ordered in contiguous topic groups: silicon fundamentals, carrier statistics, transport, metal contacts, PN junctions and reverse breakdown. Junction Models was removed; PN depletion is the retained junction demo. Proposed additions are listed in `DEMO_ROADMAP.md`.

## Midterm prep

`/midterm-prep` displays and downloads a two-page LaTeX formula sheet. Its editable source is `guides/midterm/main.tex`; the committed website asset is `public/guides/ece121b-midterm-formula-sheet.pdf`. It includes assumptions, units and PDF page references for the eight supplied lectures.

To regenerate it, install Tectonic (or set the `TECTONIC` environment variable to its executable) and run `node scripts/build-midterm-guide.mjs`. The script requires exactly two pages and updates the public asset and `output/pdf/` deliverable. Normal website builds use the committed PDF and do not require TeX.

## Simulation layout

Lecture readers use equal-width slide and demo panels on desktop. The right panel explains when there is no demo assigned; the slide size is unaffected. The PDF canvas fits the page's actual aspect ratio, and the demo panel matches the reader height with independent scrolling. On narrow screens the panels stack.

Compact controls are docked at the bottom of the demo panel while its content scrolls independently. Standalone demo pages retain their fixed bottom controls. The original avalanche and Zener demos are active again, including their interactive carrier and wave-packet animations.

## Course scope

Explanations and source links are in `components/CourseNotes.tsx`. See `PHYSICS_NOTES.md` for the source index and approximations.

The website uses the lecture's fixed 1.12 eV silicon gap and tabulated NiSi barriers (0.65/0.47 eV). Band formation illustrates 4N states per band. Sand, avalanche and tunneling animations are qualitative illustrations. The restored breakdown demos retain their original illustrative impact-ionization and WKB models, with their assumptions shown in the demos. The ideal-diode page retains a separate qualitative breakdown I–V panel based on Lecture 8 slide 4.
