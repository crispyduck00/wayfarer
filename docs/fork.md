# Wayfarer fork

This fork tries a few focused extensions to
[Kevin Lin's Wayfarer](https://github.com/kevinsslin/wayfarer). The main use case
is a trip note that remains readable when synced through Nextcloud and shared
with people using another Markdown reader.

## Source and installation

`main` keeps the upstream code with a fork notice. `integration/all-features`
combines the changes below. Individual feature/fix branches retain their own
upstream review scope. The combined branch also contains these examples and
fork-specific documentation; those files are not added to every upstream PR.

The plugin ID and version remain `wayfarer` and `0.1.14`. It replaces the
existing installation rather than creating a second plugin. Disable Wayfarer,
copy `main.js`, `manifest.json` and `styles.css` from the test package into
`.obsidian/plugins/wayfarer/`, then enable it again. Keep your existing
`data.json`. The community directory and upstream releases install upstream;
an official plugin update can replace this manual build.

To build the combined branch, check it out and run `pnpm install --frozen-lockfile`
and `pnpm check`. Build output is not committed. Notes need no migration.

## Changes and upstream PRs

| Change | Purpose | PR and dependency |
| --- | --- | --- |
| Portable geo links | `[Place](geo:lat,lng) [🗺️](Google URL)` keeps notes useful in other readers; configurable helper label and legacy wrappers remain supported | [#12](https://github.com/kevinsslin/wayfarer/pull/12), independent |
| Optional session metadata | Keep new place details and route snapshots out of shared Markdown | [#13](https://github.com/kevinsslin/wayfarer/pull/13), draft depending on #12 |
| Trip overview | A route between cities/bases above the existing daily plans | [#14](https://github.com/kevinsslin/wayfarer/pull/14), independent |
| Card description | Avoid repeating the place title, including when prose or several emojis precede the link | [#15](https://github.com/kevinsslin/wayfarer/pull/15), independent cosmetic fix |
| Map sources | Multiple XYZ raster backgrounds with the native Leaflet selector | [#16](https://github.com/kevinsslin/wayfarer/pull/16), independent |
| Follow geo links | Optional note-link navigation to the existing map on desktop/mobile | [#17](https://github.com/kevinsslin/wayfarer/pull/17), independent |

All feature options retain upstream defaults. The metadata option is on by
default; turning it off requires geo links. Existing saved comments remain
readable and are not removed automatically. Session data is still cached;
it is not a continuously live feed.

## Try the examples

Start with [the two sample notes](../examples/README.md). The daily example
uses `##` days and needs no overview. The layered example uses `##` cities
and `###` days. Pins already contain coordinates, so displaying them needs
no Google API key. The examples also include a raw Google place link to
import. Google details and routed legs are optional.

With overview enabled, switching layers opens All. The desktop editor cursor
can focus a parent city in the overview or a child stop in daily plans, while
All remains selected. Explicit date/stage filters still restrict following.
The optional **Follow geo link on map** setting (off by default) selects a
mapped stop from its link in Reading view or the editor. Mobile reveals the
map tab; a new map starts on All. Short editor taps work through the touch
path, and returning to the note cancels a pending jump. Native external link
menus, modified clicks and Google companion links remain available. Ordinary text clicks in Reading
view do not select a stop. Map-to-note jumps support Editing and Reading mode.
See [geo-link navigation](follow-geo-links.md).

Dates are optional independently on each layer. A layer mixing full dates
with undated headings keeps upstream's research-section rule: its undated
sections are not mapped. A parent's date is not inherited by a child.

## Map backgrounds

Configure sources under **Wayfarer → Advanced → Map sources → Manage map sources**.
The [public example](../examples/map-sources.json) supplies OpenStreetMap,
MapTiler Hybrid, Light, Dark and Streets. Replace `YOUR_MAPTILER_KEY` with your
own key in the dialog; do not replace your entire plugin configuration with
this small example. These sources use 256px XYZ raster tiles. Hybrid includes
labels and uses JPEG; the other MapTiler examples use PNG.

Attribution belongs to each source and switches with it. The example includes
linked MapTiler/OpenStreetMap credits and the MapTiler logo, which Free accounts
require. [Provider attribution instructions](https://docs.maptiler.com/guides/map-design/attribution/add-attribution/).
Keep them visible on small screens too. Check your provider's current quota,
key restrictions and tile metadata for other sources.

Tile URLs, including embedded API keys, are plain text in `data.json` and may
sync with that file. No personal configuration or usable API keys are included
in this repository or its public test package. The last selected source ID
is device-local. Offline tile downloads/caching and Google's session-based
basemap API are outside this feature.

## Verification and limits

See the [geo-link review](verification/follow-geo-links.md) and
the [previous review](verification/fork-review-2026-11-27.md) and the
[feature-by-feature record](verification/fork-integration.md). The combined
build passes 260 unit tests plus lint, typecheck, production build and bundle
smoke. Native Obsidian 1.15.1 navigation and map-source checks are linked there.
Desktop renderer/touch emulation is not a physical Android test.

For a device trial, check layer changes, explicit day filters, Reading jumps,
background switching and reopening Obsidian with your own notes. Any broader
device or provider results should be reported with their actual scope.
