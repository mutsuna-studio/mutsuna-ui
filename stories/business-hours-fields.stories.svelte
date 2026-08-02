<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { BusinessHoursFields, type BusinessHourDraft, weekdayLabels, weekdays } from "@mutsuna/ui/business-hours-fields";

const businessHours: BusinessHourDraft[] = weekdays.map((weekday, index) => ({
  weekday,
  label: weekdayLabels[weekday],
  isOpen: index < 5,
  opensAt: "09:00",
  closesAt: "18:00",
}));

const { Story } = defineMeta({
  title: "UI/Business Hours Fields",
  component: BusinessHoursFields,
  tags: ["autodocs"],
});
</script>

<Story
  name="Card"
  args={{
    title: "営業時間",
    description: "曜日ごとの営業時間と祝日設定",
    businessHours: structuredClone(businessHours),
    holidayDates: "2026-12-31, 2027-01-01",
    holidayIsOpen: false,
    holidayOpensAt: "09:00",
    holidayClosesAt: "18:00",
    holidayPriority: true,
  }}
/>

<Story
  name="Section"
  args={{
    title: "曜日ごとの営業時間",
    description: "チェックを外すと定休日になります",
    presentation: "section",
    businessHours: structuredClone(businessHours),
    holidayDates: "",
    holidayIsOpen: true,
    holidayOpensAt: "10:00",
    holidayClosesAt: "17:00",
    holidayPriority: false,
  }}
/>
