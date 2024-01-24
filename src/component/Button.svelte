<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    onclick?(evt: MouseEvent & { currentTarget: HTMLButtonElement }): void;
  }
  const { children, onclick } = $props<Props>();
</script>

<button {onclick}>{@render children()}</button>

<style>
  button {
    display: inline-grid;
    grid-auto-flow: column;
    gap: 6px;
    align-items: center;
    border: 0;
    background-color: #ffffff;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 0.75rem;
    line-height: 1;
    transition: background-color 0.25s ease;
  }

  button:hover {
    background-color: #dddddd;
  }

  button:active {
    background-color: #bbbbbb;
  }
</style>
