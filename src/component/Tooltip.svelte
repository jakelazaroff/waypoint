<script lang="ts">
  import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
  import type { Snippet } from "svelte";

  interface Props {
    content: Snippet;
    children: Snippet;
    delay?: number;
  }

  const { content, children, delay = 0 } = $props<Props>();
</script>

<sl-tooltip hoist style:--show-delay="{delay}ms">
  <div slot="content">{@render content()}</div>
  {@render children()}
</sl-tooltip>

<style>
  sl-tooltip::part(base__popup) {
    padding: 2px 6px;
    font-size: 0.75rem;
    background-color: #000000;
    color: #ffffff;
    border-radius: 4px;
  }

  sl-tooltip::part(base__arrow) {
    --arrow-size-diagonal: 3px;
    background-color: #000000;
  }
</style>
