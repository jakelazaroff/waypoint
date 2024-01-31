<script lang="ts">
  import "~/style/style.css";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline/Outline.svelte";
  import Icon from "~/component/Icon.svelte";
  import { type Place, type Route } from "~/lib/place";
  import { onMount } from "svelte";
  import Toggle from "~/component/Toggle.svelte";
  import Button from "~/component/Button.svelte";

  let doc = $state<any>({});
  let focus = $state<any>(undefined);
  let focused = $state(false);
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

  function getPlaces(node: any): Array<Route | Place> {
    if (node?.type === "tag") return [node.attrs.data];
    const content = (node?.content || []).flatMap((node: any) => getPlaces(node));

    if (node?.type === "route") return [content];
    return content;
  }

  let places = $derived(getPlaces((focused && focus) || doc));
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
          const file = new Blob([JSON.stringify(doc)], { type: "application/json" });
          a.href = URL.createObjectURL(file);
          a.download = `${filename}.json`;
          a.click();
        }}
      >
        <Icon name="save" />
        <span class="label">Save</span>
      </Button>
      <Button
        onclick={() => {
          const input = document.createElement("input");
          input.type = "file";

          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const json = await file.text();
            const doc = JSON.parse(json);
            outline?.load(doc);
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
    <Outline bind:this={outline} bind:document={doc} bind:focus bind:focused />
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
    display: grid;
    grid-template:
      "toolbar" auto
      "outline" 1fr;
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
