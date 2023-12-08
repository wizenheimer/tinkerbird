import { HNSW } from "./hnsw";
import { openDB, deleteDB, DBSchema, IDBPDatabase } from "idb";

interface VectorSchema extends DBSchema {
    "hnsw-index": {
        key: string;
        value: any;
    };
}

const VectorStoreUnintialized = new Error("Vector Store is uninitialized.");
const VectorStoreIndexMissing = new Error("Vector Store Index is missing.");
const VectorStoreIndexPurgeFailed = new Error(
    "Vector Store Index can't be deleted."
);

export class VectorStore extends HNSW {
    dbName: string;
    db: IDBPDatabase<VectorSchema> | null = null;

    private constructor(M: number, efConstruction: number, dbName: string) {
        super(M, efConstruction);
        this.dbName = dbName;
    }

    static async create(
        M: number,
        efConstruction: number,
        dbName: string
    ): Promise<VectorStore> {
        const instance = new VectorStore(M, efConstruction, dbName);
        await instance.init();
        return instance;
    }

    private async init() {
        this.db = await openDB<VectorSchema>(this.dbName, 1, {
            upgrade(db: IDBPDatabase<VectorSchema>) {
                db.createObjectStore("hnsw-index");
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
