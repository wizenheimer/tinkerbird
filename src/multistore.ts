// experimental multi index vector store
import { HNSW } from "./hnsw";
import { openDB, deleteDB, DBSchema, IDBPDatabase } from "idb";

interface VectorSchema extends DBSchema {
    [indexName: string]: {
        key: string;
        value: any;
    };
}

const VectorStoreUnintialized = new Error("Vector Store is uninitialized.");
const VectorStoreIndexMissing = new Error("Vector Store Index is missing.");
const VectorStoreIndexPurgeFailed = new Error(
    "Vector Store Index can't be deleted."
);

export type MultiStoreInitializer = {
    collectionName: string;
    indexName: string;
    M: number;
    efConstruction: number;
};

export class MultiStore {
    dbName: string;
    db: IDBPDatabase<VectorSchema> | null = null;
    indexes: HNSW[] = [];

    private constructor(indexInitializer: HNSWInitializer[], dbName: string) {
        indexInitializer.forEach(({ M, efConstruction }) => {
            this.indexes.push(new HNSW(M, efConstruction));
        });
        this.dbName = dbName;
    }

    static async create(
        indexInitializer: HNSWInitializer[],
        dbName: string
    ): Promise<VectorStore> {
        const instance = new VectorStore(indexInitializer, dbName);
        await instance.init(indexInitializer);
        return instance;
    }

    private async init(indexInitializer: HNSWInitializer[]) {
        this.db = await openDB<VectorSchema>(this.dbName, 1, {
            upgrade(db: IDBPDatabase<VectorSchema>) {
                indexInitializer.forEach(({ name, M, efConstruction }) => {
                    db.createObjectStore(name);
                });
            }
        });
    }

    async createIndex() {
        throw new Error("Not implemented");
    }

    async loadIndex() {
        if (!this.db) throw VectorStoreUnintialized;
        const loadedIndex: HNSW | undefined = await this.db.get(
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
        if (!this.db) throw VectorStoreUnintialized;
        await this.db.put("hnsw-index", this.serialize(), "hnsw");
    }

    async deleteIndex() {
        if (!this.db) return VectorStoreUnintialized;

        try {
            await deleteDB(this.dbName);
            this.init();
        } catch (error) {
            throw VectorStoreIndexPurgeFailed;
        }
    }
}
