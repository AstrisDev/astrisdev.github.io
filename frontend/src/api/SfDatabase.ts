import _ from 'lodash';
import React from 'react';
import { RawShops } from './RawShops';
import { RawStamps, RawStampShape } from './RawStamps';

export interface StampShape {
  text?: string;
  bboxArea?: number;
  width?: number;
}

export interface Stamp {
  id: number;
  idNameAndSeries: string;
  page: string;
  imageUrl: string | null;
  value: number | null;
  year: number | null;
  categories: Array<string>;
  series: string | null;
  name: string | null;
  shape: StampShape | null;

  shopItems: Item[];
  shopItemGroups: ItemGroup[];
}

export interface ItemGroup {
  shop: Shop;
  items: Item[];
}

export interface Item {
  shop: Shop;
  name: string;
  amount: number | null;
  stampIds: Array<number>;
}

export interface Shop {
  id: string;
  displayName: string;
  link: string;
  items: Array<Item>;
  reportDate: string | null;
  index: number;
}

export interface SfDatabaseStats {
  minYear: number;
  maxYear: number;
  categories: string[];
}

export class SfDatabase {
  private _stamps: Stamp[] = [];
  private _stampsById: Record<number, Stamp> = {};
  private _shops: Shop[] = [];
  private _shopsById: Record<string, Shop> = {};
  private _stats: SfDatabaseStats;

  constructor(rawStamps: RawStamps, rawShops: RawShops) {
    // Parse stamps
    for (const rawStamp of rawStamps.stamps) {
      const id = Number(rawStamp.id);
      const stamp: Stamp = {
        id,
        ..._.pick(rawStamp, ['page', 'value', 'year']),
        categories: rawStamp.categories ?? [],
        imageUrl: rawStamp.image !== null ? rawStamps.baseUrl + rawStamp.image : null,
        series: rawStamp.series ?? null,
        name: rawStamp.name ?? null,
        idNameAndSeries: (id + '|' + (rawStamp.name ?? '') + '|' + (rawStamp.series ?? '')).toLowerCase(),
        shopItems: [],
        shopItemGroups: [],
        shape: SfDatabase.stampFromRaw(rawStamp.shape),
      };
      this._stamps.push(stamp);
      this._stampsById[id] = stamp;
    }

    // Parse shops
    for (const rawShop of rawShops) {
      const shop: Shop = {
        index: this._shops.length,
        id: rawShop.id,
        link: rawShop.link,
        displayName: rawShop.displayName,
        reportDate: rawShop.reportDate,
        items: [],
      };
      shop.items = rawShop.items.map(
        (item): Item => ({
          shop: shop,
          name: item.name,
          stampIds: item.ids,
          amount: item.amount ?? null,
        }),
      );
      this._shops.push(shop);
      this._shopsById[shop.id] = shop;
    }

    // Link stamps and shop items
    for (const shop of this._shops) {
      for (const item of shop.items) {
        // Add this item to each of stamps
        for (const stampId of item.stampIds) {
          const stamp = this._stampsById[stampId];
          if (stamp) {
            stamp.shopItems.push(item);
          }
        }
      }
    }
    for (const stamp of this._stamps) {
      const groups = _.groupBy(stamp.shopItems, (i) => i.shop.index);
      stamp.shopItemGroups = Object.keys(groups)
        .sort()
        .map((shopIndex) => ({
          shop: this._shops[Number(shopIndex)],
          items: groups[shopIndex],
        }));
    }

    this._stats = this.computeStats();
  }

  private static stampFromRaw(rawShape: RawStampShape | undefined): StampShape | null {
    if (!rawShape) {
      return null;
    }
    const shape: StampShape = {};
    if (rawShape) {
      if (rawShape.type === 'rect') {
        shape.bboxArea = rawShape.w! * rawShape.h!;
        shape.width = rawShape.w;
        shape.text = `${rawShape.w!}x${rawShape.h!} мм`;
      } else if (rawShape.type === 'oval') {
        shape.bboxArea = rawShape.w! * rawShape.h!;
        shape.width = rawShape.w;
        shape.text = `овал ${rawShape.w!}x${rawShape.h!} мм`;
      } else if (rawShape.type === 'circle') {
        shape.bboxArea = rawShape.d! * rawShape.d!;
        shape.width = rawShape.d;
        shape.text = `круг ${rawShape.d!} мм`;
      } else if (rawShape.type === 'triangle45') {
        shape.bboxArea = (rawShape.w! * rawShape.w!) / 1.41;
        shape.width = rawShape.w;
        shape.text = `треугольник, длинная сторона ${rawShape.w!} мм`;
      } else {
        return null;
      }
    }
    return shape;
  }

  get stats() {
    return this._stats;
  }
  get shops() {
    return this._shops;
  }
  get stamps() {
    return this._stamps;
  }

  private computeStats(): SfDatabaseStats {
    const stampYears = this._stamps.map((s) => s.year).filter((year): year is number => year !== null);
    const stampCategories = _.sortBy(_.uniq(this._stamps.flatMap((s) => s.categories)));
    return { minYear: _.min(stampYears) ?? 0, maxYear: _.max(stampYears) ?? 0, categories: stampCategories };
  }
}

export const SfDatabaseContext = React.createContext<SfDatabase | null>(null);
export const SfDatabaseProvider = SfDatabaseContext.Provider;
export const useSfDatabase = (): SfDatabase => {
  const db = React.useContext(SfDatabaseContext);
  if (!db) {
    throw new Error('useSfDatabase must be used within a SfDatabaseProvider');
  }
  return db;
};
