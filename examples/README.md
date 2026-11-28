# Example notes

These short Sri Lanka notes demonstrate the combined fork. Their dates are
illustrative, with no bookings, opening-hour promises or researched transport
schedule. Copy a note into your vault and open the itinerary map. All pins
already contain coordinates, so a Google API key is not needed to draw them.
Choose transport in the map if you want routed legs.

| Note | Day heading | Overview heading | Expected map content |
| --- | --- | --- | --- |
| [Sri Lanka - daily plan](Sri%20Lanka%20-%20daily%20plan.md) | `##` | Off | 3 days, 5 daily pins |
| [Sri Lanka - trip overview](Sri%20Lanka%20-%20trip%20overview.md) | `###` | `##` | 3 cities with 3 overview pins; 4 days with 7 daily pins |

The Google shortcuts are coordinate links to the same pin, not original venue
place-ID URLs. They illustrate portable `[Place](geo:lat,lng) [🗺️](Google URL)`
pairs without private keys or generated metadata. The geo pins still work in
the standalone overview feature without the optional import-format feature.
Plain Markdown readers can follow the Google shortcut when they do not handle
`geo:` links.

In the layered example, Trip overview shows Colombo, Negombo and Kandy in
document order. A multi-day stay creates one city stage, not duplicate daily
overview pins. The map cards list their child days. On desktop, move the editor
cursor between parent city sections and child stops to try the layer changes.
All stays selected unless you deliberately choose a date/stage filter.

To try undated daily headings, remove the dates from **all** `###` headings.
To try undated cities with dated days, remove the dates from **all** city `##`
headings instead. Each layer is independent; dates are not inherited. Mixing
dated and undated headings within one layer retains upstream's research filter.
Put place links below headings: links inside a heading do not create pins.

## Map source example

[map-sources.json](map-sources.json) is a small public settings fragment for
OpenStreetMap and MapTiler Satellite + labels, Light, Dark and Street. Replace
`YOUR_MAPTILER_KEY` with your own key in the map-source dialog. Do not use this
fragment to overwrite your entire `data.json`. Credits and the MapTiler Free
logo are included. The user's personal configuration is not published here.

## Pin references

Coordinates were checked on 2026-11-27. They identify areas/landmarks, not
booked hotels or guaranteed entrances. The lake pin marks the waterbody;
the beach pin is a geotagged coastal reference.

- [Galle Face Green, Wikidata](https://www.wikidata.org/wiki/Q1492279)
- [Negombo, UNGEGN / Survey Department of Sri Lanka](https://ungegn.un.org/dashboard/cities/details?id=3157)
- [Negombo beach reference, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Negombo_Beach.jpg)
- [Temple of the Tooth, Living Heritage Network](https://www.daladamaligawa.org/sacred.destinations.htm)
- [Kandy Lake, Wikidata](https://www.wikidata.org/wiki/Q5966035)
