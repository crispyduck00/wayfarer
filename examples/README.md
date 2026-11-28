# Example notes

These short Sri Lanka notes demonstrate the combined fork. Their dates are
illustrative, with no bookings, opening-hour promises or researched transport
schedule. Copy a note into your vault and open the itinerary map. All pins
already contain coordinates, so a Google API key is not needed to draw them.
Choose transport in the map if you want routed legs.

| Note | Day heading | Overview heading | Expected map content |
| --- | --- | --- | --- |
| [Sri Lanka - daily plan](Sri%20Lanka%20-%20daily%20plan.md) | `##` | Off | 3 days, 6 ready pins + 1 Google link to import |
| [Sri Lanka - trip overview](Sri%20Lanka%20-%20trip%20overview.md) | `###` | `##` | 3 cities with 3 overview pins; 4 days with 8 ready pins + 1 Google link to import |

The examples deliberately mix three link forms:

| Form | Example | Behaviour |
| --- | --- | --- |
| Geo link | `[Place](geo:lat,lng)` | Durable coordinates; the optional Follow geo link setting selects this stop in Wayfarer |
| Google coordinate link | The beach's `maps/search/?query=lat,lng` shortcut | Opens those coordinates; it does not identify a particular business |
| Google place link | Jetwing Blue's `cid` and Rodeo Pub's `query_place_id` | Identifies the hotel/pub listing, with its Google place information |

Jetwing Blue has a geo pin plus a Google listing companion, so it draws
without a key. Rodeo Pub starts as a plain Google place link, as in upstream:
use **Convert the map link on this line to a stop** or **Convert every map
link in this note** with a configured Google API key. It is not a ready pin
until imported. Existing geo/source pairs are left intact. The user's import
settings decide whether the result keeps the Google link as primary or uses
a geo/source pair. With geo following enabled, the primary geo link goes to
Wayfarer and the separate 🗺️ link stays external.

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
the beach pin is a geotagged coastal reference. The hotel pin follows the
hotel's published location map; the venue is an example, not a booking or
recommendation. Listing identifiers were read from the linked public sources on 2026-11-28;
no live Google Places API lookup was performed.

- [Galle Face Green, Wikidata](https://www.wikidata.org/wiki/Q1492279)
- [Negombo, UNGEGN / Survey Department of Sri Lanka](https://ungegn.un.org/dashboard/cities/details?id=3157)
- [Negombo beach reference, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Negombo_Beach.jpg)
- [Temple of the Tooth, Living Heritage Network](https://www.daladamaligawa.org/sacred.destinations.htm)
- [Kandy Lake, Wikidata](https://www.wikidata.org/wiki/Q5966035)

- [Jetwing Blue, official location map](https://www.jetwinghotels.com/jetwingblue/location/)
- [Rodeo Pub listing and place identifier, Waze](https://www.waze.com/live-map/directions/lk/wp/negombo/rodeo-pub-and-restaurant?to=place.ChIJQ29Zd03p4joRatAFc6k8JFE)
