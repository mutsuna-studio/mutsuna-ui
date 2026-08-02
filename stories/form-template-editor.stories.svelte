<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { FormTemplateEditor, type EditorField } from "@mutsuna/ui/form-template-editor";

const initialFields: EditorField[] = [
  { kind: "fixed", key: "name", label: "お名前", type: "text", required: true, enabled: true, options: [] },
  { kind: "fixed", key: "email", label: "メールアドレス", type: "email", required: true, enabled: true, options: [] },
  { kind: "note", key: "note", label: "備考", type: "textarea", required: false, enabled: true, options: [], visibility: "always" },
  {
    kind: "custom",
    key: "customField1",
    label: "ご希望",
    type: "select",
    required: false,
    enabled: true,
    options: [
      { value: "morning", label: "午前" },
      { value: "afternoon", label: "午後" },
    ],
    visibility: "always",
  },
];

const { Story } = defineMeta({
  title: "UI/Form Template Editor",
  component: FormTemplateEditor,
  tags: ["autodocs"],
});
</script>

<Story
  name="Default"
  args={{
    fields: structuredClone(initialFields),
    visibilityOptions: [
      { value: "always", label: "常に表示" },
      { value: "conditional", label: "条件に一致する場合" },
    ],
    allowFixedRequired: true,
  }}
/>
