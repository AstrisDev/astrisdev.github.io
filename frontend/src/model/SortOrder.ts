export class SortOrder {
  static Asc = new SortOrder('asc');
  static Desc = new SortOrder('desc');

  private constructor(public readonly id: 'asc' | 'desc') {}

  reverse() {
    return this === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  }

  toString() {
    return this.id;
  }

  static fromString(id: string): SortOrder {
    switch (id) {
      case SortOrder.Asc.id:
        return SortOrder.Asc;
      case SortOrder.Desc.id:
        return SortOrder.Desc;
      default:
        throw new Error('Invalid id');
    }
  }
}
