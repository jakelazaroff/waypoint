<script lang="ts">
  import "~/style/style.css";
  import Avatar from "~/component/Avatar.svelte";
  import Map from "~/component/Map.svelte";
  import Outline from "~/component/Outline.svelte";
  import Icon from "~/component/Icon.svelte";
  import Button from "~/component/Button.svelte";
  import Doc from "~/lib/doc.svelte";
  import Collab, { randomUsername, randomColor } from "~/lib/collab.svelte";
  import { download, open } from "~/lib/file";
  import Tooltip from "~/component/Tooltip.svelte";
  import Input from "~/component/Input.svelte";
  import HelpModal from "~/component/HelpModal.svelte";
  import type Modal from "~/component/Modal.svelte";

  let { data } = $props();

  let doc = $derived(Doc.create(data.docId));
  let collab = $derived(
    new Collab(data.url, doc, {
      name: randomUsername(),
      color: randomColor()
    })
  );

  let focused = $state(false);

  let places = $derived(doc.places(focused ? collab.local.cursor?.head : undefined));
  let routes = $derived(doc.routes(focused ? collab.local.cursor?.head : undefined));
  let help = $state<Modal>();
</script>

<svelte:head>
  <title>{doc.title || "Untitled"} | Waypoint</title>
</svelte:head>

<div class="wrapper">
  <div class="toolbar">
    <div class="group">
      <h1 class="title"><Icon name="journey" /><span>Waypoint</span></h1>
      <!-- <Button
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
          // doc = Doc.parse(state);
        }}
      >
        <Icon name="open" />
        <span class="label">Open</span>
      </Button> -->
    </div>
    <div class="group">
      <Input placeholder="Untitled" bind:value={doc.title} />
    </div>
    <div class="group">
      <Button onclick={() => help?.show()}>
        <Icon name="help" />
        <span>Help</span>
      </Button>

      <ul class="avatars">
        {#each [...collab.peers, collab.local] as peer}
          <li class="avatar">
            <Tooltip>
              {#snippet content()}
                {peer.user.name}
                {#if peer === collab.local}(You){/if}
              {/snippet}
              <Avatar name={peer.user.name} color={peer.user.color} size={20} />
            </Tooltip>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <Outline document={doc.outline} {collab} bind:focused />
  <div class="map">
    <Map bind:focused {places} {routes} />
  </div>
</div>
<HelpModal bind:modal={help} />

<style>
  .wrapper {
    display: grid;
    grid-template:
      "toolbar toolbar" auto
      "outline view" 1fr
      / 1fr 1fr;
    height: 100%;
    overflow: hidden;
  }

  .toolbar {
    position: relative;
    grid-area: toolbar;
    display: flex;
    justify-content: space-between;
    padding: 8px;
    column-gap: 4px;
    z-index: 1;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 1rem;
    text-transform: uppercase;
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

  .map {
    height: 100%;
    padding: 0 6px 6px;
    overflow: hidden;
  }
</style>
