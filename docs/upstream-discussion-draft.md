# Draft for a later upstream discussion

Post after the personal Desktop/Android trial. Add actual device results then;
the automated checks below do not replace them. This draft has not been posted.

Suggested title: **Small fork for portable trip notes and a route overview**

---

Thanks for Wayfarer. I use it to plan a trip in Obsidian and share the Markdown
through Nextcloud with people who do not use Obsidian. I've put together a
[small fork](https://github.com/crispyduck00/wayfarer/blob/integration/all-features/docs/fork.md)
with these proposed changes:

- [#12: geo links with a short Google Maps companion link](https://github.com/kevinsslin/wayfarer/pull/12), for notes that work in other readers.
- [#13: optional session-only metadata](https://github.com/kevinsslin/wayfarer/pull/13), to avoid storing generated snapshots in shared notes. This depends on #12 and stays a draft.
- [#14: a city/base overview above daily plans](https://github.com/kevinsslin/wayfarer/pull/14), to keep long trips readable.
- [#16: multiple raster map backgrounds](https://github.com/kevinsslin/wayfarer/pull/16), using Leaflet's existing layer selector.
- [#17: optional geo-link navigation](https://github.com/kevinsslin/wayfarer/pull/17), to select a mapped stop directly from the note on a phone or desktop.

There is also a [small cosmetic card fix, #15](https://github.com/kevinsslin/wayfarer/pull/15).
The other PRs are independent. Existing formats/defaults are preserved; there
is no note migration. Session details are cached snapshots, not an always-live feed.

The [examples](https://github.com/crispyduck00/wayfarer/tree/integration/all-features/examples)
and test records are linked from the fork guide. Would these fit the direction
you have in mind for Wayfarer? I'm happy to adjust the scope or wording.
