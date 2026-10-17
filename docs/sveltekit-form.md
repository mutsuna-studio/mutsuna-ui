# SvelteKit form action

[ガイド一覧](./README.md)

SvelteKit form actionの通知、redirect、pending管理は専用subpathから利用する。

```ts
import { createFormActionToastEnhancer } from "@mutsuna/ui/sveltekit-form";
```

`@mutsuna/ui/sveltekit-form`を利用するprojectだけ`@sveltejs/kit`が必要。
