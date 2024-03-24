<script lang="ts">
  import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";

  interface Props {
    name: string;
    navigate?: "auto";
    onchange(attr: string, value: any): void;
  }

  let { name, navigate, onchange } = $props<Props>();
</script>

<sl-dropdown hoist stay-open-on-select>
  <button class="tag" slot="trigger">
    @{name}
  </button>
  <div class="content">
    <label>
      <input
        type="checkbox"
        checked={!!navigate}
        onchange={e => onchange("navigate", e.currentTarget.checked ? "auto" : null)}
      />
      <span>Navigate</span>
    </label>
  </div>
</sl-dropdown>

<style>
  sl-dropdown {
    white-space: normal;
  }

  .tag {
    display: inline-block;
    border: 0;
    background-color: transparent;
    color: var(--color-primary);
    font-weight: bold;
  }

  .content {
    border-radius: 8px;
    border-top-left-radius: 0;
    width: 20rem;
    background-color: white;
    box-shadow: 0 8px 12px #00000018;
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
