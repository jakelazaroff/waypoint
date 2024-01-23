<script lang="ts">
  import "mapbox-gl/dist/mapbox-gl.css";

  import mapboxgl from "mapbox-gl";
  import { onMount } from "svelte";

  import { PUBLIC_MAPBOX_TOKEN } from "$env/static/public";

  import type { Place, BoundingBox, Coordinate } from "~/lib/place";

  let {
    places,
    bounds: _bounds,
    center: _center
  } = $props<{ places: Place[]; bounds?: BoundingBox; center?: Coordinate }>();

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

  $effect(() => {
    if (!places.length) return;

    const markers = places.map(place => new mapboxgl.Marker().setLngLat(place.position).addTo(map));

    const { ne, sw } = boundingBox(places.map(place => place.position));
    map.fitBounds([ne, sw], { padding: 100, maxZoom: 12, duration: 1000 });

    return () => markers.forEach(marker => marker.remove());
  });
</script>

<div class="map" bind:this={el}></div>

<style>
  .map {
    width: 100%;
    height: 100%;
  }
</style>
