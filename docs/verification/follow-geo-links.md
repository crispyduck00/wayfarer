# Geo-link navigation verification

Base: upstream `238332f6c910e9153e22cd7fda5b62380369140a` (0.1.14).
Branch: `feature/follow-geo-links`, independent of the other fork features.

[Full checks and native UI run](https://github.com/crispyduck00/wayfarer/actions/runs/46120839384)
passed on 28 November 2026: **178 unit tests standalone, 260 combined**,
ESLint, CSS lint, TypeScript, production build and built-bundle smoke.
The final source commits only move the README paragraph and add verification
records relative to the tested runtime candidates.

The 17 new unit cases cover plain versus modified activation, source spans,
repeated coordinates, two links on one line, Google companions, code/comments
and frontmatter. Bundle checks cover the setting/default, exact Reading and
editor references, existing/new mobile maps, compatible/incompatible day
filters, stale rendered links, out-of-order reads, disabling and unload.

The official Obsidian **1.15.1** desktop renderer passed **24 native checks
standalone and 31 combined**, with actual Reading, Live Preview and Source
label clicks. The real external href remains unchanged; modified and synthetic
middle/right activations reach the host. Contextmenu events are not consumed.
The native fixture observes those events before preventing OS/browser launch;
it does not claim to exercise every OS context-menu command.

A 412px touch viewport also exercises the mobile map-tab branch through the
host's Platform flag: opening one map on All, revealing it and reusing it.
Combined checks cover parent/child overview targets and popup marker identity,
plus wide/narrow popup and list visibility of the basemap and zoom controls.
Source notes remain byte-identical and no renderer errors occur.

[Harness and raw reports](https://github.com/crispyduck00/wayfarer/tree/2073592c5bbaa44e2b641e76a6c1df2cef15d841)
are retained on a validation branch, outside the feature diff. Test artifacts
include desktop and narrow screenshots with deterministic tiles, no real keys.
Runtime candidates: standalone `8a3a9f87def3152d9a817634549b2c5cabf680fb`,
combined `ac3b0643814d2213e1dde4f7ee87c9641c79ed5b`.

Physical Android long-press menus, device app switching/suspend/resume, desktop
pop-out windows and plugin restart remain manual follow-up. Touch/Platform
emulation is not an Android-device test. No Markdown format, plugin identity,
dependency or note migration changed. The option remains off by default.
