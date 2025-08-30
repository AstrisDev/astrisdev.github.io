import z from 'zod';
import { parseNumberFromInput, zNullableInputNumber } from './utility';

function parseRange(
  v: {
    min: number | null;
    max: number | null;
    isExact?: boolean;
  },
  ctx: z.RefinementCtx,
): NumberRange {
  if (v.isExact !== undefined && v.isExact) {
    return NumberRange.exact(v.min);
  } else if (v.min === null || v.max === null || v.min <= v.max) {
    return NumberRange.between(v.min, v.max);
  } else {
    const issue = {
      code: z.ZodIssueCode.custom,
      message: 'min > max',
    };
    ctx.addIssue({ ...issue, path: ['min'] });
    ctx.addIssue({ ...issue, path: ['max'] });
    return z.NEVER;
  }
}

export const zNumberRange = z
  .strictObject({
    min: zNullableInputNumber,
    max: zNullableInputNumber,
  })
  .transform(parseRange);

export const zNumberRangeWithSwitch = z
  .strictObject({
    isExact: z.boolean(),
    min: zNullableInputNumber,
    max: zNullableInputNumber,
  })
  .transform(parseRange);

export class NumberRange {
  exact: boolean;

  constructor(
    readonly start: number | null,
    readonly end: number | null,
    exact?: boolean,
  ) {
    if (exact === true && start !== end) {
      throw new Error('exact === true && start !== end');
    }
    this.exact = exact !== undefined ? exact : start === end;
  }

  static exact(value: number | null): NumberRange {
    return new NumberRange(value, value, true);
  }

  static between(start: number | null, end: number | null): NumberRange {
    if (start === end) {
      return NumberRange.exact(start);
    }
    return new NumberRange(start, end, false);
  }

  get isUnbounded() {
    return this.start === null && this.end === null;
  }

  contains(n: number | null): boolean {
    if (n === null) {
      return this.start === null && this.end === null;
    }
    return (this.start === null || this.start <= n) && (this.end === null || this.end >= n);
  }

  toFormValuesWithSwitch(): z.input<typeof zNumberRangeWithSwitch> {
    return {
      ...this.toFormValues(),
      isExact: this.exact,
    };
  }

  toFormValues(): z.input<typeof zNumberRange> {
    return {
      min: this.start?.toString() ?? '',
      max: this.end?.toString() ?? '',
    };
  }

  toString(): string {
    if (this.exact) {
      return `${this.start ?? ''}`;
    } else {
      return `${this.start ?? ''}~${this.end ?? ''}`;
    }
  }

  static fromString(str: string): NumberRange {
    const parts = str.split('~');
    if (parts.length == 2) {
      const start = parseNumberFromInput(parts[0]);
      const end = parseNumberFromInput(parts[1]);
      if (start === undefined || end === undefined) {
        throw new Error('Invalid string for range');
      }
      return NumberRange.between(start, end);
    } else if (parts.length == 1) {
      const value = parseNumberFromInput(parts[0]);
      if (value === undefined) {
        throw new Error('Invalid string for range');
      }
      return NumberRange.exact(value);
    } else {
      throw new Error('Invalid string for range');
    }
  }
}
