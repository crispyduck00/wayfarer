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

Navigation regression coverage also checks the child heading's exact source
line and top scroll state, retained centering for editor stop jumps, visible
Reading-view line navigation requests without changing the hidden editor cursor, focus
preservation on passive desktop clicks, explicit mobile source navigation and
suppression of stale Reading-mode cursor events. The original drilldown test
passes before the fix, while the new source-heading assertion fails there.
Preview navigation sends `{ line }` through Obsidian's ephemeral view state;
unlike a bare `{ scroll }` restore, this reveals folded headings, highlights
the destination and synchronizes the view after rendering. Line zero is also
covered. Async source opening is checked
against the requested file before moving or focusing a view.
The smoke also reproduces and fixes a focused stop from another stage while
a stage is pinned, and checks that All resumes cursor following and that
child-day text in overview selects its owning stage without changing layers.

An additional regression was run in the official Obsidian 1.15.1 desktop
application, headless, with an isolated temporary vault and actual DOM clicks.
The note's target is on line 326. Reading mode remains active throughout.

| Reading navigation | Previous build | Fixed build |
| --- | --- | --- |
| Go to line, expanded section | Target visible, line 326 | Target visible, line 326 |
| Go to line, folded heading | Target hidden, heading still folded | Target visible, line 326, heading unfolded |
| Passive map-pin click | Not recorded | Target visible, line 326; map keeps focus |

The original application/renderer bundle is unchanged. Its bootstrap's
single-instance socket lock was bypassed for the restricted test environment.
This is a focused desktop-renderer check, not a physical-device test of every
feature. Unit/bundle tests still mock host surfaces and network replies.
Android, real Google replies, device undo and Nextcloud rendering/sync are not
exercised. Whole-stage reordering, arbitrary-depth hierarchy
and overview KML export are outside this feature.
