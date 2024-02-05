<script lang="ts">
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

  let suggestions = $state<Suggestion[]>([]);

  let controller: AbortController | undefined;
  $effect(() => {
    if (query.length <= 2) return;

    if (controller) controller.abort();
    controller = new AbortController();
    fetch(`/nominatim/search?q=${query}&format=jsonv2`, { signal: controller.signal })
      .then(res => {
        controller = undefined;
        return res.json();
      })
      .then(res => {
        suggestions = res;
      })
      .catch(() => console.log("aborted query " + query));
  });
</script>

<ul>
  {#each suggestions as suggestion}
    <li class="item">
      <button
        class="result"
        onclick={async () => {
          onselect({
            name: suggestion.name,
            position: [Number(suggestion.lon), Number(suggestion.lat)]
          });
        }}
      >
        <span class="name">{suggestion.name}</span>
        <span class="blurb">{suggestion.display_name}</span>
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
