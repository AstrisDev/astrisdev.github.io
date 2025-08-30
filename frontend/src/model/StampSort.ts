import { StampField } from './StampField.ts';
import { SortOrder } from './SortOrder.ts';
import { Stamp } from '../api/SfDatabase.ts';

export class StampSort {
  constructor(
    readonly field: StampField,
    readonly order: SortOrder,
  ) {}

  toString(): string {
    return `${this.field}-${this.order}`;
  }

  static fromString(str: string): StampSort {
    const sortParts = str.split('-');
    const field = sortParts[0];
    const order = sortParts[1];
    return new StampSort(StampField.fromString(field), SortOrder.fromString(order));
  }

  compare(a: Stamp, b: Stamp): number {
    const aValue = this.field.extractValue(a);
    const bValue = this.field.extractValue(b);
    if (aValue !== null && bValue !== null) {
      const cmp = aValue > bValue ? -1 : aValue === bValue ? 0 : 1;
      return this.reverseMultiplier() * cmp;
    } else if (aValue !== null) {
      // nulls are last
      return -1;
    } else if (bValue !== null) {
      // nulls are last
      return 1;
    } else {
      // both are null
      return 0;
    }
  }

  private reverseMultiplier(): number {
    return this.order === SortOrder.Desc ? 1 : -1;
  }
}
