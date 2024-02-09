import JSONElement, { enableDiff } from "@jakelazaroff/jsonelement";
enableDiff();

class GeoJsonFeatureCollection extends JSONElement {
  static tag = "geojson-featurecollection";
  diff = true;

  static get schema() {
    return {
      type: "FeatureCollection",
      features: [GeoJsonFeature]
    };
  }
}

class GeoJsonFeature extends JSONElement {
  static tag = "geojson-feature";

  static get schema() {
    return {
      type: "Feature",
      geometry: GeoJsonPoint,
      properties: Object
    };
  }
}

class GeoJsonCoordinate extends JSONElement {
  static tag = "geojson-coordinate";

  static schema = { lon: Number, lat: Number };

  get json() {
    const { lon, lat } = super.json;
    return [lon, lat];
  }
}

class GeoJsonPoint extends JSONElement {
  static tag = "geojson-point";

  static get schema() {
    return {
      type: "Point",
      coordinates: GeoJsonCoordinate
    };
  }
}

class GeoJsonLineString extends JSONElement {
  static tag = "geojson-linestring";

  static get schema() {
    return {
      type: "LineString",
      coordinates: [GeoJsonCoordinate]
    };
  }
}

class GeoJsonProperties extends JSONElement {
  static tag = "geojson-properties";

  static schema = { name: String };
}

GeoJsonFeatureCollection.register();
GeoJsonFeature.register();
GeoJsonCoordinate.register();
GeoJsonPoint.register();
GeoJsonLineString.register();
GeoJsonProperties.register();
