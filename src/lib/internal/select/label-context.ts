import { getContext, setContext } from "svelte";
const key = Symbol("select-label");
type SelectLabel = { readonly label: string | undefined; readonly id: string | undefined; readonly invalid: boolean | "true" | "false" | undefined; readonly describedby: string | undefined };
export const setSelectLabel = (context: SelectLabel): SelectLabel => setContext(key, context);
export const getSelectLabel = (): SelectLabel | undefined => getContext(key);
