# Trip overview verification

Base: upstream `238332f6c910e9153e22cd7fda5b62380369140a` (0.1.14).
Branch: `feature/trip-overview`, independent of the geo-import and session-only
metadata features. One feature commit includes code, tests and documentation.

`overviewHeadingLevel` defaults to 0 (off). The original parser path is retained
when off or invalid. When enabled, the same parser produces two projections
of the original Markdown. There are no synthetic source offsets, generated
hierarchy files, separate notes or migrations. Existing link/comment formats
and the plugin identity remain supported.

The untouched upstream passes `pnpm check` with 161 unit tests. This feature
passes with 179 unit tests, ESLint, CSS lint, TypeScript, production build and
expanded bundle smoke. The frozen lockfile and dependencies are unchanged.

Unit coverage includes parent/day ownership, exact source spans, date ranges,
repeated places and selection references, source boundaries, ungrouped days,
stages without days or pins, nested daily headings, research sections,
frontmatter, code and comments, disabled/invalid options and other heading
levels. Router tests cover shared-cache reuse, source identity, suppressed
cross-day clock comparisons and no guessed transit timetable across stages.

Built-bundle smoke drives actual map-view handlers with real Leaflet layers
and stubbed host surfaces, layout and camera. It checks marker/connection
counts, desktop and mobile layer selectors, child-plan drilldown, exact source
navigation, separate per-layer selection, daily drag availability, disabled
overview dragging, overview-only details, correct repeated-hotel occurrence
and rejection of stale route writes. View switching and drilldown preserve
the Markdown verbatim.

Network replies are mocked. A real desktop Obsidian or Android host, real
Google requests, physical-device undo and Nextcloud rendering/sync are not
executed by these tests. Whole-stage reordering, arbitrary-depth hierarchy
and overview KML export are outside this feature.
