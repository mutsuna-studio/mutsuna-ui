<script lang="ts">
import Button from "@mutsuna/ui/button/button.svelte";
import Card from "@mutsuna/ui/card/card.svelte";
import CardContent from "@mutsuna/ui/card/card-content.svelte";
import CardDescription from "@mutsuna/ui/card/card-description.svelte";
import CardHeader from "@mutsuna/ui/card/card-header.svelte";
import CardTitle from "@mutsuna/ui/card/card-title.svelte";
import { Checkbox } from "@mutsuna/ui/checkbox";
import * as Dialog from "@mutsuna/ui/dialog";
import Input from "@mutsuna/ui/input/input.svelte";
import { Label } from "@mutsuna/ui/label";
import { showErrorToast, showSuccessToast } from "@mutsuna/ui/sonner";
import type { BusinessHourDraft, Weekday } from "./business-hours.js";
import { weekdayLabels, weekdays } from "./business-hours.js";

export type BusinessHoursFieldsProps = {
  readonly title: string;
  readonly description: string;
  readonly presentation?: "card" | "section";
  businessHours: BusinessHourDraft[];
  holidayDates: string;
  holidayIsOpen: boolean;
  holidayOpensAt: string;
  holidayClosesAt: string;
  holidayPriority: boolean;
};

let {
  title,
  description,
  presentation = "card",
  businessHours = $bindable(),
  holidayDates = $bindable(),
  holidayIsOpen = $bindable(),
  holidayOpensAt = $bindable(),
  holidayClosesAt = $bindable(),
  holidayPriority = $bindable(),
}: BusinessHoursFieldsProps = $props();

let bulkOpensAt = $state("09:00");
let bulkClosesAt = $state("18:00");
let bulkWeekdays = $state<Weekday[]>([]);
let bulkDialogOpen = $state(false);

function toggleBulkWeekday(weekday: Weekday): void {
  bulkWeekdays = bulkWeekdays.includes(weekday) ? bulkWeekdays.filter((item) => item !== weekday) : [...bulkWeekdays, weekday];
}

function toggleAllBulkWeekdays(): void {
  bulkWeekdays = bulkWeekdays.length === weekdays.length ? [] : [...weekdays];
}

function applyBulkBusinessHours(): void {
  if (bulkWeekdays.length === 0) {
    showErrorToast("適用する曜日を選択");
    return;
  }

  businessHours = businessHours.map((hour) =>
    bulkWeekdays.includes(hour.weekday)
      ? {
          ...hour,
          isOpen: true,
          opensAt: bulkOpensAt,
          closesAt: bulkClosesAt,
        }
      : hour,
  );
  bulkWeekdays = [];
  bulkDialogOpen = false;
  showSuccessToast("営業時間を一括で反映しました。");
}
</script>

{#snippet fields()}
    <div class="grid gap-3">
      {#each businessHours as hours, index (hours.weekday)}
        <div class="grid gap-3 rounded-md border p-4 md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
          <Label class="flex items-center gap-3 text-sm font-medium">
            <Checkbox name="openWeekdays" value={hours.weekday} bind:checked={businessHours[index].isOpen} />
            {hours.label}
          </Label>
          {#if hours.isOpen}
            <div class="flex flex-wrap items-center gap-2">
              <Input name={`opensAt.${hours.weekday}`} type="time" step="900" bind:value={businessHours[index].opensAt} class="w-32" required />
              <span class="text-sm text-muted-foreground">〜</span>
              <Input name={`closesAt.${hours.weekday}`} type="time" step="900" bind:value={businessHours[index].closesAt} class="w-32" required />
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">定休日</p>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex justify-end">
      <Dialog.Root bind:open={bulkDialogOpen}>
        <Dialog.Trigger>
          {#snippet child({ props })}
            <Button type="button" variant="outline" {...props}>営業時間を一括設定</Button>
          {/snippet}
        </Dialog.Trigger>
        <Dialog.Content class="max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>営業時間を一括設定</Dialog.Title>
            <Dialog.Description>選択した曜日に同じ営業時間をまとめて適用</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body class="grid gap-5 py-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-end">
              <Label class="grid gap-2">
                開始時刻
                <Input type="time" step="900" bind:value={bulkOpensAt} class="w-32" />
              </Label>
              <Label class="grid gap-2">
                終了時刻
                <Input type="time" step="900" bind:value={bulkClosesAt} class="w-32" />
              </Label>
            </div>
            <div class="grid gap-2">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium">一括適用する曜日</p>
                <Button type="button" size="sm" variant="ghost" onclick={toggleAllBulkWeekdays}>
                  {bulkWeekdays.length === weekdays.length ? "全解除" : "全選択"}
                </Button>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each weekdays as weekday (weekday)}
                  <Button type="button" size="sm" variant={bulkWeekdays.includes(weekday) ? "default" : "outline"} onclick={() => toggleBulkWeekday(weekday)}>
                    {weekdayLabels[weekday]}
                  </Button>
                {/each}
              </div>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close>
              {#snippet child({ props })}
                <Button type="button" variant="outline" {...props}>キャンセル</Button>
              {/snippet}
            </Dialog.Close>
            <Button type="button" onclick={applyBulkBusinessHours}>適用</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>

    <Label class="grid gap-2">
      休業日
      <Input name="holidayDates" bind:value={holidayDates} placeholder="例: 2026-12-31, 2027-01-01" />
      <span class="text-xs text-muted-foreground">YYYY-MM-DD をカンマ区切りで入力</span>
    </Label>

    <div class="grid gap-4 rounded-md border p-4">
      <Label class="flex items-center gap-3 text-sm font-medium">
        <Checkbox name="holidayIsOpen" value="true" bind:checked={holidayIsOpen} />
        祝日も営業する
      </Label>
      {#if holidayIsOpen}
        <div class="flex flex-wrap items-center gap-2">
          <Input name="holidayOpensAt" type="time" step="900" bind:value={holidayOpensAt} class="w-32" required />
          <span class="text-sm text-muted-foreground">〜</span>
          <Input name="holidayClosesAt" type="time" step="900" bind:value={holidayClosesAt} class="w-32" required />
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">祝日は定休日</p>
      {/if}
      <Label class="flex items-start gap-3 text-sm">
        <Checkbox name="holidayPriority" value="true" bind:checked={holidayPriority} class="mt-0.5" />
        <span class="grid gap-1">
          <span class="font-medium">祝日の営業時間を優先</span>
          <span class="text-muted-foreground">祝日に該当する日は曜日設定ではなく祝日設定を適用</span>
        </span>
      </Label>
    </div>
{/snippet}

{#if presentation === "card"}
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      {@render fields()}
    </CardContent>
  </Card>
{:else}
  <div class="grid gap-6">
    <div>
      <h3 class="font-medium">{title}</h3>
      <p class="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
    {@render fields()}
  </div>
{/if}
