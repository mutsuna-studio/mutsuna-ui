<script lang="ts">
import TimePicker from "@mutsuna/ui/time-picker/time-picker.svelte";

interface Props {
  value?: string;
  minuteStep?: number;
  minuteInputStep?: number;
  disabled?: boolean;
  class?: string;
  triggerClass?: string;
}

let { value = $bindable("09:00"), minuteStep = 15, minuteInputStep = 5, disabled = false, class: className, triggerClass }: Props = $props();
</script>

<TimePicker bind:value {minuteStep} {minuteInputStep} {disabled} class={className} {triggerClass} />
