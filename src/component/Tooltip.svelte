<script lang="ts">
  import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
  import type { Snippet } from "svelte";

  interface Props {
    content: Snippet;
    children: Snippet;
    delay?: number;
    placement?: "top" | "right" | "bottom" | "left";
  }

  const { content, children, delay = 0, placement = "top" } = $props<Props>();
</script>

<sl-tooltip hoist style:--show-delay="{delay}ms" {placement}>
  <div slot="content">{@render content()}</div>
  {@render children()}
</sl-tooltip>

<style>
  sl-tooltip::part(base__popup) {
    padding: 4px 8px;
    font-size: 0.75rem;
    background-color: #000000;
    color: #ffffff;
    border-radius: 6px;
  }

  sl-tooltip::part(base__arrow) {
    --arrow-size-diagonal: 3px;
    background-color: #000000;
  }
</style>
