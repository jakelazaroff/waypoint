<script lang="ts">
  import { onMount } from "svelte";
  import "./geojson.js";
  import { register, type MapLibre, type MapLibreBounds } from "./maplibre.js";

  let ready = $state(false);
  onMount(async () => {
    await register();
    ready = true;
  });

  import { type Place, type Route } from "~/lib/place";
  import Icon from "~/component/Icon.svelte";
  import Button from "~/component/Button.svelte";

  let { places, routes } = $props<{ places: Place[]; routes: Route[] }>();
  let map = $state<MapLibre>();
  let bounds = $state<MapLibreBounds>();
</script>

<div class="wrapper">
  <div class="tools">
    <Button
      onclick={() => {
        if (!bounds) return;
        map?.map.fitBounds(bounds.json);
      }}
    >
      <Icon name="pins" />
    </Button>
  </div>

  {#if ready}
    <map-libre bind:this={map}>
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
          {#each routes as route}
            <geojson-feature slot="features">
              <geojson-linestring slot="geometry">
                {#each route.places as place}
                  <geojson-coordinate
                    slot="coordinates"
                    lon={place.position[0]}
                    lat={place.position[1]}
                  >
                  </geojson-coordinate>
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
