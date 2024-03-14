export type Coordinate = [longitude: number, latitude: number];

export type Route = {
  type: "route";
  places: Place[];
};

export type Place = {
  type: "place";
  name: string;
  navigate: boolean;
  position: [number, number];
};
