<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within } from "storybook/test";
import SearchIcon from "@lucide/svelte/icons/search";
import XIcon from "@lucide/svelte/icons/x";
import Button from "@mutsuna/ui/button/button.svelte";
import Input from "@mutsuna/ui/input/input.svelte";
import Loading from "@mutsuna/ui/loading/loading.svelte";
import InputGroup from "@mutsuna/ui/input-group/input-group.svelte";
import InputGroupAddon from "@mutsuna/ui/input-group/input-group-addon.svelte";
import InputGroupButton from "@mutsuna/ui/input-group/input-group-button.svelte";
import InputGroupInput from "@mutsuna/ui/input-group/input-group-input.svelte";
import InputGroupText from "@mutsuna/ui/input-group/input-group-text.svelte";
import InputGroupTextarea from "@mutsuna/ui/input-group/input-group-textarea.svelte";

const { Story } = defineMeta({
  title: "Components/Inputs/Input Group",
  component: InputGroup,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let searchValue = $state("サンプルプロジェクト");
let searchInput = $state<HTMLInputElement | null>(null);
let floatingSearchValue = $state("サンプルプロジェクト");
let floatingSearchInput = $state<HTMLInputElement | null>(null);
let asyncSearchValue = $state("管理画面");
let asyncSearchInput = $state<HTMLInputElement | null>(null);
let searchLoading = $state(false);
let floatingAsyncSearchValue = $state("管理画面");
let floatingAsyncSearchInput = $state<HTMLInputElement | null>(null);
let floatingSearchLoading = $state(false);
let compactSearchValue = $state("");
let compactSearchInput = $state<HTMLInputElement | null>(null);
let compactSearchGroup = $state<HTMLDivElement | null>(null);
let compactWasExpanded = false;
let compactHovered = $state(false);
let compactFocused = $state(false);

function clearSearch(): void {
	searchValue = "";
	searchInput?.focus();
}

function clearFloatingSearch(): void {
	floatingSearchValue = "";
	floatingSearchInput?.focus();
}

function clearAsyncSearch(): void {
	asyncSearchValue = "";
	asyncSearchInput?.focus();
}

function clearFloatingAsyncSearch(): void {
	floatingAsyncSearchValue = "";
	floatingAsyncSearchInput?.focus();
}

function clearCompactSearch(): void {
	compactSearchValue = "";
	compactSearchInput?.focus();
}

function toggleCompactSearch(event: MouseEvent): void {
	if (compactWasExpanded) {
		(event.currentTarget as HTMLButtonElement).blur();
		compactWasExpanded = false;
		return;
	}

	compactSearchInput?.focus();
}
</script>

{#snippet iconAndClearPatterns()}
	<div class="grid max-w-md gap-6">
		<section class="grid gap-2" data-testid="compact-search">
			<h2 class="text-sm font-medium">フォーカスで展開</h2>
			<p class="text-xs text-muted-foreground">通常はアイコンのみ表示し、フォーカスすると入力欄を展開します。</p>
			<InputGroup
				bind:ref={compactSearchGroup}
				class={compactHovered && !compactFocused ? "collapsible-search bg-muted" : "collapsible-search"}
				aria-label="検索"
				onpointerenter={() => compactHovered = true}
				onpointerleave={() => compactHovered = false}
				onfocusin={() => compactFocused = true}
				onfocusout={(event) => compactFocused = event.currentTarget.contains(event.relatedTarget as Node)}
			>
				<InputGroupAddon align="inline-start">
					<InputGroupButton
						size="icon-xs"
						class="hover:bg-transparent dark:hover:bg-transparent"
						aria-label="検索入力を開閉"
						onpointerdown={() => compactWasExpanded = compactSearchGroup?.matches(":focus-within") ?? false}
						onclick={toggleCompactSearch}
					><SearchIcon aria-hidden="true" /></InputGroupButton>
				</InputGroupAddon>
				<InputGroupInput
					bind:ref={compactSearchInput}
					bind:value={compactSearchValue}
					class="collapsible-search-input"
					aria-label="キーワードを検索"
					placeholder="キーワードを入力"
				/>
				{#if compactSearchValue}
					<InputGroupAddon align="inline-end">
						<InputGroupButton size="icon-xs" aria-label="検索キーワードをクリア" onclick={clearCompactSearch}><XIcon aria-hidden="true" /></InputGroupButton>
					</InputGroupAddon>
				{/if}
			</InputGroup>
		</section>

		<section class="grid gap-2" data-testid="standard-search">
			<h2 class="text-sm font-medium">アイコンとクリア</h2>
			<InputGroup>
				<InputGroupAddon align="inline-start"><SearchIcon aria-hidden="true" /></InputGroupAddon>
				<InputGroupInput bind:ref={searchInput} bind:value={searchValue} aria-label="プロジェクトを検索" placeholder="プロジェクト名で検索" />
				{#if searchValue}
					<InputGroupAddon align="inline-end">
						<InputGroupButton size="icon-xs" aria-label="入力内容をクリア" onclick={clearSearch}><XIcon aria-hidden="true" /></InputGroupButton>
					</InputGroupAddon>
				{/if}
			</InputGroup>
		</section>

		<section class="grid gap-2" data-testid="floating-search">
			<h2 class="text-sm font-medium">フローティングラベル</h2>
			<div class="floating-input-with-actions relative">
				<SearchIcon class="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 z-10 size-4 -translate-y-1/2" aria-hidden="true" />
				<Input bind:ref={floatingSearchInput} bind:value={floatingSearchValue} label="プロジェクトを検索" class="ps-8 pe-9" />
				{#if floatingSearchValue}
					<Button type="button" variant="ghost" size="icon-xs" icon={XIcon} aria-label="入力内容をクリア" class="absolute end-1 top-1/2 z-10 -translate-y-1/2" onclick={clearFloatingSearch} />
				{/if}
			</div>
		</section>

		<section class="grid gap-2" data-testid="async-search">
			<h2 class="text-sm font-medium">検索状態</h2>
			<InputGroup aria-busy={searchLoading}>
				<InputGroupAddon align="inline-start">
					{#if searchLoading}<Loading variant="classic" size="sm" label="検索中" />{:else}<SearchIcon aria-hidden="true" />{/if}
				</InputGroupAddon>
				<InputGroupInput bind:ref={asyncSearchInput} bind:value={asyncSearchValue} aria-label="プロジェクトを検索" placeholder="プロジェクト名で検索" />
				{#if asyncSearchValue}
					<InputGroupAddon align="inline-end">
						<InputGroupButton size="icon-xs" aria-label="入力内容をクリア" onclick={clearAsyncSearch}><XIcon aria-hidden="true" /></InputGroupButton>
					</InputGroupAddon>
				{/if}
			</InputGroup>
			<Button type="button" variant="outline" size="sm" onclick={() => (searchLoading = !searchLoading)}>
				{searchLoading ? "検索を完了する" : "検索中にする"}
			</Button>
		</section>

		<section class="grid gap-2" data-testid="floating-async-search">
			<h2 class="text-sm font-medium">フローティングラベルの検索状態</h2>
			<div class="floating-input-with-actions relative" aria-busy={floatingSearchLoading}>
				{#if floatingSearchLoading}
					<Loading variant="classic" size="sm" label="検索中" class="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 z-10 -translate-y-1/2" />
				{:else}
					<SearchIcon class="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 z-10 size-4 -translate-y-1/2" aria-hidden="true" />
				{/if}
				<Input bind:ref={floatingAsyncSearchInput} bind:value={floatingAsyncSearchValue} label="プロジェクトを検索" class="ps-8 pe-9" />
				{#if floatingAsyncSearchValue}
					<Button type="button" variant="ghost" size="icon-xs" icon={XIcon} aria-label="入力内容をクリア" class="absolute end-1 top-1/2 z-10 -translate-y-1/2" onclick={clearFloatingAsyncSearch} />
				{/if}
			</div>
			<Button type="button" variant="outline" size="sm" onclick={() => (floatingSearchLoading = !floatingSearchLoading)}>
				{floatingSearchLoading ? "検索を完了する" : "検索中にする"}
			</Button>
		</section>
	</div>
{/snippet}

<Story name="Icon And Clear Patterns" asChild>
	{@render iconAndClearPatterns()}
</Story>

<Story name="Icon And Clear Patterns Interaction Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
	const canvas = within(canvasElement);
	const standard = within(canvas.getByTestId("standard-search"));
	const floating = within(canvas.getByTestId("floating-search"));
	const asynchronous = within(canvas.getByTestId("async-search"));
	const floatingAsynchronous = within(canvas.getByTestId("floating-async-search"));
	const compact = within(canvas.getByTestId("compact-search"));
	const compactGroup = compact.getByRole("group", { name: "検索" });
	const compactInput = compact.getByRole("textbox", { name: "キーワードを検索" });
	const compactToggle = compact.getByRole("button", { name: "検索入力を開閉" });
	const collapsedWidth = compactGroup.getBoundingClientRect().width;
	const compactIcon = compactGroup.querySelector("svg");
	const groupRect = compactGroup.getBoundingClientRect();
	const iconRect = compactIcon?.getBoundingClientRect();
	await expect(iconRect).toBeDefined();
	await expect(Math.abs((iconRect?.left ?? 0) + (iconRect?.width ?? 0) / 2 - (groupRect.left + groupRect.width / 2))).toBeLessThan(1);
	await expect(getComputedStyle(compactInput).cursor).toBe("pointer");
	const restingBackground = getComputedStyle(compactGroup).backgroundColor;
	await userEvent.hover(compactToggle);
	await new Promise((resolve) => setTimeout(resolve, 180));
	await expect(getComputedStyle(compactGroup).backgroundColor).not.toBe(restingBackground);
	await userEvent.unhover(compactToggle);

	await userEvent.click(compactToggle);
	await new Promise((resolve) => setTimeout(resolve, 250));
	await expect(compactInput).toHaveFocus();
	await expect(getComputedStyle(compactInput).cursor).toBe("text");
	await expect(compactGroup.getBoundingClientRect().width).toBeGreaterThan(collapsedWidth);
	await userEvent.click(compactToggle);
	await new Promise((resolve) => setTimeout(resolve, 250));
	await expect(compactInput).not.toHaveFocus();
	await expect(Math.abs(compactGroup.getBoundingClientRect().width - collapsedWidth)).toBeLessThan(1);
	const standardInput = standard.getByRole("textbox", { name: "プロジェクトを検索" });
	const floatingInput = floating.getByRole("textbox", { name: "プロジェクトを検索" });

	await userEvent.click(standard.getByRole("button", { name: "入力内容をクリア" }));
	await expect(standardInput).toHaveFocus();
	await userEvent.type(standardInput, "管理画面");
	await userEvent.click(floating.getByRole("button", { name: "入力内容をクリア" }));
	await expect(floatingInput).toHaveFocus();
	await userEvent.type(floatingInput, "管理画面");
	await userEvent.click(asynchronous.getByRole("button", { name: "検索中にする" }));
	await expect(asynchronous.getByRole("status", { name: "検索中" })).toBeInTheDocument();
	await userEvent.click(asynchronous.getByRole("button", { name: "検索を完了する" }));
	await expect(asynchronous.queryByRole("status", { name: "検索中" })).not.toBeInTheDocument();
	await userEvent.click(floatingAsynchronous.getByRole("button", { name: "検索中にする" }));
	await expect(floatingAsynchronous.getByRole("status", { name: "検索中" })).toBeInTheDocument();
	await userEvent.click(floatingAsynchronous.getByRole("button", { name: "検索を完了する" }));
	await expect(floatingAsynchronous.queryByRole("status", { name: "検索中" })).not.toBeInTheDocument();
}}>
	{@render iconAndClearPatterns()}
</Story>

<Story name="Inline Addons" asChild>
	<div class="grid max-w-xl gap-4">
		<InputGroup>
			<InputGroupAddon align="inline-start">
				<InputGroupText>¥</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput aria-label="月額料金" value="12000" inputmode="numeric" />
			<InputGroupAddon align="inline-end">
				<InputGroupText>月</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
		<InputGroup>
			<InputGroupInput aria-label="検索キーワード" placeholder="検索キーワード" />
			<InputGroupAddon align="inline-end">
				<InputGroupButton>検索</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	</div>
</Story>

<style>
:global(.floating-input-with-actions .floating-input > label) {
	left: 2rem;
	max-width: calc(100% - 4.25rem);
}

:global(.floating-input-with-actions .floating-input > fieldset) {
	padding-left: calc(2rem - 0.25rem - 1px);
}

:global(.collapsible-search) {
	width: 2rem;
	overflow: hidden;
	cursor: pointer;
	transition: width 200ms ease-in-out, background-color 150ms ease-in-out;
}

:global(.collapsible-search:focus-within) {
	width: min(18rem, 100%);
}

:global(.collapsible-search > [data-align="inline-start"]) {
	flex: 0 0 1.875rem;
	margin-left: 0;
	padding-left: 0;
}

:global(.collapsible-search > [data-align="inline-start"] > button) {
	margin-left: 0;
}

:global(.collapsible-search .collapsible-search-input) {
	min-width: 0;
	padding-inline: 0;
	opacity: 0;
	cursor: pointer;
	transition: opacity 120ms ease-in-out, padding 200ms ease-in-out;
}

:global(.collapsible-search:focus-within .collapsible-search-input) {
	padding-inline: 0.5rem;
	opacity: 1;
	cursor: text;
	transition-delay: 60ms, 0ms;
}

:global(.collapsible-search > [data-align="inline-start"]) {
	cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
	:global(.collapsible-search),
	:global(.collapsible-search .collapsible-search-input) {
		transition-duration: 0ms;
	}
}
</style>

<Story name="Block Addon" asChild>
	<InputGroup class="max-w-xl">
		<InputGroupAddon align="block-start" class="border-b">
			<InputGroupText>利用者に表示する説明</InputGroupText>
		</InputGroupAddon>
		<InputGroupTextarea aria-label="利用者に表示する説明" value="利用者に公開する項目です。表示条件を確認してください。" />
		<InputGroupAddon align="block-end" class="border-t">
			<Button type="button" size="sm" variant="outline">下書き保存</Button>
		</InputGroupAddon>
	</InputGroup>
</Story>

<Story name="Invalid" asChild>
	<InputGroup class="max-w-xl">
		<InputGroupAddon align="inline-start">
			<InputGroupText>分前</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput aria-label="通知する分数" aria-invalid="true" value="-10" inputmode="numeric" />
	</InputGroup>
</Story>
