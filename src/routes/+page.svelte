<script>
  import { goto } from "$app/navigation";
  goto("/" + crypto.randomUUID(), { replaceState: true });
</script>
