import maplibre, { GeoJSONSource } from "maplibre-gl";
import JSONElement, { enableDiff } from "@jakelazaroff/jsonelement";
enableDiff();

/** @template T @typedef {T extends { new (...args: any[]): infer U } ? U : never} InstanceOf<T> */
/** @type {<T extends Function>(base: T) => (x: unknown) => x is InstanceOf<T>} */
const is =
  // @ts-ignore
  base => x => x instanceof base;

/** @param {string} key */
function Todo(key) {
  /** @param {unknown} value */
  return value => {
    if (value === null) return undefined;
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
  #loaded = false;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <div export class="map"></div>
      <slot></slot>
      <style>
        .map { width: 100%; height: 100%; }
        canvas { display: block; }
        slot { display: none; }
      </style>
    `;

    this.addEventListener("json-change", this);
  }

  get map() {
    if (!this.#map) throw new Error(`No Map instance found`);
    return this.#map;
  }

  /** @param {import("./jsonelement.js").JSONChangeEvent} ev */
  handleEvent(ev) {
    if (ev.target instanceof MapLibreOptions) this.updateOptions(ev.detail.patches);
    else if (ev.target instanceof MapLibreLayer) this.updateLayer(ev.target, ev.detail.patches);
    else if (ev.target instanceof HTMLImageElement) this.updateImages();
    else if (ev.target instanceof MapLibreSource) this.updateSources();
  }

  /** @param {import("./jsonelement.js").Patch[]} patches */
  updateOptions(patches = []) {
    const [options] = this.slotted(MapLibreOptions);

    for (const { path, value } of patches) {
      const [, key] = path.split("/");
      switch (key) {
        case "bounds":
          const bounds = options.json.bounds;
          if (bounds) this.map.fitBounds(bounds);
          break;
        case "style-src":
          this.map.setStyle(value);
          break;
        case "zoom":
          this.map.setZoom(value);
          break;
      }
    }
  }

  updateLayers() {
    const layers = this.slotted(MapLibreLayer);

    for (const layer of layers) {
      this.updateLayer(layer);
    }
  }

  /**
   * @param {MapLibreLayer} el
   * @param {import("./jsonelement.js").Patch[]} patches
   */
  updateLayer(el, patches = []) {
    if (!this.#loaded) return;

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
    if (!this.#loaded) return;

    // get a list of all sources
    const sources = this.slotted(MapLibreSource).map(el => el.json);

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
    if (!this.#loaded) return;

    const images = this.slotted(HTMLImageElement);

    for (const img of images) {
      const image = this.map.getImage(img.id);
      if (!image) this.map.addImage(img.id, img);
      else this.map.updateImage(img.id, img);
    }
  }

  connectedCallback() {
    const container = this.shadowRoot?.querySelector(".map");
    if (!(container instanceof HTMLElement)) return;

    const [options] = this.slotted(MapLibreOptions);
    this.#map = new maplibre.Map({ ...options.json, container });

    this.map.once("load", () => {
      this.#loaded = true;
      this.updateSources();
      this.updateImages();
      this.updateLayers();
    });
  }

  /**
   * @template {typeof HTMLElement} T
   * @param {T} tag
   */
  slotted(tag) {
    /** @type {HTMLSlotElement | null | undefined} */
    const slot = this.shadowRoot?.querySelector("slot");
    const els = slot?.assignedElements() || [];

    return els.filter(is(tag));
  }
}

export class MapLibreOptions extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-options");

  static get schema() {
    return {
      "style-url": String,
      "attribution-control": Boolean,
      "center": MapLibrePosition,
      "bounds": MapLibreBounds,
      "zoom": Number
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

  static get schema() {
    return {
      id: String,
      type: String,
      source: String,
      paint: Object,
      layout: Object
    };
  }
}

export class MapLibreLayerLayout extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-layout");

  static get schema() {
    return {
      visibility: String
    };
  }
}

export class MapLibreLayerPaintBackground extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-background");

  static get schema() {
    return {
      "background-color": String,
      "background-opacity": Number,
      "background-pattern": String
    };
  }
}

export class MapLibreLayerLayoutCircle extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-layout-circle");

  static schema = {
    "visibility": String,
    "circle-sort-key": Number
  };
}

export class MapLibreLayerPaintCircle extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-circle");

  static get schema() {
    return {
      "circle-radius": Number,
      "circle-color": String,
      "circle-blur": Number,
      "circle-opacity": Number,
      "circle-translate": Todo("circle-translate"),
      "circle-translate-anchor": String,
      "circle-pitch-scale": String,
      "circle-pitch-alignment": String,
      "circle-stroke-width": Number,
      "circle-stroke-color": String,
      "circle-stroke-opacity": Number
    };
  }
}

export class MapLibreLayerLayoutFill extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-layout-fill");

  static schema = {
    "visibility": String,
    "fill-sort-key": Number
  };
}

export class MapLibreLayerPaintFill extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-fill");

  static get schema() {
    return {
      "fill-antialias": Boolean,
      "fill-color": String,
      "fill-opacity": Number,
      "fill-outline-color": String,
      "fill-pattern": String,
      "fill-translate": Todo("fill-translate"),
      "fill-translate-anchor": String
    };
  }
}

export class MapLibreLayerPaintFillExtrusion extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-fillextrusion");

  static get schema() {
    return {
      "fill-extrusion-opacity": Number,
      "fill-extrusion-color": String,
      "fill-extrusion-translate": Todo("fill-extrusion-translate"),
      "fill-extrusion-translate-anchor": String,
      "fill-extrusion-pattern": String,
      "fill-extrusion-height": Number,
      "fill-extrusion-base": Number,
      "fill-extrusion-vertical-gradient": Boolean
    };
  }
}

export class MapLibreLayerPaintHeatmap extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-heatmap");

  static get schema() {
    return {
      "heatmap-radius": Number,
      "heatmap-weight": Number,
      "heatmap-intensity": Number,
      "heatmap-color": Todo("heatmap-color"),
      "heatmap-opacity": Number
    };
  }
}

export class MapLibreLayerPaintHillshade extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-hillshade");

  static get schema() {
    return {
      "hillshade-illumination-direction": Number,
      "hillshade-illumination-anchor": String,
      "hillshade-exaggeration": Number,
      "hillshade-shadow-color": String,
      "hillshade-highlight-color": String,
      "hillshade-accent-color": String
    };
  }
}

export class MapLibreLayerLayoutLine extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-layout-line");

  static schema = {
    "visibility": String,
    "line-cap": String,
    "line-join": String,
    "line-miter-limit": Number,
    "line-round-limit": Number,
    "line-sort-key": Number
  };
}

export class MapLibreLayerPaintLine extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-line");

  static schema = {
    "line-blur": Number,
    "line-color": String,
    "line-dasharray": Todo("line-dasharray"),
    "line-gap-width": Number,
    "line-gradient": String,
    "line-offset": Number,
    "line-opacity": Number,
    "line-pattern": String,
    "line-translate": Todo("line-translate"),
    "line-translate-anchor": String,
    "line-width": Number
  };
}

export class MapLibreLayerPaintRaster extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-raster");

  static get schema() {
    return {
      "raster-opacity": Number,
      "raster-hue-rotate": Number,
      "raster-brightness-min": Number,
      "raster-brightness-max": Number,
      "raster-saturation": Number,
      "raster-contrast": Number,
      "raster-resampling": String,
      "raster-fade-duration": Number
    };
  }
}

export class MapLibreLayerLayoutSymbol extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-layout-symbol");

  static schema = {
    "visibility": String,
    "symbol-placement": String,
    "symbol-spacing": Number,
    "symbol-avoid-edges": Boolean,
    "symbol-sort-key": Number,
    "symbol-z-order": String,
    "icon-allow-overlap": Boolean,
    "icon-overlap": String,
    "icon-ignore-placement": Boolean,
    "icon-optional": Boolean,
    "icon-rotation-alignment": String,
    "icon-size": Number,
    "icon-text-fit": String,
    "icon-text-fit-padding": Todo("icon-text-fit-padding"),
    "icon-image": String,
    "icon-rotate": Number,
    "icon-padding": Todo("icon-padding"),
    "icon-keep-upright": Boolean,
    "icon-offset": Todo("icon-offset"),
    "icon-anchor": String,
    "icon-pitch-alignment": String,
    "text-pitch-alignment": String,
    "text-rotation-a7lignment": String,
    "text-field": x => (x === null ? undefined : JSON.parse(x)),
    "text-font": x => (x === null ? undefined : JSON.parse(x)),
    "text-size": Number,
    "text-max-width": Number,
    "text-line-height": Number,
    "text-letter-spacing": Number,
    "text-justify": String,
    "text-radial-offset": Number,
    "text-variable-anchor": Todo("text-variable-anchor"),
    "text-variable-anchor-offset": Todo("text-variable-anchor-offset"),
    "text-anchor": String,
    "text-max-angle": Number,
    "text-writing-mode": Todo("text-writing-mode"),
    "text-rotate": Number,
    "text-padding": Number,
    "text-keep-upright": Boolean,
    "text-transform": String,
    "text-offset": x => (x === null ? undefined : JSON.parse(x)),
    "text-allow-overlap": Boolean,
    "text-overlap": String,
    "text-ignore-placement": Boolean,
    "text-optional": Boolean
  };
}

export class MapLibreLayerPaintSymbol extends JSONElement {
  static tag = /** @type {const} */ ("maplibre-layer-paint-symbol");

  static schema = {
    "icon-opacity": Number,
    "icon-color": String,
    "icon-halo-color": String,
    "icon-halo-width": Number,
    "icon-halo-blur": Number,
    "icon-translate": Todo("icon-translate"),
    "icon-translate-anchor": String,
    "text-opacity": Number,
    "text-color": String,
    "text-halo-color": String,
    "text-halo-width": Number,
    "text-halo-blur": Number,
    "text-translate": Todo("text-translate"),
    "text-translate-anchor": String
  };
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
  [MapLibreSource.tag]: MapLibreSource,
  // layers
  [MapLibreLayer.tag]: MapLibreLayer,
  [MapLibreLayerLayout.tag]: MapLibreLayerLayout,
  // background layer styles
  [MapLibreLayerPaintBackground.tag]: MapLibreLayerPaintBackground,
  // circle layer styles
  [MapLibreLayerLayoutCircle.tag]: MapLibreLayerLayoutCircle,
  [MapLibreLayerPaintCircle.tag]: MapLibreLayerPaintCircle,
  // fill layer styles
  [MapLibreLayerLayoutFill.tag]: MapLibreLayerLayoutFill,
  [MapLibreLayerPaintFill.tag]: MapLibreLayerPaintFill,
  // fill extrusion layer styles
  [MapLibreLayerPaintFillExtrusion.tag]: MapLibreLayerPaintFillExtrusion,
  // heatmap layer styles
  [MapLibreLayerPaintHeatmap.tag]: MapLibreLayerPaintHeatmap,
  // hillshade layer styles
  [MapLibreLayerPaintHillshade.tag]: MapLibreLayerPaintHillshade,
  // line layer styles
  [MapLibreLayerLayoutLine.tag]: MapLibreLayerLayoutLine,
  [MapLibreLayerPaintLine.tag]: MapLibreLayerPaintLine,
  // raster layer styles
  [MapLibreLayerPaintRaster.tag]: MapLibreLayerPaintRaster,
  // symbol layer styles
  [MapLibreLayerLayoutSymbol.tag]: MapLibreLayerLayoutSymbol,
  [MapLibreLayerPaintSymbol.tag]: MapLibreLayerPaintSymbol
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
