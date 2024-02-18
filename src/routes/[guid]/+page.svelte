<script lang="ts">
  import "~/style/style.css";
  import Avatar from "~/component/Avatar.svelte";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline.svelte";
  import Icon from "~/component/Icon.svelte";
  import Toggle from "~/component/Toggle.svelte";
  import Button from "~/component/Button.svelte";
  import Doc from "~/lib/doc.svelte";
  import Collab, { randomUsername, randomColor } from "~/lib/collab.svelte";
  import { download, open } from "~/lib/file";
  import Tooltip from "~/component/Tooltip.svelte";
  import Input from "~/component/Input.svelte";

  let { data } = $props();

  let doc = $derived(Doc.create(data.docId));
  let collab = $derived(
    new Collab(data.url, doc, {
      name: randomUsername(),
      color: randomColor()
    })
  );

  let focused = $state(false);

  let places = $derived(doc.places(focused ? collab.local.cursor : undefined));
  let routes = $derived(doc.routes(focused ? collab.local.cursor : undefined));
</script>

<svelte:head>
  <title>{doc.title || "Untitled"} | travel</title>
</svelte:head>

<div class="wrapper">
  <div class="data">
    <div class="toolbar">
      <div class="group">
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
            // const [file] = await open();
            // const state = new Uint8Array(await file.arrayBuffer());
            // doc = Doc.parse(state);
          }}
        >
          <Icon name="open" />
          <span class="label">Open</span>
        </Button>
      </div>
      <div class="group">
        <Input placeholder="Untitled" bind:value={doc.title} />
      </div>
      <div class="group">
        <Tooltip delay={500}>
          {#snippet content()}
            {focused ? "Disable" : "Enable"} focus mode
          {/snippet}
          <Toggle bind:checked={focused} label="focus">
            <Icon name="focus" />
          </Toggle>
        </Tooltip>
        <ul class="avatars">
          {#each [...collab.peers, collab.local] as peer}
            <li class="avatar">
              <Tooltip>
                {#snippet content()}
                  {peer.user.name}
                {/snippet}
                <Avatar name={peer.user.name} color={peer.user.color} size={20} />
              </Tooltip>
            </li>
          {/each}
        </ul>
      </div>
    </div>
    <Outline document={doc.outline} {collab} bind:focused />
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
    position: relative;
    z-index: 1;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    box-shadow: 0 1px 0 #00000011;
    column-gap: 4px;
  }

  .label {
    translate: 0 0.1em;
  }

  .group {
    display: flex;
    align-items: center;
    column-gap: 4px;
  }

  .avatars {
    display: flex;
    column-gap: 4px;
  }

  .avatar:not(:last-child) {
    margin-right: -12px;
    transition: margin 0.125s ease-in-out;
  }

  .avatars:hover .avatar {
    margin: 0;
  }
</style>
