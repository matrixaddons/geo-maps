# Region boundary data (choropleth maps)

Builds the pre-projected SVG path data in `assets/regions/` that MatrixMap's region maps render as plain SVG (no map library, no network requests).

## Rebuild

```sh
# one-off dev tools (NOT in package.json; install them together with any other --no-save tools so npm doesn't prune them)
npm install   # all build tools are in package.json

node tools/regions/build.mjs              # all maps
node tools/regions/build.mjs --preview    # also write SVG previews to tools/regions/cache/preview/
node tools/regions/build.mjs --only=nepal,world   # subset (manifest is merged, not replaced)
node tools/regions/verify.mjs             # parse / unique ids / non-empty paths / projection probes
```

Natural Earth GeoJSON (and the geoBoundaries files listed in `GEOBOUNDARIES` in build.mjs) is downloaded on first run from `nvkelso/natural-earth-vector` (master, `geojson/`) into `tools/regions/cache/` (git-ignored). Delete the cache to refresh. Update `assets/regions/LICENSE-DATA.txt` when you do.

## Pipeline

1. Pick features and assign each a region id (`gid`) and English name.
2. Build the d3-geo projection, `fitWidth(990)` + 5px padding, round `scale`/`translate` to 4 decimals and re-apply them, so the JSON params reproduce the projection exactly.
3. Project every feature with `d3.geoPath` (antimeridian clipping and resampling included) into planar pixel coordinates.
4. `topojson-server` topology (quantised to ~0.01px), `topojson-simplify` planar (Visvalingam) simplification. Because it is topological, shared borders stay gap-free. `topojson-client merge` then dissolves units that share an id.
5. For each map, pick the smallest threshold (at least 0.1–0.15 px²) that fits the size budget: world 245 KB, continents 150 KB, US 115 KB, countries 140 KB.
6. Drop islands and holes under 0.3–0.5 px², except each region's largest polygon. Outer rings are drawn clockwise and holes counter-clockwise, so the default `fill-rule: nonzero` works. A region that simplification collapsed falls back to full resolution. Sub-pixel microstates are drawn as a 0.4px diamond so they stay addressable.
7. Output a compact relative path (`M x y l dx dy … z`). Coordinates are rounded to 0.1 before the deltas are taken, so there is no drift. `c` = polylabel pole of inaccessibility of the region's largest polygon (holes respected).

## JSON format

```json
{ "id": "nepal", "label": "Nepal (provinces)", "viewBox": [0,0,1000,577],
  "projection": { "type": "mercator", "scale": 6969.451, "translate": [487.8752, 3892.0435], "rotate": [-84, 0] },
  "regions": [ { "id": "NP-P3", "name": "Bagmati", "d": "M619.5 296.1l-.2 1.8…z", "c": [673.3, 355.9] } ],
  "insets": [ { "ids": ["ES-CN"], "shift": [5, 6.5] } ]   // spain only
}
```

To recreate the projection in the browser, run `d3["geo" + Type]()`, then `.rotate()`/`.parallels()`/`.center()` when present, then `.scale(s).translate(t)`. Inset regions were shifted geographically before projecting, so markers inside them must use `projection([lon + dLon, lat + dLat])`.

## Id / coding decisions

- **World** (50m admin-0, 237 regions): `ISO_A2`, falling back to `ISO_A2_EH` and then `WB_A2` when the code is not a plain 2-letter code (France FR, Norway NO, Kosovo XK, Taiwan TW; NE's political `ISO_A2` for Taiwan is `CN-TW`). Features with no code at all are folded into their ISO state: Somaliland → SO, N. Cyprus → CY, Siachen Glacier → IN. The Australian Indian Ocean Territories and Ashmore & Cartier → AU. Antarctica is kept as `AQ` (renderers may hide it). NE's abbreviated names are replaced with `NAME_EN` plus a few short-form overrides (China, Czechia, DR Congo, Côte d'Ivoire…).
- **Continents**: dissolved by NE `CONTINENT` into AF, AN, AS, EU, NA, OC, SA. NE's "Seven seas" members follow UN M49: GS → SA, HM → OC, MV → AS, IO/SH/SC/MU/TF → AF. Overseas polygons of France and the Netherlands are reassigned by location (e.g. French Guiana → SA, Caribbean → NA, Réunion/Mayotte → AF). Russia is in EU (NE convention).
- **US states**: 50 + DC from the 10m admin-1 layer, `iso_3166_2` ids, `geoAlbersUsa` (Alaska/Hawaii insets are built into the projection; it returns null outside its areas).
- **Admin-1 default**: id = NE `iso_3166_2`, name = `name_en` (else `name`). Features whose code is missing or an NE placeholder (`XX-X01~`) are skipped. Features that share a code are merged.
- **Projections**: conicConformal for AR, AU, CA, CN and IN (standard parallels in `build.mjs`). Mercator elsewhere, rotated to the country's central meridian (this also keeps NZ's Chatham Islands on the same side of the antimeridian).

| Map | Units | Notes |
|---|---|---|
| france | 13 metropolitan regions | Dissolved from departments by NE `region_cod`. Corsica uses ISO `FR-20R` (NE: FR-COR). Overseas departments are skipped. |
| spain | 17 communities + Ceuta, Melilla | Dissolved from provinces by `region_cod`, mapped to ISO (PM→IB, LO→RI, MU→MC, NA→NC). Ceuta and Melilla share a region code in NE, so they are split by `iso_3166_2`. Canary Islands are shown as an inset (see `insets`). |
| italy | 20 regions | Dissolved from provinces by `region_cod` (these already match ISO IT-21…IT-88). |
| philippines | 17 regions | Dissolved from provinces by `region_cod` (PH-00…PH-41). NE predates the 2024 Negros Island Region (PH-18), which is not present. |
| united-kingdom | 4 nations | Dissolved from 232 councils by `gu_a3` → GB-ENG, GB-SCT, GB-WLS, GB-NIR. |
| nepal | 7 provinces | From geoBoundaries (Survey Department of Nepal / OCHA, CC BY 3.0 IGO), because Natural Earth only has the former 14 zones and the provinces cut across them. Ids NP-P1…NP-P7; names updated to the 2022–2023 renames (Koshi, Madhesh). |
| pakistan | 7 | FATA (PK-TA) merged into Khyber Pakhtunkhwa (2018 merger). Includes Azad Kashmir and Gilgit-Baltistan as NE draws them. |
| mexico | 32 | `MX-DIF` recoded to current ISO `MX-CMX` (Mexico City). |
| netherlands | 12 provinces | Caribbean Netherlands (BQ1–3) skipped. |
| new-zealand | 17 | NE placeholder outlying islands (Auckland, Campbell, Kermadec, …) skipped. Chatham Islands (NZ-CIT) kept. |
| australia | 8 | Jervis Bay, Macquarie and Ashmore (placeholder codes) skipped. Lord Howe is part of NSW. |
| china | 31 | Paracel Islands (placeholder) skipped. Taiwan, Hong Kong and Macao are separate countries in NE and are not included. |
| japan | 47 | Remote Tokyo islands south of 31°N / east of 132°E (Ogasawara etc.) dropped to keep the frame usable. Okinawa is kept. |
| south-africa | 9 | Prince Edward Islands dropped. |
| bangladesh | 7 divisions | NE predates Mymensingh division (2015). Its area is inside Dhaka (BD-C). |
| indonesia | 33 | NE predates the 2022 Papua splits and North Kalimantan (2012). |
| india | 36 | NE de facto boundaries (includes Ladakh / J&K as NE draws them). |

The other maps (canada, germany, brazil, turkey, south-korea, argentina, sweden, nigeria) use NE admin-1 as-is.
