import { isString } from 'lodash';
import z from 'zod';

export const zNullableInputNumber = z.string().transform((val, ctx) => {
  const n = parseNumberFromInput(val);
  if (n === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not a number',
    });
    return z.NEVER;
  }
  return n;
});
export const zNullableInputString = z.string().transform((arg) => (isString(arg) && !arg.trim() ? null : arg));

export function parseNumberFromInput(str: string): number | null | undefined {
  if (!str.trim()) {
    // blank -> null
    return null;
  }
  // invalid -> undefined
  const n = Number(str);
  return isFinite(n) ? n : undefined;
}

export function minOf(values: (string | number | null | undefined)[]): null | number {
  const min = Math.min(
    ...values.map((v) => (isString(v) ? parseNumberFromInput(v) : v)).filter((v): v is number => typeof v === 'number'),
  );
  return !isNaN(min) ? min : null;
}

export function maxOf(values: (string | number | null | undefined)[]): null | number {
  const max = Math.max(
    ...values.map((v) => (isString(v) ? parseNumberFromInput(v) : v)).filter((v): v is number => typeof v === 'number'),
  );
  return !isNaN(max) ? max : null;
}
