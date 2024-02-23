<script lang="ts">
  import Modal from "./Modal.svelte";
  import Icon from "./Icon.svelte";

  let { modal } = $props<{ modal?: Modal }>();

  const isMac = navigator.platform.startsWith("Mac") || navigator.platform === "iPhone";
  const mod = isMac ? "⌘ " : "Ctrl-";
</script>

<Modal bind:this={modal} title="Help" --max-width="65ch">
  <p>Waypoint is an app for planning trips.</p>
  <p>
    You can mostly use it in the same way you use Google Docs or Microsoft Word. <code>-</code> or
    <code>*</code>
    at the beginning of a line start a bulleted list, and <code>1.</code> at the beginning of a line
    starts a numbered list.
  </p>
  <p>There are a couple features specifically for trip planning:</p>
  <ul>
    <li>Type <code>@</code> to add a place to the map on the right.</li>
    <li>
      Type <code>~</code> at the start of the line to make a route list, which draws lines on the map
      between all places inside it.
    </li>
    <li>
      Click <span class="icon"><Icon name="focus" /></span> to enter focus mode, which only shows locations
      in the same block as your cursor.
    </li>
  </ul>
  <p>
    If you share the URL with someone, they'll be able to collaborate with you. Careful — there's no
    authentication!
  </p>
  <p><strong>Keyboard shortcuts:</strong></p>
  <ul>
    <li><code><span class:mac={isMac}>{mod}</span>B</code> toggles bold text</li>
    <li><code><span class:mac={isMac}>{mod}</span>I</code> toggles italicized text</li>
    <li><code><span class:mac={isMac}>{mod}</span>D</code> toggles focus mode</li>
  </ul>
</Modal>

<style>
  code {
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 700;
    background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
    color: var(--color-primary);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  .mac {
    font-family: system-ui;
    font-size: 0.75em;
  }

  ul {
    list-style: disc;
  }

  li {
    margin-left: 1.5em;
  }
</style>
