<script lang="ts">
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline/Outline.svelte";
  import { type BoundingBox, type Place } from "~/lib/place";

  let bounds = $state<BoundingBox>([
    [0, 0],
    [0, 0]
  ]);

  let document = $state<unknown>({});
  function getPlaces(node: any): Place[] {
    if (node.type === "mention") return node.attrs.data;
    return (node.content || []).flatMap((node: any) => getPlaces(node));
  }

  let places = $derived(getPlaces(document));
</script>

<div class="wrapper">
  <div class="data">
    <Outline {bounds} bind:document />
  </div>
  <Map {places} bind:bounds />
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
