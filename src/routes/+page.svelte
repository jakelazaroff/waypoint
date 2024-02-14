<script lang="ts">
  import type { RelativePosition } from "yjs";
  import { IndexeddbPersistence } from "y-indexeddb";
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline.svelte";
  import Icon from "~/component/Icon.svelte";
  import Toggle from "~/component/Toggle.svelte";
  import Button from "~/component/Button.svelte";
  import Doc from "~/lib/doc.svelte";
  import { download, open } from "~/lib/file";

  let doc = $state(new Doc());
  let cursor = $state<RelativePosition>();
  let focused = $state(false);

  let places = $derived(doc.places(focused ? cursor : undefined));
  let routes = $derived(doc.routes(focused ? cursor : undefined));

  $effect(() => {
    // console.log(ydoc.guid, localStorage.getItem("last_opened"));
    // // persist doc to indexeddb
    // new IndexeddbPersistence(localStorage.getItem("last_opened") || ydoc.guid, ydoc);
    // localStorage.setItem("last_opened", ydoc.guid);
    // ydoc.on("update", () => {
    //   outline = undefined;
    //   outline = ydoc.getXmlFragment("outline");
    //   // for (const place of outline.querySelectorAll("place")) {
    //   //   if (!(place instanceof Y.XmlElement)) continue;
    //   //   console.log(
    //   //     place.getAttribute("name"),
    //   //     place.getAttribute("lon"),
    //   //     place.getAttribute("lat")
    //   //   );
    //   // }
    // });
    // return () => ydoc.destroy();
  });
</script>

<svelte:head>
  <title>travel</title>
</svelte:head>

<div class="wrapper">
  <div class="data">
    <div class="toolbar">
      <Button
        onclick={() => {
          const name = prompt("Enter a file name");
          if (!name) return;

          const file = doc.serialize(`${name}.travel`);
          download(file);
        }}
      >
        <Icon name="save" />
        <span class="label">Save</span>
      </Button>
      <Button
        onclick={async () => {
          const [file] = await open();
          const state = new Uint8Array(await file.arrayBuffer());
          doc = Doc.parse(state);
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
    <Outline document={doc.outline} bind:focused onmovecursor={pos => void (cursor = pos)} />
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
