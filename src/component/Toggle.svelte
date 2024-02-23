<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    border?: boolean;
    checked: boolean;
    children: Snippet;
    onchange?(checked: boolean): void;
  }

  let { children, label, border, checked, onchange = () => {} } = $props<Props>();
</script>

<button
  class:border
  aria-pressed={checked}
  onclick={() => {
    checked = !checked;
    onchange(checked);
  }}
  aria-label={label}
>
  {@render children()}
</button>

<style>
  button {
    --background-mix: 0%;
    --border-mix: 10%;
    display: grid;
    appearance: none;
    border: 0;
    background-color: color-mix(in srgb, currentColor var(--background-mix), #ffffff);
    padding: 6px;
    border-radius: 8px;
    transition:
      color 0.25s ease,
      background-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  button.border {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor var(--border-mix), transparent);
  }

  button:hover,
  button[aria-pressed="true"] {
    --background-mix: 20%;
    --border-mix: 20%;
    color: var(--color-primary);
  }

  button:active,
  button[aria-pressed="true"]:hover {
    --background-mix: 40%;
    --border-mix: 40%;
  }

  button[aria-pressed="true"]:active {
    --background-mix: 20%;
    --border-mix: 20%;
  }
</style>
