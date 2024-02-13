<script lang="ts">
  import { type PeliasGeoJSONFeature } from "@stadiamaps/api";
  import type { Place } from "~/lib/place";

  import Loader from "~/component/Loader.svelte";

  interface Props {
    id: string;
    labelledBy: string;
    query: string;
    results: PeliasGeoJSONFeature[];
    highlighted: number;
    onselect(index: number): void;
  }

  const { id, labelledBy, query, results, highlighted, onselect } = $props<Props>();
  const min = 3;
  let left = $derived(min - query.length);
</script>

<div class="menu">
  {#if results.length > 0}
    <ul
      role="listbox"
      {id}
      tabindex={-1}
      aria-labelledby={labelledBy}
      aria-activedescendant={results[highlighted]?.properties?.id}
    >
      {#each results as result, i}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
          role="option"
          id={result.properties?.id}
          class="result"
          aria-selected={highlighted === i}
          tabindex={-1}
          on:click={() => onselect(i)}
        >
          <span class="name truncate">{result.properties?.name}</span>
          <span class="blurb truncate">{result.properties?.label}</span>
        </li>
      {/each}
    </ul>
  {:else if left > 0}
    <p class="prompt">
      Type {left}
      {#if left < min}
        more
      {/if}
      character{#if left !== 1}s{/if} to search for places
    </p>
  {:else}
    <span class="loader"><Loader /></span>
  {/if}
</div>

<style>
  .menu {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    border-top-left-radius: 0;
    overflow: hidden;
    width: 20rem;
    background-color: white;
    box-shadow: 0 8px 12px #00000018;
  }

  .menu::after {
    content: "";
    display: block;
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 1px #00000022;
    border-radius: inherit;
    pointer-events: none;
  }

  .result {
    display: grid;
    grid-template-rows: auto auto;
    text-align: left;
    gap: 0.25rem;
    padding: 8px;
    cursor: default;
  }

  .result:hover {
    background-color: #eeeeee;
  }

  .result[aria-selected="true"] {
    background-color: #5c7cfa;
    color: white;
  }

  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name {
    font-weight: bold;
    line-height: 1;
  }

  .blurb {
    font-size: 0.75rem;
    line-height: 1;
    opacity: 0.6;
  }

  .prompt {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.75rem;
    padding: 8px;
    text-align: center;
    height: calc(2rem + 8px * 2);
  }

  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
    height: calc(2rem + 8px * 2);
  }
</style>
