export function normalizeNumericInput(input: string, digits: number): string {
  return input.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, "").slice(0, digits);
}
