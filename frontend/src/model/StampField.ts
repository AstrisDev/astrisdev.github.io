import { Stamp } from '../api/SfDatabase.ts';

export class StampField {
  static Id = new StampField('id', 'По номеру', (s) => s.id);
  static Value = new StampField('value', 'По номиналу', (s) => s.value);
  static BoxArea = new StampField('boxarea', 'По занимаемому месту', (s) => s.shape?.bboxArea ?? null);
  static Width = new StampField('width', 'По ширине', (s) => s.shape?.width ?? null);
  static AllValues = [StampField.Id, StampField.Value, StampField.BoxArea, StampField.Width];

  private constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly extractValue: (s: Stamp) => number | null,
  ) {}

  toString() {
    return this.id;
  }

  static fromString(id: string): StampField {
    const field = StampField.AllValues.find((f) => f.id === id);
    if (!field) {
      throw new Error(`Invalid id: ${id}`);
    }
    return field;
  }
}
