# Map sources verification

Base: upstream `238332f6c910e9153e22cd7fda5b62380369140a` (0.1.14).
Branch: `feature/map-sources`, independent of the other fork features/fixes.
No dependencies, plugin identity or Markdown format changed.

`pnpm check` passed locally and again in [GitHub Actions](https://github.com/crispyduck00/wayfarer/actions/runs/46026317800):
177 unit tests, ESLint, CSS lint, TypeScript, production build and bundle
smoke. Upstream has 161 unit tests. The combined fork also passed the full
check with 241 unit tests. These CI jobs checked the code recovered after
the execution environment became unavailable during upload.

The new unit cases cover fresh installs, exact legacy URL/attribution
migration, repeated migration without duplicates, malformed settings,
stable ordering/IDs, zoom ranges including zero, provider subdomains and
selection/default/deletion fallback. Bundle smoke checks modern settings
registration, legacy-field mirroring, unchanged Markdown/itinerary/revision
on tile-only saves and unchanged configuration after a failed disk save.

## Renderer checks

30 additional checks passed in the official Obsidian 1.15.1 desktop renderer,
headless, using actual DOM clicks in an isolated temporary vault.

| Scenario | Result |
| --- | --- |
| Legacy custom map, single source | URL retained; no switcher |
| Native settings dialog | Add/edit/reorder/default/remove, invalid template and Cancel checked |
| Street/satellite/hybrid switching | Same map, marker objects, route group, popup, center and filter |
| Zoom limits | Maximum 16, maximum zero, minimum 18 and rapid disjoint ranges checked |
| Network/image failures | Actual tile errors for 401/403/404/429/500 and offline request aborts; pins/routes retained |
| Slow responses and rapid selection | One active tile layer; late replies do not restore old sources |
| Multiple map panes | Independent open-pane choices; new panes use the local selection |
| Reconfiguration | Active/default deletion falls back; repeated rebuilds do not add map listeners |
| Application restart | Source ID retained across full application restarts |
| Narrow touch emulation | 412 × 915 viewport: native switcher and settings dialog usable |
| Note integrity | Test Markdown unchanged byte for byte; no renderer errors in these scenarios |

Tile responses, HTTP errors and offline failures were deterministic.
Screenshots were captured, but their upload and the raw renderer test report
are pending recovery of the execution environment. No real API key or user
note was used. The original application/renderer bundle was unchanged; the
bootstrap's single-instance socket lock was bypassed for the restricted test
environment. Narrow touch emulation is not the Android application.

A separate test-setup teardown (detaching a just-restored map during its
initial zoom) raised a Leaflet pending-zoom callback after removal. The
source-switch scenarios start from a clean layout; interrupted zoom/removal
has not been signed off. This case needs a baseline comparison before any
product change.

## Design checks

`Basemaps` owns only background layers and the native Leaflet layers control.
Each source uses one tile layer inside a group: Leaflet otherwise disables a
source's radio button when the current zoom is outside that source's range.
The active child supplies zoom bounds; unselected sources make no requests.
Reconfiguration removes the old control and layers, including Leaflet 1.9.4's
otherwise retained collapsed-control map-click listener.
Source names are escaped before entering Leaflet's HTML labels.
The most recent source ID uses Obsidian's existing device-local storage API.

## Manual follow-up

- Physical Android: touch/scroll, keyboard, rotation, host chrome and suspend/resume.
- Real paid/keyed imagery/hybrid providers: credit/logo, token restrictions,
  coverage and supported zoom limits.
- A private/LAN server: reachability, TLS and platform HTTP rules.
- Physical desktop/Android restarts, plugin reload and network interruption.
- Closing a map during a zoom animation, including a just-restored pane.

Offline downloading, persistent caching, vector tiles and overlays are outside
this feature.
