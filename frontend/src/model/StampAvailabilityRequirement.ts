import { Shop, Stamp } from '../api/SfDatabase.ts';

export class StampAvailabilityRequirement {
  public static readonly NO_REQUIREMENT = new StampAvailabilityRequirement({});
  public static readonly IN_ANY_SHOP = new StampAvailabilityRequirement({ inAnyShop: true });

  private static ANY: string = 'any';
  private readonly allowedShopIds: string[]; // empty if no requirement is set or any shop is acceptable
  private readonly anyShopAcceptable: boolean; // used to distinguish between two cases described above

  constructor(options: { allowedShopIds?: string[]; inAnyShop?: boolean }) {
    if (options.inAnyShop && options.allowedShopIds !== undefined) {
      throw Error('allowedShopIds and inAnyShop cannot be used at the same time');
    }
    this.allowedShopIds = options.allowedShopIds ?? [];
    this.anyShopAcceptable = options.inAnyShop ?? false;
  }

  matches(stamp: Stamp) {
    if (this.anyShopAcceptable) {
      return stamp.shopItems.length !== 0;
    } else if (this.allowedShopIds.length === 0) {
      return true;
    } else {
      return stamp.shopItems.some((i) => this.isShopAccepted(i.shop));
    }
  }

  encodeToString(): string {
    return this.anyShopAcceptable ? StampAvailabilityRequirement.ANY : this.allowedShopIds.join(',');
  }

  toFormData(allShops: Shop[]): { displayLabel: string; shopId: string; selected: boolean }[] {
    return allShops.map((shop) => ({
      shopId: shop.id,
      displayLabel: `${shop.displayName} [${shop.reportDate}]`,
      selected: this.isShopAccepted(shop),
    }));
  }

  static fromFormData(
    data: { displayLabel: string; shopId: string; selected: boolean }[],
  ): StampAvailabilityRequirement {
    const selectedShops = data.filter((s) => s.selected);
    if (selectedShops.length === 0) {
      return StampAvailabilityRequirement.NO_REQUIREMENT;
    } else if (selectedShops.length === data.length) {
      return StampAvailabilityRequirement.IN_ANY_SHOP;
    } else {
      return new StampAvailabilityRequirement({ allowedShopIds: selectedShops.map((s) => s.shopId) });
    }
  }

  isShopAccepted(shop: Shop) {
    return this.anyShopAcceptable || this.allowedShopIds.includes(shop.id);
  }

  static decodeFromString(str: string): StampAvailabilityRequirement {
    if (str === this.ANY) {
      return StampAvailabilityRequirement.IN_ANY_SHOP;
    } else if (!str) {
      return StampAvailabilityRequirement.NO_REQUIREMENT;
    }
    return new StampAvailabilityRequirement({ allowedShopIds: str.split(',') });
  }
}
