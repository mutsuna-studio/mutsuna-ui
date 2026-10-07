<script lang="ts">
import Input from "@mutsuna/ui/input/input.svelte";
import * as Select from "@mutsuna/ui/select";
import * as InputGroup from "@mutsuna/ui/input-group";
let normal = $state("");
let searchable = $state("");
let grouped = $state("");
let inputRef = $state<HTMLInputElement | null>(null);
const options = [{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }];
</script>
<div id="outlined-fields" class="grid max-w-md gap-6 py-8">
  <Input label="Floating input" />
  <Select.Root label="Outlined select" bind:value={normal} name="outlined-normal">
    <Select.Trigger><span>{normal || "Choose an option"}</span></Select.Trigger>
    <Select.Content><Select.Item value="alpha">Alpha</Select.Item><Select.Item value="beta">Beta</Select.Item></Select.Content>
  </Select.Root>
  <Select.Root searchable label="Outlined search" {options} bind:value={searchable} name="outlined-search" />
  <InputGroup.Root label="Outlined group" labelFor="outlined-group-input">
    <InputGroup.Addon><InputGroup.Text>検索</InputGroup.Text></InputGroup.Addon>
    <InputGroup.Input id="outlined-group-input" bind:ref={inputRef} bind:value={grouped} name="outlined-query" placeholder="Search text" />
    <InputGroup.Addon align="inline-end"><InputGroup.Button aria-label="Clear outlined group" onclick={() => { grouped = ""; inputRef?.focus(); }}>Clear</InputGroup.Button></InputGroup.Addon>
  </InputGroup.Root>
  <InputGroup.Root label="Generated group"><InputGroup.Input /></InputGroup.Root>
  <InputGroup.Root label="Outlined notes"><InputGroup.Textarea /></InputGroup.Root>
  <Select.Root searchable label="Disabled outlined search" {options} disabled />
  <InputGroup.Root label="Invalid outlined group"><InputGroup.Input aria-invalid="true" aria-describedby="outlined-error" /></InputGroup.Root>
  <p id="outlined-error">Required value</p>
  <button id="outlined-outside">Outside outlined fields</button>
</div>
