import { HNSW, vectorResult } from "./hnsw";
import { openDB, deleteDB, DBSchema, IDBPDatabase } from "idb";
import { CacheOptions, Cache, VectorCache } from "./cache";
interface IndexSchema extends DBSchema {
    "hnsw-index": {
        key: string;
        value: any;
    };
}

export type VectorStoreOptions = {
    collectionName: string;
    M?: number;
    efConstruction?: number;
    cacheOptions?: CacheOptions | null;
};

const VectorStoreUnintialized = new Error("Vector Store is uninitialized.");
const VectorStoreIndexMissing = new Error("Vector Store Index is missing.");
const VectorStoreIndexPurgeFailed = new Error(
    "Vector Store Index can't be deleted."
);

export class VectorStore extends HNSW {
    collectionName: string;
    collection: IDBPDatabase<IndexSchema> | null = null;
    cacheInstance: VectorCache | null = null;

    private constructor(
        M: number,
        efConstruction: number,
        collectionName: string,
        cacheOptions: CacheOptions | null = null
    ) {
        super(M, efConstruction);
        this.collectionName = collectionName;
        if (cacheOptions) {
            this.cacheInstance = Cache.getInstance(cacheOptions);
        }
    }

    static async create({
        collectionName,
        M = 16,
        efConstruction = 200,
        cacheOptions = null
    }: VectorStoreOptions): Promise<VectorStore> {
        const instance = new VectorStore(
            M,
            efConstruction,
            collectionName,
            cacheOptions
        );
        await instance.init();
        return instance;
    }

    private async init() {
        this.collection = await openDB<IndexSchema>(this.collectionName, 1, {
            upgrade(collection: IDBPDatabase<IndexSchema>) {
                collection.createObjectStore("hnsw-index");
            }
        });
    }

    async createIndex() {
        throw new Error("Not implemented");
    }

    async loadIndex() {
        if (!this.collection) throw VectorStoreUnintialized;
        const loadedIndex: HNSW | undefined = await this.collection.get(
            "hnsw-index",
            "hnsw"
        );

        if (!loadedIndex) throw VectorStoreIndexMissing;

        const hnsw = HNSW.deserialize(loadedIndex);
        this.M = hnsw.M;
        this.efConstruction = hnsw.efConstruction;
        this.levelMax = hnsw.levelMax;
        this.entryPointId = hnsw.entryPointId;
        this.nodes = hnsw.nodes;
    }

    async saveIndex() {
        if (!this.collection) throw VectorStoreUnintialized;
        await this.collection.put("hnsw-index", this.serialize(), "hnsw");
    }

    async deleteIndex() {
        if (!this.collection) return VectorStoreUnintialized;

        try {
            await deleteDB(this.collectionName);
            this.init();
        } catch (error) {
            throw VectorStoreIndexPurgeFailed;
        }
    }

    query(target: number[], k: number = 3): vectorResult {
        const cachedResult = this.cacheInstance?.get([target, k]);
        if (cachedResult) return cachedResult;
        return super.query(target, k);
    }

    cache(query: number[], k: number, result: vectorResult) {
        this.cacheInstance?.set([query, k], result);
    }
}
