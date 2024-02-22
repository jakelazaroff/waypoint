<script lang="ts">
  import Modal from "./Modal.svelte";
  import Icon from "./Icon.svelte";

  let { modal } = $props<{ modal?: Modal }>();

  const isMac = navigator.platform.startsWith("Mac") || navigator.platform === "iPhone";
  const mod = isMac ? "⌘ " : "Ctrl-";
</script>

<Modal bind:this={modal} title="Help">
  <p>travel is a rich text editor with extra capabilities for planning trips</p>
  <p>
    <code><span class:mac={isMac}>{mod}</span>B</code> is bold.
    <code><span class:mac={isMac}>{mod}</span>I</code>
    is italic.
    <code>-</code>
    at the beginning of a line starts a bulleted list and <code>1.</code> at the beginning of the a starts
    a numbered list
  </p>
  <p>type <code>@</code> to search for places to plot on the map</p>
  <p>
    type <code>~</code> at the start of the line to create a route list, which draws lines between all
    places inside it
  </p>
  <p>
    <code><span class:mac={isMac}>{mod}</span>D</code> or
    <span class="icon"><Icon name="focus" /></span> enters focus mode, which only shows locations in
    the same block as your cursor.
  </p>
</Modal>

<style>
  code {
    padding: 4px;
    border-radius: 4px;
    font-weight: 700;
    background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
    color: var(--color-primary);
  }

  .icon {
    display: inline-flex;
    vertical-align: middle;
  }

  .mac {
    font-family: system-ui;
    font-size: 0.75em;
  }
</style>
