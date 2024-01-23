<script lang="ts">
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline/Outline.svelte";
  import { type Coordinate, type Place } from "~/lib/place";
  import { onMount } from "svelte";

  let center = $state<Coordinate>([0, 0]);

  let doc = $state<any>({});
  let focus = $state<any>(undefined);
  let focused = $state(true);
  let outline = $state<Outline>();
  onMount(() => {
    const json = localStorage.getItem("travel");
    if (!json) return;

    const doc = JSON.parse(json);
    outline?.load(doc);
  });

  $effect(() => {
    localStorage.setItem("travel", JSON.stringify(doc));
  });

  function getPlaces(node: any): Place[] {
    if (node?.type === "mention") return node.attrs.data;
    return (node?.content || []).flatMap((node: any) => getPlaces(node));
  }

  let places = $derived(getPlaces((focused && focus) || doc));
</script>

<div class="wrapper">
  <div class="data">
    <div class="toolbar">
      <button
        onclick={() => {
          const filename = prompt("enter a filename");
          if (!filename) return;

          const a = document.createElement("a");
          const file = new Blob([JSON.stringify(doc)], { type: "application/json" });
          a.href = URL.createObjectURL(file);
          a.download = `${filename}.json`;
          a.click();
        }}
      >
        save
      </button>
      <input
        type="file"
        onchange={async e => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;
          const json = await file.text();
          const doc = JSON.parse(json);
          outline?.load(doc);
          e.currentTarget.value = "";
        }}
      />
      <label>focus <input type="checkbox" bind:checked={focused} /></label>
    </div>
    <Outline {center} bind:this={outline} bind:document={doc} bind:focus />
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
    grid-template:
      "toolbar" auto
      "outline" 1fr;
    overflow: hidden;
  }
</style>
