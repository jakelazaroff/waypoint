<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    checked: boolean;
    children: Snippet;
  }

  let { children, label, checked } = $props<Props>();
</script>

<button aria-pressed={checked} onclick={() => (checked = !checked)} aria-label={label}>
  {@render children()}
</button>

<style>
  button {
    --background-mix: 0%;
    display: grid;
    appearance: none;
    border: 0;
    background-color: color-mix(in srgb, currentColor var(--background-mix), #ffffff);
    padding: 6px;
    border-radius: 8px;
    transition:
      color 0.25s ease,
      background-color 0.25s ease;
  }

  button:hover,
  button[aria-pressed="true"] {
    --background-mix: 20%;
    color: var(--color-primary);
  }

  button:active,
  button[aria-pressed="true"]:hover {
    --background-mix: 40%;
  }

  button[aria-pressed="true"]:active {
    --background-mix: 20%;
  }
</style>
