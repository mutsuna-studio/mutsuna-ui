<script lang="ts">
  import { Select } from "@mutsuna/ui/select";
</script>

<div id="select-container" style="width:300px">
  <Select searchable options={[{ value: "a", label: "Alpha" }]} ariaLabel="Resize select" class="w-full" />
</div>
