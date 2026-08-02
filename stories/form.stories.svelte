<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import FormButton from "@mutsuna/ui/form/form-button.svelte";
import Input from "@mutsuna/ui/input/input.svelte";
import Label from "@mutsuna/ui/label/label.svelte";

const { Story } = defineMeta({
  title: "UI/Form",
  component: FormButton,
  tags: ["autodocs"],
});
</script>

<Story name="Submit Action" asChild>
	<form class="grid max-w-sm gap-4" onsubmit={(event) => event.preventDefault()}>
		<div class="grid gap-2">
			<Label for="form-story-name">施設名</Label>
			<Input id="form-story-name" name="name" value="むつな会議室" />
			<p class="text-muted-foreground text-sm">予約者に表示する施設名</p>
		</div>
		<FormButton class="w-fit">保存</FormButton>
	</form>
</Story>

<Story name="Submitting" asChild>
	<FormButton disabled aria-busy="true">保存中…</FormButton>
</Story>
