<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    square?: boolean;
    border?: boolean;
    onclick?(evt: MouseEvent & { currentTarget: HTMLButtonElement }): void;
  }
  const { children, square, border, onclick } = $props<Props>();
</script>

<button class:square class:border {onclick}>{@render children()}</button>

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
      background-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  button.border {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 10%, transparent);
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
