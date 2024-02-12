<script lang="ts">
  import * as Y from "yjs";
  import { IndexeddbPersistence } from "y-indexeddb";
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline.svelte";
  import Icon from "~/component/Icon.svelte";
  import { type Place, type Route } from "~/lib/place";
  import Toggle from "~/component/Toggle.svelte";
  import Button from "~/component/Button.svelte";

  const ydoc = new Y.Doc();
  const fragment = ydoc.getXmlFragment("outline");
  new IndexeddbPersistence("y-indexeddb", ydoc);

  let doc = $state(fragment.toDOM());
  ydoc.on("update", () => (doc = fragment.toDOM()));

  let places = $derived(doc instanceof DocumentFragment ? getPlaces(doc) : []);
  let routes = $derived(getRoutes(doc));

  function getPlaces(root: DocumentFragment | Element): Place[] {
    const places: Place[] = [];

    for (const el of root.querySelectorAll("place")) {
      const name = el.getAttribute("name");
      const lon = Number(el.getAttribute("lon"));
      const lat = Number(el.getAttribute("lat"));

      if (!name || Number.isNaN(lon) || Number.isNaN(lat)) continue;
      places.push({ type: "place", name, position: [lon, lat] });
    }

    return places;
  }

  function getRoutes(root: Node): Route[] {
    if (root instanceof Element && root.tagName === "ROUTE") {
    }

    for (const child of root.childNodes) {
      getRoutes(child);
    }

    return [];
  }

  // let doc = $state<any>({});
  let focused = $state(false);
  let outline = $state<Outline>();
</script>

<svelte:head>
  <title>travel</title>
</svelte:head>

<div class="wrapper">
  <div class="data">
    <div class="toolbar">
      <Button
        onclick={() => {
          // const filename = prompt("Enter a filename");
          // if (!filename) return;
          // const a = document.createElement("a");
          // const file = new Blob([JSON.stringify(doc)], { type: "application/json" });
          // a.href = URL.createObjectURL(file);
          // a.download = `${filename}.json`;
          // a.click();
        }}
      >
        <Icon name="save" />
        <span class="label">Save</span>
      </Button>
      <Button
        onclick={() => {
          // const input = document.createElement("input");
          // input.type = "file";
          // input.onchange = async () => {
          //   const file = input.files?.[0];
          //   if (!file) return;
          //   const json = await file.text();
          //   const doc = JSON.parse(json);
          //   outline?.load(doc);
          // };
          // input.click();
        }}
      >
        <Icon name="open" />
        <span class="label">Open</span>
      </Button>
      <div class="right">
        <Toggle bind:checked={focused} label="focus">
          <Icon name="focus" />
        </Toggle>
      </div>
    </div>
    <Outline bind:this={outline} document={fragment} bind:focused />
  </div>
  <Map {places} {routes} />
</div>

<style>
  .wrapper {
    display: grid;
    grid-template:
      "data view" 1fr
      / 1fr 1fr;
    height: 100%;
    overflow: hidden;
  }

  .data {
    display: grid;
    grid-template:
      "toolbar" auto
      "outline" 1fr;
    height: 100%;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    padding: 8px;
    box-shadow: 0 1px 0 #00000011;
    column-gap: 4px;
  }

  .label {
    translate: 0 0.1em;
  }

  .right {
    margin-left: auto;
  }
</style>
