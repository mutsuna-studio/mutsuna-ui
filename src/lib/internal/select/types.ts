import type { Select as SelectPrimitive } from "bits-ui";
import type { Snippet } from "svelte";

export interface SelectSearchableOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type SelectRootProps = Omit<SelectPrimitive.RootProps, "onValueChange" | "type" | "value"> & {
  type?: "single";
  value?: string;
  onValueChange?: (value: string) => void;
  searchable?: boolean;
  freeText?: boolean;
  options?: readonly SelectSearchableOption[];
  /** Explicit outline label, independent from placeholder. */
  label?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  emptyLabel?: string;
  contentSide?: "bottom" | "top";
  contentAlign?: "start" | "end";
  size?: "sm" | "default";
  class?: string;
  ariaLabel?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  maxLength?: number;
  leading?: Snippet;
};
