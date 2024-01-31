<script lang="ts">
  import "mapbox-gl/dist/mapbox-gl.css";

  import mapboxgl from "mapbox-gl";
  import { onMount } from "svelte";

  import { PUBLIC_MAPBOX_TOKEN } from "$env/static/public";

  import {
    toGeoJsonPoints,
    toGeoJsonLines,
    type Place,
    type Route,
    type Coordinate
  } from "~/lib/place";
  import Icon from "~/component/Icon.svelte";
  import Button from "~/component/Button.svelte";
  import { center } from "~/store/map.svelte";

  let { places: data } = $props<{ places: Array<Place | Route> }>();

  let el = $state<HTMLElement>();
  let loaded = $state(false);
  let map: mapboxgl.Map;

  onMount(() => {
    if (!el) return;

    map = new mapboxgl.Map({
      accessToken: PUBLIC_MAPBOX_TOKEN,
      container: el,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-74.5, 40],
      zoom: 7
    });

    map.on("load", () => {
      loaded = true;
      map.addSource("places", { type: "geojson", data: toGeoJsonPoints(data) });
      map.addSource("routes", { type: "geojson", data: toGeoJsonLines(data) });

      const pin = new Image();
      pin.src = "/pin.svg";
      pin.width = pin.height = 64;
      pin.onload = () => map.addImage("pin", pin);

      map.addLayer({
        id: "text",
        type: "symbol",
        source: "places",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-offset": [0, 0.5],
          "text-anchor": "top",
          "text-optional": true
        },
        paint: {
          "text-halo-color": "#ffffff",
          "text-halo-width": 2
        }
      });

      map.addLayer({
        id: "lines",
        type: "line",
        source: "routes",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#5c7cfa",
          "line-width": 4
        }
      });

      map.addLayer({
        id: "markers",
        type: "symbol",
        source: "places",
        layout: {
          "icon-image": "pin",
          "icon-size": 0.5,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true
        }
      });

      fitBounds(data.flat().map(place => place.position));
    });

    map.on("moveend", () => center.set([map.getCenter().lng, map.getCenter().lat]));
  });

  function fitBounds(coords: Coordinate[]) {
    if (!coords.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const coord of coords) {
      bounds.extend(new mapboxgl.LngLat(...coord));
    }

    map.fitBounds(bounds, { padding: 200, maxZoom: 12, duration: 1000 });
  }

  $effect(() => {
    // update the data sources
    const places = map.getSource("places") as mapboxgl.GeoJSONSource | undefined;
    places?.setData(toGeoJsonPoints(data));

    const routes = map.getSource("routes") as mapboxgl.GeoJSONSource | undefined;
    routes?.setData(toGeoJsonLines(data));

    // fit the map to the current set of bounds
    fitBounds(data.flat().map(place => place.position));
  });
</script>

<div class="wrapper">
  <div class="tools">
    <Button onclick={() => fitBounds(data.flat().map(place => place.position))}>
      <Icon name="pins" />
    </Button>
  </div>
  <div class="map" class:loaded bind:this={el}></div>
</div>

<style>
  .wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #354b68;
  }

  .map {
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .map.loaded {
    opacity: 1;
  }

  .tools {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
  }
</style>
