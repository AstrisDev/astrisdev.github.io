export interface RawItem {
  name: string;
  ids: number[];
  amount?: number | null;
}

export interface RawShop {
  id: string;
  displayName: string;
  link: string;
  reportDate: string;
  items: RawItem[];
}

export type RawShops = RawShop[];
