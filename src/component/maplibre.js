import maplibre, { GeoJSONSource } from "maplibre-gl";

import JSONElement, { Enum, Optional } from "./json-element.js";

/** @template T @typedef {T extends { new (...args: any[]): infer U } ? U : never} InstanceOf<T> */
/** @type {<T extends Function>(base: T) => (x: unknown) => x is InstanceOf<T>} */
const is =
  // @ts-ignore
  base => x => x instanceof base;

/** @param {string} value */
const toCoords = value =>
  value
    .split(",")
    .map(x => Number(x))
    .slice(0, 2);

/** @param {string} key */
function Todo(key) {
  /** @param {unknown} value */
  return value => {
    console.warn(key + " not yet supported");
    return value;
  };
}

export class MapLibreBase extends HTMLElement {
  static tag = /** @type {const} */ ("map-libre");

  static register(tag = this.tag) {
    const ce = customElements.get(tag);
    if (ce === this) return;
    else if (ce) return console.warn(`<${tag}> already registered!`);

    customElements.define(tag, this);
  }
}

export class MapLibre extends MapLibreBase {
  /** @type {maplibre.Map | undefined} */
  #map;

  static observedAttributes = ["style-src", "center", "zoom"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <div export class="map"></div>
      <slot name="options"></slot>
      <slot name="layers"></slot>
      <slot name="sources"></slot>
      <slot name="images"></slot>
      <style>
        slot { display: none; }
        canvas { display: block; }
        .map { width: 100%; height: 100%; }
      </style>
    `;

    this.addEventListener("json-change", this);
  }

  get map() {
    if (!this.#map) throw new Error(`No Map instance found`);
    return this.#map;
  }

  /** @param {import("./json-element.js").JSONChangeEvent} ev */
  handleEvent(ev) {
    if (!this.map.isStyleLoaded()) return;
    if (!is(HTMLElement)(ev.target)) return;

    switch (ev.target.slot) {
      case "options":
        this.updateOptions(ev.detail.patches);
        break;

      case "layers":
        if (!is(MapLibreLayer)(ev.target)) return;
        this.updateLayer(ev.target, ev.detail.patches);
        break;

      case "images":
        this.updateImages();
        break;

      case "sources":
        this.updateSources();
        break;
    }
  }

  /** @param {import("./json-element.js").Patch[]} patches */
  updateOptions(patches = []) {
    const [el] = this.slotted("options").filter(is(MapLibreOptions));
    const options = el.json;

    const regex = /^\/(.+?)\//;
    for (const { path } of patches) {
      const [, key] = path.match(regex) || [];
      switch (key) {
        case "bounds":
          this.map.fitBounds(options.bounds);
      }
    }
  }

  updateLayers() {
    const layers = this.slotted("layers").filter(is(MapLibreLayer));

    for (const layer of layers) {
      this.updateLayer(layer);
    }
  }

  /**
   * @param {MapLibreLayer} el
   * @param {import("./json-element.js").Patch[]} patches
   */
  updateLayer(el, patches = []) {
    // create the layer if it doesn't exist
    const layer = this.map.getLayer(el.id);
    if (!layer) this.map.addLayer(el.json);

    // for each change to the layer
    for (const { path, value } of patches) {
      // determine whether the property is paint or layout
      const [, type, name] = path.split("/");

      // set the layer property
      if (type === "layout") this.map.setLayoutProperty(el.id, name, value);
      if (type === "paint") this.map.setPaintProperty(el.id, name, value);
    }
  }

  updateSources() {
    // get a list of all sources
    const sources = this.slotted("sources")
      .filter(is(JSONElement))
      .map(el => el.json);

    // for each source…
    for (const { id, ...json } of sources) {
      // create the source if it doesn't exist, or set its data if it does
      const source = this.map.getSource(id);
      if (!source) this.map.addSource(id, json);
      else if (source instanceof GeoJSONSource) source.setData(json.data);
      else console.warn(`Only GeoJSONSources supported`);
    }
  }

  updateImages() {
    const images = this.slotted("images").filter(is(HTMLImageElement));

    for (const img of images) {
      const image = this.map.getImage(img.id);
      if (!image) this.map.addImage(img.id, img);
      else this.map.updateImage(img.id, img);
    }
  }

  connectedCallback() {
    const container = this.shadowRoot?.querySelector(".map");
    if (!(container instanceof HTMLElement)) return;

    const [options] = this.slotted("options").filter(is(MapLibreOptions));
    this.#map = new maplibre.Map({
      container,
      ...options.json
    });

    this.map.once("load", () => {
      this.updateSources();
      this.updateImages();
      this.updateLayers();
    });
  }

  /**
   * @param {string} name
   * @param {string | null} _prev
   * @param {string | null} value
   */
  attributeChangedCallback(name, _prev, value) {
    switch (name) {
      case "style-src":
        if (value) this.map.setStyle(value);
        break;
      case "zoom":
        if (value) this.map.setZoom(Number(value));
        break;
      case "center":
        if (!value) return;
        const [lon = 0, lat = 0] = value.split(",").map(x => Number(x));
        this.map.setCenter([lon, lat]);
        break;
    }
  }

  slotted(name = "") {
    let selector = "slot";
    if (name) selector += `[name=${name}]`;

    /** @type {HTMLSlotElement | null | undefined} */
    const slot = this.shadowRoot?.querySelector(selector);
    return slot?.assignedElements() || [];
  }
}

export class MapLibreOptions extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-options");

  diff = true;
  static get schema() {
    return {
      "style-url": Optional(String),
      "attribution-control": Optional(Boolean),
      "center": MapLibrePosition,
      "bounds": MapLibreBounds,
      "zoom": Optional(Number)
    };
  }

  /** @type {maplibre.MapOptions} */
  get json() {
    const {
      "attribution-control": attributionControl,
      "style-url": style = "https://demotiles.maplibre.org/style.json",
      ...options
    } = super.json;

    return {
      attributionControl,
      style,
      ...options
    };
  }
}

export class MapLibreLayer extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer");
  diff = true;
  static get schema() {
    return {
      id: String,
      type: String,
      source: String,
      paint: MapLibreLayerPaint,
      layout: MapLibreLayerLayout
    };
  }
}

export class MapLibreLayerLayout extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-layout");

  static get schema() {
    return {
      "visibility": Optional(String),
      // fill
      "fill-sort-key": Optional(Number),
      // line
      "line-cap": Optional(String),
      "line-join": Optional(String),
      "line-miter-limit": Optional(Number),
      "line-round-limit": Optional(Number),
      "line-sort-key": Optional(Number),
      // symbol
      "symbol-placement": Optional(String),
      "symbol-spacing": Optional(Number),
      "symbol-avoid-edges": Optional(Boolean),
      "symbol-sort-key": Optional(Number),
      "symbol-z-order": Optional(String),
      "icon-allow-overlap": Optional(Boolean),
      "icon-overlap": Optional(String),
      "icon-ignore-placement": Optional(Boolean),
      "icon-optional": Optional(Boolean),
      "icon-rotation-alignment": Optional(String),
      "icon-size": Optional(Number),
      "icon-text-fit": Optional(String),
      "icon-text-fit-padding": Optional(Todo("icon-text-fit-padding")),
      "icon-image": Optional(String),
      "icon-rotate": Optional(Number),
      "icon-padding": Optional(Todo("icon-padding")),
      "icon-keep-upright": Optional(Boolean),
      "icon-offset": Optional(Todo("icon-offset")),
      "icon-anchor": Optional(String),
      "icon-pitch-alignment": Optional(String),
      "text-pitch-alignment": Optional(String),
      "text-rotation-a7lignment": Optional(String),
      "text-field": Optional(x => JSON.parse(x)),
      "text-font": Optional(x => JSON.parse(x)),
      "text-size": Optional(Number),
      "text-max-width": Optional(Number),
      "text-line-height": Optional(Number),
      "text-letter-spacing": Optional(Number),
      "text-justify": Optional(String),
      "text-radial-offset": Optional(Number),
      "text-variable-anchor": Optional(Todo("text-variable-anchor")),
      "text-variable-anchor-offset": Optional(Todo("text-variable-anchor-offset")),
      "text-anchor": Optional(String),
      "text-max-angle": Optional(Number),
      "text-writing-mode": Optional(Todo("text-writing-mode")),
      "text-rotate": Optional(Number),
      "text-padding": Optional(Number),
      "text-keep-upright": Optional(Boolean),
      "text-transform": Optional(String),
      "text-offset": Optional(x => JSON.parse(x)),
      "text-allow-overlap": Optional(Boolean),
      "text-overlap": Optional(String),
      "text-ignore-placement": Optional(Boolean),
      "text-optional": Optional(Boolean),
      // circle
      "circle-sort-key": Optional(Number)
    };
  }
}

export class MapLibreLayerPaint extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint");

  static get schema() {
    return {
      // background
      "background-color": Optional(String),
      "background-opacity": Optional(Number),
      "background-pattern": Optional(String),
      // fill
      "fill-antialias": Optional(Boolean),
      "fill-color": Optional(String),
      "fill-opacity": Optional(Number),
      "fill-outline-color": Optional(String),
      "fill-pattern": Optional(String),
      "fill-translate": Optional(Todo("fill-stranslate")),
      "fill-translate-anchor": Optional(String),
      // line
      "line-blur": Optional(Number),
      "line-color": Optional(String),
      "line-dasharray": Optional(Todo("line-dasharray")),
      "line-gap-width": Optional(Number),
      "line-gradient": Optional(String),
      "line-offset": Optional(Number),
      "line-opacity": Optional(Number),
      "line-pattern": Optional(String),
      "line-translate": Optional(Todo("line-translate")),
      "line-translate-anchor": Optional(String),
      "line-width": Optional(Number),
      // symbol
      "icon-opacity": Optional(Number),
      "icon-color": Optional(String),
      "icon-halo-color": Optional(String),
      "icon-halo-width": Optional(Number),
      "icon-halo-blur": Optional(Number),
      "icon-translate": Optional(Todo("icon-translate")),
      "icon-translate-anchor": Optional(String),
      "text-opacity": Optional(Number),
      "text-color": Optional(String),
      "text-halo-color": Optional(String),
      "text-halo-width": Optional(Number),
      "text-halo-blur": Optional(Number),
      "text-translate": Optional(Todo("text-translate")),
      "text-translate-anchor": Optional(String),
      // circle
      "circle-radius": Optional(Number),
      "circle-color": Optional(String),
      "circle-blur": Optional(Number),
      "circle-opacity": Optional(Number),
      "circle-translate": Optional(Todo("circle-translate")),
      "circle-translate-anchor": Optional(String),
      "circle-pitch-scale": Optional(Enum("map", "viewport")),
      "circle-pitch-alignment": Optional(Enum("map", "viewport")),
      "circle-stroke-width": Optional(Number),
      "circle-stroke-color": Optional(String),
      "circle-stroke-opacity": Optional(Number),
      // heatmap
      "heatmap-radius": Optional(Number),
      "heatmap-weight": Optional(Number),
      "heatmap-intensity": Optional(Number),
      "heatmap-color": Optional(Todo("heatmap-color")),
      "heatmap-opacity": Optional(Number),
      // fill extrusion
      "fill-extrusion-opacity": Optional(Number),
      "fill-extrusion-color": Optional(String),
      "fill-extrusion-translate": Optional(Todo("fill-extrusion-translate")),
      "fill-extrusion-translate-anchor": Optional(String),
      "fill-extrusion-pattern": Optional(String),
      "fill-extrusion-height": Optional(Number),
      "fill-extrusion-base": Optional(Number),
      "fill-extrusion-vertical-gradient": Optional(Boolean),
      // raster
      "raster-opacity": Optional(Number),
      "raster-hue-rotate": Optional(Number),
      "raster-brightness-min": Optional(Number),
      "raster-brightness-max": Optional(Number),
      "raster-saturation": Optional(Number),
      "raster-contrast": Optional(Number),
      "raster-resampling": Optional(String),
      "raster-fade-duration": Optional(Number),
      // hillshade
      "hillshade-illumination-direction": Optional(Number),
      "hillshade-illumination-anchor": Optional(String),
      "hillshade-exaggeration": Optional(Number),
      "hillshade-shadow-color": Optional(String),
      "hillshade-highlight-color": Optional(String),
      "hillshade-accent-color": Optional(String)
    };
  }
}

export class MapLibrePosition extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-position");

  static get schema() {
    return {
      lon: Number,
      lat: Number
    };
  }

  /** @type {[longitude: number, latitude: number]} */
  get json() {
    const { lon, lat } = super.json;
    return [lon, lat];
  }
}

export class MapLibreBounds extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-bounds");

  static get schema() {
    return {
      positions: Array(MapLibrePosition)
    };
  }

  /** @type {[[number, number], [number, number]]} */
  get json() {
    const bounds = new maplibre.LngLatBounds();
    for (const position of super.json.positions) {
      bounds.extend(position);
    }

    const ne = bounds.getNorthEast(),
      sw = bounds.getSouthWest();
    return [sw.toArray(), ne.toArray()];
  }
}

export class MapLibreSource extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-source");

  static get schema() {
    return {
      id: String,
      type: String,
      data: Object
    };
  }
}

const TAGS = {
  [MapLibre.tag]: MapLibre,
  [MapLibrePosition.tag]: MapLibrePosition,
  [MapLibreBounds.tag]: MapLibreBounds,
  [MapLibreOptions.tag]: MapLibreOptions,
  [MapLibreLayerLayout.tag]: MapLibreLayerLayout,
  [MapLibreLayerPaint.tag]: MapLibreLayerPaint,
  [MapLibreLayer.tag]: MapLibreLayer,
  [MapLibreSource.tag]: MapLibreSource
};

/** @param {{ [K in keyof typeof TAGS]?: `${string}-${string}`}} [tags] */
export function register(tags = {}) {
  for (const [tag, el] of Object.entries(TAGS)) {
    el.register(tags[tag] || tag);
  }

  return Promise.all(
    Object.keys(TAGS)
      .map(tag => tags[tag] || tag)
      .map(tag => customElements.whenDefined(tag))
  );
}
