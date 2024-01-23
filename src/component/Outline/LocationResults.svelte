<script lang="ts">
  import { SearchBoxCore, SessionToken, type SearchBoxSuggestion } from "@mapbox/search-js-core";

  import { PUBLIC_MAPBOX_TOKEN } from "$env/static/public";
  import type { Coordinate, Place } from "~/lib/place";

  interface Props {
    query: string;
    onselect(place: Place): void;
    center?: Coordinate;
  }

  const { query, center, onselect } = $props<Props>();

  const search = new SearchBoxCore({ accessToken: PUBLIC_MAPBOX_TOKEN });
  const sessionToken = new SessionToken();
  let suggestions = $state<SearchBoxSuggestion[]>([]);

  $effect(() => {
    search.suggest(query, { sessionToken, limit: 10, proximity: center }).then(res => {
      suggestions = res.suggestions;
    });
  });
</script>

<ul>
  {#each suggestions as suggestion}
    <li class="item">
      <button
        class="result"
        onclick={async () => {
          const result = await search.retrieve(suggestion, { sessionToken });
          const [feature] = result.features;
          onselect({
            name: feature.properties.name_preferred || feature.properties.name,
            mapboxId: feature.properties.mapbox_id,
            position: [
              feature.properties.coordinates.longitude,
              feature.properties.coordinates.latitude
            ]
          });
        }}
      >
        <span class="name">{suggestion.name_preferred || suggestion.name}</span>
        <span class="blurb">{suggestion.place_formatted}</span>
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
