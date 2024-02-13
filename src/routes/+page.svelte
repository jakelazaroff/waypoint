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

  let ydoc = $state(new Y.Doc());
  let db: IndexeddbPersistence;
  let fragment = $derived(ydoc.getXmlFragment("outline"));

  // svelte-ignore static-state-reference
  let doc = $state(fragment.toDOM());
  let places = $derived(getPlaces(doc as DocumentFragment));
  let routes = $derived(getRoutes(doc as DocumentFragment));

  $effect(() => {
    db = new IndexeddbPersistence("travel", ydoc);
    const update = () => (doc = fragment.toDOM() as DocumentFragment);
    update();

    ydoc.on("update", update);
    return () => ydoc.off("update", update);
  });

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

  function getRoutes(root: DocumentFragment | Element): Route[] {
    const results: Route[] = [];
    const routes = root.querySelectorAll("route");

    for (const route of routes) {
      const result: Route = { type: "route", places: [] };
      results.push(result);

      const places = route.querySelectorAll("place");

      for (const place of places) {
        let current = place.parentElement;

        while (current !== route.parentElement && current !== null) {
          if (new Set(["ROUTE", "ORDERED_LIST", "BULLET_LIST"]).has(current.tagName)) break;
          current = current.parentElement;
        }

        if (current !== route) continue;

        const name = place.getAttribute("name");
        const lon = Number(place.getAttribute("lon"));
        const lat = Number(place.getAttribute("lat"));

        if (!name || Number.isNaN(lon) || Number.isNaN(lat)) continue;
        result.places.push({ type: "place", name, position: [lon, lat] });
      }
    }

    return results;
  }

  let focused = $state(false);
</script>

<svelte:head>
  <title>travel</title>
</svelte:head>

<div class="wrapper">
  <div class="data">
    <div class="toolbar">
      <Button
        onclick={() => {
          const filename = prompt("Enter a filename");
          if (!filename) return;
          const a = document.createElement("a");
          const file = new Blob([Y.encodeStateAsUpdate(ydoc)]);
          a.href = URL.createObjectURL(file);
          a.download = `${filename}.travel`;
          a.click();
        }}
      >
        <Icon name="save" />
        <span class="label">Save</span>
      </Button>
      <Button
        onclick={async () => {
          const input = document.createElement("input");
          input.type = "file";
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const state = await file.arrayBuffer();

            ydoc.destroy();

            // create new document
            ydoc = new Y.Doc();
            Y.applyUpdate(ydoc, new Uint8Array(state));
          };
          input.click();
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
    <Outline document={fragment} bind:focused />
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
