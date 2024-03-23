<script lang="ts">
  import { onMount } from "svelte";
  import { Protocol } from "pmtiles";
  import { RoutingApi } from "@stadiamaps/api";
  import { decode } from "@mapbox/polyline";
  // import layers from "protomaps-themes-base";

  import "./geojson.js";
  import { addProtocol, register, type MapLibre, type MapLibreBounds } from "./maplibre.js";
  import Tooltip from "./Tooltip.svelte";

  let ready = $state(false);
  onMount(async () => {
    addProtocol("pmtiles", new Protocol().tile);
    await register();
    ready = true;
  });

  import { type Place, type Route } from "~/lib/place";
  import Icon from "~/component/Icon.svelte";
  import Button from "~/component/Button.svelte";
  import Toggle from "./Toggle.svelte";

  let { focused, places, routes } = $props<{
    focused: boolean;
    places: Place[];
    routes: Route[];
  }>();
  let map = $state<MapLibre>();
  let bounds = $state<MapLibreBounds>();

  function key(a: Place, b: Place) {
    if (!a || !b) return "";
    return `${a.position[0]},${a.position[1]}_${b.position[0]},${b.position[1]}`;
  }

  let directions = $state<Record<string, string>>({});
  let lines = $derived.by(() => {
    return routes.map(route => {
      console.log(route.places);
      return route.places.flatMap((to, i) => {
        if (!to.navigate) return [to.position];

        const from = route.places[i - 1];
        if (!from) return [to.position];

        const shape = directions[key(from, to)];
        if (!shape) return [to.position];

        return decode(shape, 6).map(([lat, lon]): [number, number] => [lon, lat]);
      });
    });
  });

  const api = new RoutingApi();
  $effect(() => {
    for (const route of routes) {
      let [a, ...rest] = route.places;
      for (const b of rest) {
        if (!b.navigate) continue;

        const id = key(a, b);
        if (directions[id]) continue;

        api
          .route({
            routeRequest: {
              locations: [
                { lon: a.position[0], lat: a.position[1], type: "break" },
                { lon: b.position[0], lat: b.position[1], type: "break" }
              ],
              costing: "auto"
            }
          })
          .then(res => {
            directions[id] = res.trip.legs[0].shape;
          });

        a = b;
      }
    }
  });
</script>

<div class="wrapper">
  <div class="tools">
    <Tooltip delay={500} placement="left">
      {#snippet content()}
        {focused ? "Disable" : "Enable"} focus mode
      {/snippet}
      <Toggle border bind:checked={focused} label="focus">
        <Icon name="focus" />
      </Toggle>
    </Tooltip>
    <Tooltip delay={500} placement="left">
      {#snippet content()}
        Center map
      {/snippet}
      <Button
        square
        border
        onclick={() => {
          if (!bounds) return;
          map?.map.fitBounds(bounds.json);
        }}
      >
        <Icon name="compass" />
      </Button>
    </Tooltip>
  </div>

  {#if ready}
    <map-libre class:ready bind:this={map}>
      <maplibre-options diff style-url="https://tiles.stadiamaps.com/styles/outdoors.json" zoom={7}>
        {#if places.length}
          <maplibre-bounds slot="bounds" bind:this={bounds}>
            {#each places as place}
              <maplibre-position slot="positions" lon={place.position[0]} lat={place.position[1]}>
              </maplibre-position>
            {/each}
          </maplibre-bounds>
        {:else}
          <maplibre-position slot="center" lat={40} lon={-74.5}></maplibre-position>
        {/if}
      </maplibre-options>

      <!-- pin image -->
      <img hidden id="pin" src="/pin.svg" alt="" width="64" height="64" />

      <!-- lines -->
      <maplibre-layer diff id="lines" type="line" source="routes">
        <maplibre-layer-layout-line slot="layout" line-cap="round" line-join="round">
        </maplibre-layer-layout-line>
        <maplibre-layer-paint-line slot="paint" line-color="#5c7cfa" line-width="4">
        </maplibre-layer-paint-line>
      </maplibre-layer>

      <!-- labels -->
      <maplibre-layer diff id="labels" type="symbol" source="places">
        <maplibre-layer-layout-symbol
          slot="layout"
          text-field={`["get", "name"]`}
          text-font={`["Stadia Regular"]`}
          text-offset={`[0, 0.5]`}
          text-size={12}
          text-anchor="top"
        >
        </maplibre-layer-layout-symbol>
        <maplibre-layer-paint-symbol slot="paint" text-halo-color="#ffffff" text-halo-width={2}>
        </maplibre-layer-paint-symbol>
      </maplibre-layer>

      <!-- markers -->
      <maplibre-layer diff id="markers" type="symbol" source="places">
        <maplibre-layer-layout-symbol
          slot="layout"
          icon-image="pin"
          icon-size={0.5}
          icon-anchor="bottom"
          icon-allow-overlap="true"
        >
        </maplibre-layer-layout-symbol>
      </maplibre-layer>

      <!-- places -->
      <maplibre-source id="places" type="geojson">
        <geojson-featurecollection slot="data">
          {#each places as place}
            <geojson-feature slot="features">
              <geojson-point slot="geometry">
                <geojson-coordinate
                  slot="coordinates"
                  lon={place.position[0]}
                  lat={place.position[1]}
                >
                </geojson-coordinate>
              </geojson-point>
              <geojson-properties slot="properties" name={place.name}> </geojson-properties>
            </geojson-feature>
          {/each}
        </geojson-featurecollection>
      </maplibre-source>

      <!-- routes -->
      <maplibre-source id="routes" type="geojson">
        <geojson-featurecollection slot="data">
          {#each lines as points}
            <geojson-feature slot="features">
              <geojson-linestring slot="geometry">
                {#each points as [lon, lat]}
                  <geojson-coordinate slot="coordinates" {lon} {lat}> </geojson-coordinate>
                {/each}
              </geojson-linestring>
            </geojson-feature>
          {/each}
        </geojson-featurecollection>
      </maplibre-source>
    </map-libre>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    isolation: isolate;
  }

  map-libre {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease;
    border-radius: 6px;
    overflow: hidden;
  }

  map-libre::after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    box-shadow: inset 0 0 0 1px #00000011;
    border-radius: inherit;
    pointer-events: none;
  }

  map-libre.ready {
    opacity: 1;
  }

  .tools {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
  }
</style>
