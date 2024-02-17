<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    square?: boolean;
    onclick?(evt: MouseEvent & { currentTarget: HTMLButtonElement }): void;
  }
  const { children, square, onclick } = $props<Props>();
</script>

<button class:square {onclick}>{@render children()}</button>

<style>
  button {
    --background-mix: 0%;
    display: inline-grid;
    grid-auto-flow: column;
    gap: 6px;
    align-items: center;
    border: 0;
    background-color: color-mix(in srgb, currentColor var(--background-mix), #ffffff);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 0.75rem;
    line-height: 1;
    transition:
      color 0.25s ease,
      background-color 0.25s ease;
  }

  button.square {
    padding: 6px 6px;
  }

  button:hover {
    --background-mix: 20%;
    color: var(--color-primary);
  }

  button:active {
    --background-mix: 40%;
    color: var(--color-primary);
  }
</style>
