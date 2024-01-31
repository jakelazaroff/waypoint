import type * as GeoJson from "./geojson";

export type Coordinate = [longitude: number, latitude: number];

export type Route = Place[];

export interface Place {
  name: string;
  position: [number, number];
}

export function toGeoJsonPoints(data: Array<Place | Route>): GeoJson.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.flat().map<GeoJson.Feature>(place => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: place.position },
      properties: { name: place.name }
    }))
  };
}

export function toGeoJsonLines(data: Array<Place | Route>): GeoJson.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data
      .filter((feature): feature is Route => Array.isArray(feature))
      .map<GeoJson.Feature>(route => ({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: route.map(place => place.position)
        },
        properties: {}
      }))
  };
}
