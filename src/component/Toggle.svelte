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
    display: grid;
    appearance: none;
    border: 0;
    background-color: #ffffff;
    padding: 6px;
    border-radius: 8px;
    transition: background-color 0.25s ease;
  }

  button:hover,
  button[aria-pressed="true"] {
    background-color: #dddddd;
  }

  button:active,
  button[aria-pressed="true"]:hover {
    background-color: #bbbbbb;
  }

  button[aria-pressed="true"]:active {
    background-color: #dddddd;
  }
</style>
