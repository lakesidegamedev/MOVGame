#!/usr/bin/env python3
"""Export the 2025 Census 20m boundaries and population estimates to the iOS bundle.

Inputs: cb_2025_us_county_20m.zip and co-est2025-alldata.csv from the U.S. Census Bureau.
Requires pyshp. Pass the boundary zip, population CSV and destination JSON as arguments.
"""

import csv
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

import shapefile

shape_zip, population_csv, destination = sys.argv[1:]
with open(population_csv, encoding="cp1252", newline="") as source:
    populations = {
        row["STATE"] + row["COUNTY"]: int(row["POPESTIMATE2025"])
        for row in csv.DictReader(source) if row["SUMLEV"] == "050"
    }

states = defaultdict(list)
for feature in shapefile.Reader(f"{shape_zip}/cb_2025_us_county_20m.shp").iterShapeRecords():
    record = feature.record.as_dict()
    if record["GEOID"] not in populations:
        continue
    rings = []
    cuts = [*feature.shape.parts, len(feature.shape.points)]
    for start, end in zip(cuts, cuts[1:]):
        points = feature.shape.points[start:end]
        if len(points) >= 4:
            rings.append(points)
    if rings:
        states[record["STUSPS"]].append({
            "id": record["GEOID"], "name": record["NAMELSAD"],
            "population": populations[record["GEOID"]], "rings": rings,
        })

for state, counties in states.items():
    points = [point for county in counties for ring in county["rings"] for point in ring]
    reference = (min(lat for _, lat in points) + max(lat for _, lat in points)) / 2
    scale_x = math.cos(math.radians(reference))

    def project(lon, lat):
        if state == "AK" and lon > 0:
            lon -= 360
        return lon * scale_x, -lat

    projected = [project(*point) for point in points]
    lo_x = min(point[0] for point in projected)
    lo_y = min(point[1] for point in projected)
    longest = max(max(point[0] for point in projected) - lo_x, max(point[1] for point in projected) - lo_y)
    for county in counties:
        county["rings"] = [
            [coordinate for lon, lat in ring
             for coordinate in (round((project(lon, lat)[0] - lo_x) / longest * 10000),
                                round((project(lon, lat)[1] - lo_y) / longest * 10000))]
            for ring in county["rings"]
        ]
    counties.sort(key=lambda county: county["id"])

assert len(states) == 51
assert {county["id"] for counties in states.values() for county in counties} == populations.keys()
lines = [f"{json.dumps(state)}:{json.dumps(counties, ensure_ascii=False, separators=(',', ':'))}"
         for state, counties in sorted(states.items())]
Path(destination).write_text("{\n" + ",\n".join(lines) + "\n}\n", encoding="utf-8")
