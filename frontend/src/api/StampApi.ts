import React from 'react';
import { RawShops } from './RawShops';
import { RawStamps } from './RawStamps';
import { SfDatabase } from './SfDatabase';
import { ApiError, fetchJsonFromSources } from './fetch-helper';

export class StampApi {
  stampsSources: string[];
  shopsSources: string[];

  constructor() {
    this.stampsSources = import.meta.env.VITE_SF_STAMPS_DATA_URL.split(';');
    this.shopsSources = import.meta.env.VITE_SF_SHOPS_DATA_URL.split(';');
  }

  async loadDatabase(): Promise<SfDatabase> {
    try {
      console.log('Loading database');
      const stamps = await this.loadStamps();
      const shops = await this.loadShops();
      return new SfDatabase(stamps, shops);
    } catch (err) {
      throw ApiError.wrap(err);
    }
  }

  private async loadStamps(): Promise<RawStamps> {
    const result = await fetchJsonFromSources(this.stampsSources);
    return {
      baseUrl: result.url.replace(/[^/]*$/, ''),
      stamps: result.content,
    };
  }

  private async loadShops(): Promise<RawShops> {
    return (await fetchJsonFromSources(this.shopsSources)).content;
  }
}

export const StampApiContext = React.createContext<StampApi | null>(null);
export const StampApiProvider = StampApiContext.Provider;
export const useStampApi = (): StampApi => {
  const api = React.useContext(StampApiContext);
  if (!api) {
    throw new Error('useStampApi must be used within a StampApiProvider');
  }
  return api;
};
