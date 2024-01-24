export interface Place {
  name: string;
  mapboxId: string;
  position: [number, number];
}

export type Coordinate = [longitude: number, latitude: number];
export type BoundingBox = [Coordinate, Coordinate];

export interface GeoJsonFeatureCollection<P = GeoJsonProperties> {
  type: "FeatureCollection";
  features: GeoJsonFeature<P>[];
}

export type GeoJsonProperties = { [name: string]: any } | null;

export interface GeoJsonFeature<P = GeoJsonProperties> {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: Coordinate;
  };
  properties: P;
}
