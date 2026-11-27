# Fork review, 2026-11-27

Runtime source: `c91787002fd6e93c54cf7c0d7f935790ad5919a8`, based on
upstream `238332f6c910e9153e22cd7fda5b62380369140a` (0.1.14).
This follow-up adds documentation and examples only. Runtime code, manifest,
dependencies, lockfile, default settings and Markdown parsing are unchanged.

## Executed in this review

- Full `pnpm check`: 243 unit tests in 19 files, ESLint, CSS lint,
  TypeScript, production build and built-bundle smoke passed.
- Parsed both new notes with the actual combined parser. The daily note has
  3 days / 5 pins. The layered note has 4 days / 7 pins and 3 stages / 3 pins.
  Every Google helper uses the same coordinates as its geo link, and the
  recorded source offsets still identify that exact link.
- Parsed the overview note with the independent #14 parser too: its geo pins
  work without #12. Removed all child dates, then all parent dates in separate
  in-memory variants; both retain their pins without inheriting dates.
- Checked MapTiler's live TileJSON for Hybrid, Streets, Dataviz Light and
  Dataviz Dark, then loaded one tile from each. All returned HTTP 200 and
  decoded as 256×256 images: Hybrid JPEG; the other three PNG. Their reported
  zoom bounds were 0–22. This small endpoint check is not an exhaustive provider
  test or an Obsidian device test.
- Checked source-specific attribution against provider instructions. The public
  map example includes linked credits and the MapTiler Free-account logo.
- Rechecked PR scope, English descriptions, dependency statements and branch
  ancestry. All five upstream PRs remain open and mergeable at review time.
  #13 remains a draft depending on #12. No new feature/fix PR was created.

The existing [native navigation run](https://github.com/crispyduck00/wayfarer/actions/runs/46051939024)
passed 22 overview/source UI checks and 10 Reading checks for each of the
standalone and combined builds. The earlier [map-source UI run](https://github.com/crispyduck00/wayfarer/actions/runs/46030043306)
passed 32 cases per build. These checks use the official Obsidian 1.15.1
desktop renderer and narrow touch emulation. They were not repeated for
this documentation-only change.

## Still manual

Physical Android, extended day-to-day use, Nextcloud rendering/sync, device
undo and paid-provider account policies are not covered by the automated
checks. The inherited Leaflet close-during-zoom issue remains documented in
[map sources](map-sources.md); this review adds no unrelated fix for it.

The example dates and places demonstrate the format, not a booked itinerary.
Coordinates have linked references in the [examples guide](../../examples/README.md).
The private user settings are separate from all Git content and the public
test package. No upstream discussion has been posted; a short draft is ready
for after the device trial.
