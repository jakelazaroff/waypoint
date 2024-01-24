type Coordinate = [longitude: number, latitude: number];

export type Properties = { [name: string]: any } | null;

export interface FeatureCollection<P = Properties> {
  type: "FeatureCollection";
  features: Feature<P>[];
}

export interface Feature<P = Properties> {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: Coordinate;
  };
  properties: P;
}
