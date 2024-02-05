<script lang="ts">
  import { GeocodingApi, type PeliasGeoJSONFeature } from "@stadiamaps/api";
  import type { Coordinate, Place } from "~/lib/place";

  interface Props {
    query: string;
    onselect(place: Place): void;
    center?: Coordinate;
  }

  interface Suggestion {
    lat: string;
    lon: string;
    name: string;
    display_name: string;
  }

  const { query, center, onselect } = $props<Props>();

  const api = new GeocodingApi();
  let suggestions = $state<PeliasGeoJSONFeature[]>([]);
  $inspect(suggestions);

  $effect(() => {
    api.autocomplete({ text: query }).then(res => {
      suggestions = res.features;
    });
  });
</script>

<ul>
  {#each suggestions as suggestion}
    <li class="item">
      <button
        class="result"
        onclick={async () => {
          onselect({
            name: suggestion.properties?.name || "",
            position: suggestion.geometry.coordinates as [number, number]
          });
        }}
      >
        <span class="name">{suggestion.properties?.name}</span>
        <span class="blurb">{suggestion.properties?.label}</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  ul {
    display: flex;
    flex-direction: column;
    border: 1px solid black;
  }

  .item {
    display: grid;
  }

  .result {
    display: grid;
    grid-template-rows: auto auto;
    text-align: left;
  }

  .name {
    font-weight: bold;
  }
</style>
