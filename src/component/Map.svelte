<script lang="ts">
  import "mapbox-gl/dist/mapbox-gl.css";

  import mapboxgl from "mapbox-gl";
  import { onMount } from "svelte";

  import { PUBLIC_MAPBOX_TOKEN } from "$env/static/public";

  import type { GeoJSON, BoundingBox, Coordinate } from "~/lib/place";
  import Icon from "~/component/Icon.svelte";
  import Button from "~/component/Button.svelte";

  let {
    places,
    bounds: _bounds,
    center: _center
  } = $props<{
    places: GeoJSON<{ name: string; mapboxId: string }>[];
    bounds?: BoundingBox;
    center?: Coordinate;
  }>();

  mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

  let el = $state<HTMLElement>();
  let map: mapboxgl.Map;

  function syncPosition() {
    const c = map.getCenter();
    _center = [c.lng, c.lat];

    const bbox = map.getBounds();
    const sw = bbox.getSouthWest();
    const ne = bbox.getNorthEast();
    _bounds = [
      [sw.lng, sw.lat],
      [ne.lng, ne.lat]
    ];
  }

  onMount(() => {
    if (!el) return;

    map = new mapboxgl.Map({
      container: el,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-74.5, 40],
      zoom: 7
    });

    map.on("load", () => {
      map.addSource("places", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: places
        }
      });

      map.addLayer({
        id: "points",
        type: "symbol",
        source: "places",
        layout: {
          "text-field": ["get", "name"],
          // "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-offset": [0, 0.5],
          "text-anchor": "top"
        }
      });
    });

    map.on("moveend", syncPosition);
    syncPosition();
  });

  function boundingBox(coords: [longitude: number, latitude: number][]) {
    const lat = coords.map(([, lat]) => lat);
    const lon = coords.map(([lon]) => lon);

    return {
      ne: [Math.max(...lon), Math.max(...lat)] as mapboxgl.LngLatLike,
      sw: [Math.min(...lon), Math.min(...lat)] as mapboxgl.LngLatLike
    };
  }

  let placeids = new Set<string>([]);
  function intersection<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    const result = new Set<T>();

    const small = set1.size <= set2.size ? set1 : set2;
    const large = small === set1 ? set2 : set1;

    for (const value of small) {
      if (large.has(value)) result.add(value);
    }

    return result;
  }

  $effect(() => {
    const source = map.getSource("places") as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: places });

    const markers = places.map(place =>
      new mapboxgl.Marker().setLngLat(place.geometry.coordinates).addTo(map)
    );

    const ids = new Set(places.map(place => place.properties.mapboxId));
    if (ids.size !== placeids.size || intersection(placeids, ids).size !== ids.size) {
      placeids = ids;
      const { ne, sw } = boundingBox(places.map(place => place.geometry.coordinates));
      map.fitBounds([ne, sw], { padding: 200, maxZoom: 12, duration: 1000 });
    }

    return () => markers.forEach(marker => marker.remove());
  });
</script>

<div class="wrapper">
  <div class="tools">
    <Button
      onclick={() => {
        const { ne, sw } = boundingBox(places.map(place => place.geometry.coordinates));
        map.fitBounds([ne, sw], { padding: 100, maxZoom: 12, duration: 1000 });
      }}
    >
      <Icon name="pins" />
    </Button>
  </div>
  <div class="map" bind:this={el}></div>
</div>

<style>
  .wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .tools {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
  }
</style>
