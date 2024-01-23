export interface Place {
  name: string;
  mapboxId: string;
  position: [number, number];
}

export type Coordinate = [longitude: number, latitude: number];
export type BoundingBox = [Coordinate, Coordinate];
