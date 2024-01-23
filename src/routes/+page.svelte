<script lang="ts">
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline/Outline.svelte";
  import { type Coordinate, type Place } from "~/lib/place";
  import { onMount } from "svelte";

  let center = $state<Coordinate>([0, 0]);

  let document = $state<any>({});
  let outline = $state<Outline>();
  onMount(() => {
    const json = localStorage.getItem("travel");
    if (!json) return;

    const doc = JSON.parse(json);
    outline?.load(doc);
  });

  $effect(() => {
    localStorage.setItem("travel", JSON.stringify(document));
  });

  function getPlaces(node: any): Place[] {
    if (node?.type === "mention") return node.attrs.data;
    return (node?.content || []).flatMap((node: any) => getPlaces(node));
  }

  let places = $derived(getPlaces(document));
</script>

<div class="wrapper">
  <div class="data">
    <Outline {center} bind:this={outline} bind:document />
  </div>
  <Map {places} bind:center />
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
    display: grid;
    overflow: hidden;
  }
</style>
