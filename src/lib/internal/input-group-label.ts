import { getContext, setContext } from "svelte";
const key = Symbol("input-group-label");
type GroupLabel = { readonly controlId: string | undefined };
export const setGroupLabel = (context: GroupLabel): GroupLabel => setContext(key, context);
export const getGroupLabel = (): GroupLabel | undefined => getContext(key);
