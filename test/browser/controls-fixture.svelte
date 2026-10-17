<script lang="ts">
  import * as InputGroup from "@mutsuna/ui/input-group";
  import * as Select from "@mutsuna/ui/select";
  import { FilterSelect } from "@mutsuna/ui/filter-select";
</script>
<div class="grid gap-4">
  <InputGroup.Root><InputGroup.Input aria-label="入力グループ" /></InputGroup.Root>
  <Select.Root type="single">
    <Select.Trigger aria-label="通常の選択">選択</Select.Trigger>
    <Select.Content><Select.Item value="a">項目A</Select.Item></Select.Content>
  </Select.Root>
  <Select.Root type="single" searchable options={[{ value: "a", label: "項目A" }]} ariaLabel="検索付き選択" />
  <FilterSelect searchable type="single" ariaLabel="フィルター" options={[{ value: "a", label: "項目A" }]} />
</div>
