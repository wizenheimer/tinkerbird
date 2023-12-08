import { LRUCache } from "lru-cache";
import { vectorResult } from "./hnsw";

export type CacheOptions = {
    max: number;
    maxAge: number;
};
export type VectorCache = LRUCache<[number[], number], vectorResult>;

export class Cache {
    private static instance: VectorCache;

    private constructor() {}

    public static getInstance(
        cacheOptions: CacheOptions | null = null
    ): VectorCache {
        if (!Cache.instance) {
            const options = {
                max: cacheOptions?.max ? cacheOptions.max : 100,
                length: () => 1,
                maxAge: cacheOptions?.maxAge ? cacheOptions.maxAge : 10 * 10
            };
            Cache.instance = new LRUCache<[number[], number], vectorResult>(
                options
            );
        }
        return Cache.instance;
    }
}

export default Cache;
