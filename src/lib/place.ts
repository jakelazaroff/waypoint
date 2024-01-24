import type * as GeoJson from "./geojson";

export type Coordinate = [longitude: number, latitude: number];

export interface Place {
  name: string;
  position: [number, number];
}

export function toGeoJson(places: Place[]): GeoJson.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map(place => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: place.position },
      properties: { name: place.name }
    }))
  };
}
