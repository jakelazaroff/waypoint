<script lang="ts">
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Search from "~/component/Search.svelte";
  import Outline from "~/component/Outline.svelte";
  import type { Place } from "~/lib/place";

  let places = $state<Place[]>([]);
</script>

<div class="wrapper">
  <div class="data">
    <!-- <Search
      onretrieve={place => {
        console.log(place);
        places = [...places, place];
      }}
    />
    <ul>
      {#each places as place}
        <li>{place.name}</li>
      {/each}
    </ul> -->
    <Outline />
  </div>
  <Map {places} />
</div>

<style>
  .wrapper {
    display: grid;
    grid-template:
      "data view" 1fr
      / 1fr 1fr;
    height: 100%;
  }

  .data {
    padding: 1rem;
    display: grid;
  }
</style>
