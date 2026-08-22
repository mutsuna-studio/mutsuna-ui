# shadcn-svelte upstream review

- From: 初回BASEなし
- To: 1.5.0 (5a8a880a1813)
- Review対象: 32 component
- Clean preview: 0
- Conflict preview: 0
- Manual added/removed: 0
- Dependency差分: `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `button-group`, `calendar`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `empty`, `field`, `form`, `input-group`, `label`, `popover`, `select`, `separator`, `sheet`, `sidebar`, `slider`, `sonner`, `switch`, `tabs`, `tooltip`

## Components

### heavily-customized

- [ ] `avatar` (heavily-customized): bootstrap 7
- [x] `button` (heavily-customized): bootstrap 2; decision=reviewed-no-change — nova 1.5.0のvariant・size・focus/invalid・disabled対応は反映済み。Mutsuna固有のloading/icon API、loading時a11y、cursor-pointerを維持し、上流差分は採用不要。tailwind-variants 3.3.0も現行rangeで解決済み。
- [ ] `calendar` (heavily-customized): bootstrap 19
- [ ] `dialog` (heavily-customized): bootstrap 11
- [ ] `select` (heavily-customized): bootstrap 12
- [ ] `slider` (heavily-customized): bootstrap 2
- [ ] `sonner` (heavily-customized): bootstrap 2
- [ ] `tooltip` (heavily-customized): bootstrap 6

### interaction

- [ ] `alert-dialog` (derived): bootstrap 13
- [ ] `checkbox` (derived): bootstrap 2
- [ ] `collapsible` (derived): bootstrap 4
- [ ] `dropdown-menu` (derived): bootstrap 18
- [ ] `form` (derived): bootstrap 9
- [ ] `label` (derived): bootstrap 2
- [ ] `popover` (derived): bootstrap 9
- [ ] `separator` (derived): bootstrap 2
- [ ] `sheet` (derived): bootstrap 11
- [ ] `sidebar` (derived): bootstrap 27
- [ ] `switch` (derived): bootstrap 2
- [ ] `tabs` (derived): bootstrap 5

### presentation

- [ ] `alert` (derived): bootstrap 5
- [ ] `badge` (derived): bootstrap 2
- [ ] `breadcrumb` (derived): bootstrap 8
- [ ] `button-group` (derived): bootstrap 4
- [ ] `card` (derived): bootstrap 8
- [ ] `empty` (derived): bootstrap 7
- [ ] `field` (derived): bootstrap 11
- [ ] `input` (derived): bootstrap 2
- [ ] `input-group` (derived): bootstrap 7
- [ ] `skeleton` (derived): bootstrap 2
- [ ] `table` (derived): bootstrap 9
- [ ] `textarea` (derived): bootstrap 2

## Review commands

```sh
pnpm review:shadcn -- <component>
pnpm review:shadcn -- <component> --decision applied --note "取り込んだ内容"
pnpm review:shadcn -- <component> --decision reviewed-no-change --note "採用しない理由"
pnpm review:shadcn -- --finalize
```

`src/lib`、dependency、公開contractは自動変更しない。
