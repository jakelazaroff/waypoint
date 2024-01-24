export interface Place {
  name: string;
  mapboxId: string;
  position: [number, number];
}

export type Coordinate = [longitude: number, latitude: number];
export type BoundingBox = [Coordinate, Coordinate];

export interface GeoJSON<Properties> {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: Coordinate;
  };
  properties: Properties;
}
