export type Coordinate = [longitude: number, latitude: number];

export type Route = {
  type: "route";
  places: Place[];
};

export interface Place {
  type: "place";
  name: string;
  position: [number, number];
}
