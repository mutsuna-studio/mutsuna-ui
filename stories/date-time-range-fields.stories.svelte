<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { parseDate } from "@internationalized/date";
import { DateTimeRangeFields } from "@mutsuna/ui/date-time-range-fields";

const { Story } = defineMeta({
  title: "UI/Date Time Range Fields",
  component: DateTimeRangeFields,
  tags: ["autodocs"],
});
</script>

<Story
  name="Booking Period"
  args={{
    startDateValue: parseDate("2026-08-03"),
    endDateValue: parseDate("2026-08-03"),
    startDate: "2026-08-03",
    startTime: "09:00",
    endDate: "2026-08-03",
    endTime: "10:00",
    minimumStartDateValue: parseDate("2026-08-02"),
    minimumEndDateValue: parseDate("2026-08-03"),
  }}
/>

<Story
  name="Validation Error"
  args={{
    startDateValue: parseDate("2026-08-03"),
    endDateValue: parseDate("2026-08-03"),
    startDate: "2026-08-03",
    startTime: "10:00",
    endDate: "2026-08-03",
    endTime: "09:00",
    minimumStartDateValue: parseDate("2026-08-02"),
    minimumEndDateValue: parseDate("2026-08-03"),
    errorMessage: "終了日時は開始日時より後にしてください。",
  }}
/>
