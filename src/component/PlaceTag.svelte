<script lang="ts">
  import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";

  interface Props {
    name: string;
    navigate: boolean;
    onchange(attr: string, value: any): void;
  }

  let { name, navigate, onchange } = $props<Props>();
  let open = $state(false);
</script>

<button
  class="tag"
  onclick={() => {
    open = !open;
  }}
>
  @{name}
</button>{#if open}
  <div class="content">
    <label>
      <input
        type="checkbox"
        checked={navigate}
        onchange={e => onchange("navigate", e.currentTarget.checked)}
      />
      <span>Navigate</span>
    </label>
  </div>
{/if}

<style>
  place-tag {
    display: block;
  }

  .tag {
    display: inline-block;
    border: 0;
    background-color: transparent;
    color: var(--color-primary);
    font-weight: bold;
  }

  .content {
    display: block;
    position: absolute;
    border-radius: 8px;
    border-top-left-radius: 0;
    overflow: hidden;
    width: 20rem;
    background-color: white;
    box-shadow: 0 8px 12px #00000018;
    z-index: 100;
    padding: 8px;
  }

  .content::after {
    content: "";
    display: block;
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 1px #00000022;
    border-radius: inherit;
    pointer-events: none;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
