<script lang="ts">
  const { name, size = 16 } = $props<{ name: string; size?: number }>();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 {size} {size}">
  <use href="/icons.svg#{name}" />
</svg>
