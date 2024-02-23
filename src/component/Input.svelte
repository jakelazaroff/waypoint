<script lang="ts">
  interface Props {
    placeholder?: string;
    value?: string;
  }

  let { placeholder, value } = $props<Props>();
</script>

<input {placeholder} bind:value />

<style>
  input {
    padding: 4px 8px;
    font-size: 0.75rem;
    border-radius: 8px;
    border: 1px solid #dddddd;
    transition: border-color 0.25s ease;
  }

  input:hover {
    border-color: #bbbbbb;
  }
</style>
