<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { TemplateInsertMenu } from "@mutsuna/ui/template-insert-menu";

const { Story } = defineMeta({
  title: "UI/Template Insert Menu",
  component: TemplateInsertMenu,
  tags: ["autodocs"],
});
</script>

<Story
  name="Default"
  args={{
    templates: [
      { id: "profile-basic", name: "基本プロフィール", category: "profile", payload: { title: "店舗紹介", body: "紹介文" } },
      { id: "message-welcome", name: "歓迎メッセージ", category: "message", payload: { title: "ようこそ", body: "本文" } },
    ],
    category: "profile",
    defaultTemplates: [{ id: "profile-empty", name: "空のプロフィール", payload: { title: "", body: "" } }],
    existingOptions: [{ id: "existing-location", name: "既存店舗からコピー", sourceId: "location-1" }],
    onApply: () => undefined,
    onSelectExisting: () => undefined,
  }}
/>
