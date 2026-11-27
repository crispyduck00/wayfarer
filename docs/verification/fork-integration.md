# Independent feature integration

Base: upstream `238332f6c910e9153e22cd7fda5b62380369140a` (0.1.14).

| Branch | Review scope | Unit tests in full check |
| --- | --- | --- |
| `feature/google-to-geo` | Portable geo/source links, configurable label, legacy wrappers | 175 |
| `feature/no-note-metadata` | Session-only facts, stacked on geo imports | 181 |
| `feature/trip-overview` | Optional parent route on unchanged upstream | 179 |
| `integration/geo-overview` | Geo imports and overview without session-only mode | 193 |
| `fix/stop-card-description` | Independent card display fix on unchanged upstream | 187 |
| `feature/map-sources` | Independent raster sources and native background selector | 177 |
| `integration/all-features` | All four features plus the card display fix | 241 |

All checks include ESLint, CSS lint, TypeScript, unit tests, production build
and load smoke against the built bundle. The unchanged base passed 161 unit
tests and its original complete check. Network and host surfaces are stubbed;
real Leaflet layers are used for the overview behavior. Reading navigation is
additionally checked in the official Obsidian 1.15.1 desktop renderer, headless,
including folded headings and passive map-pin clicks; see trip-overview.md.
Android, broader physical-device workflows, Nextcloud rendering/sync, real
Google replies and device undo remain outside the automated evidence.

The overview branch has one feature commit directly on upstream and can be
adopted without other fork changes. Metadata-free mode requires geo imports
so coordinates remain durable. Its PR is explicitly stacked on the geo PR.
The original focused metadata fixes remain separate commits.

The integration merge resolves overlapping settings descriptions, redraw
signatures and smoke additions. Session-only mode additionally includes both
source scopes when overlaying cached facts, remembering imported facts and
fetching explicit details. These small integration changes are kept here,
not added as a dependency of the standalone overview PR. Extra bundle checks
cover metadata-free overview imports, reparsing, both-scope details retrieval,
transport edits, browsing without writes and key changes invalidating both
layers. The individual branches retain their independent review scopes.

Defaults remain geo conversion off, metadata storage on and overview off.
Settings changes do not automatically migrate or reformat notes. Existing
Google imports, geo links, parenthesized helpers and metadata comments remain
supported. Plugin ID, version, dependencies and lockfile are unchanged.

The navigation review additionally verifies child-heading reveal, Reading-mode
scroll state, retained editor stop centering, fixed day/stage selection,
cursor/All behavior and delayed source-open guards. The separate description
fix adds 26 regression cases; KML retains its original prose. The geo/overview
row above describes the earlier build without these follow-up fixes.
The bundle smoke includes the reported arbitrary-prefix case with a geo/source
pair and checks both the popup and timeline descriptions without source edits.

For a layered trial, explicitly set daily headings to `###` and overview to
`##`. The sample notes use illustrative pins and should not be treated as
researched travel bookings. Keep existing plugin `data.json` when copying a
test build into the `wayfarer` plugin folder.

The map-sources feature adds no dependency on geo imports, session metadata,
the overview or the cosmetic fix. The combined merge preserves their settings,
cache overlays and source-navigation paths while changing only background
configuration/rendering for the new feature. Its native UI suite passes all
32 cases in both standalone and combined builds, including an open popup,
zoom bounds, request failures, multiple panes, restarts and narrow touch input.
See [map-sources.md](map-sources.md) for evidence and the inherited Leaflet
close-during-zoom limitation. No additional fix PR was created for that issue.
