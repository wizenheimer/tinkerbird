import { HNSW, vectorResult } from "./hnsw";
import { openDB, deleteDB, DBSchema, IDBPDatabase } from "idb";
import { Embedding } from "./node";
import { VectorStoreIndexPurgeFailed, VectorStoreUnintialized } from "./errors";
import { VectorStoreOptions } from "./options";
interface IndexSchema extends DBSchema {
    meta: {
        key: string;
        value: any;
    };
    index: {
        key: string;
        value: any;
    };
}

export class VectorStore extends HNSW {
    collectionName: string;
    collection: IDBPDatabase<IndexSchema> | null = null;
    // cacheInstance: VectorCache | null = null;

    private constructor(
        M: number,
        efConstruction: number,
        collectionName: string
    ) {
        super(M, efConstruction);
        this.collectionName = collectionName;
    }

    static async create({
        collectionName,
        M = 16,
        efConstruction = 200
    }: VectorStoreOptions): Promise<VectorStore> {
        const instance = new VectorStore(M, efConstruction, collectionName);
        await instance.init();
        await instance.populateMeta();
        return instance;
    }

    private async init() {
        this.collection = await openDB<IndexSchema>(this.collectionName, 1, {
            upgrade(collection: IDBPDatabase<IndexSchema>) {
                collection.createObjectStore("meta");
                collection.createObjectStore("index");
            }
        });
    }

    private async populateMeta() {
        const collection = await openDB<IndexSchema>(this.collectionName, 1);
        collection.add("meta", this.efConstruction, "efConstruction");
        collection.add("meta", this.M, "neighbors");
        collection.add("meta", this.collectionName, "collectionName");
        collection.close();
    }

    async saveIndex() {
        if (!this.collection) throw VectorStoreUnintialized;
        const entries = Array.from(this.nodes.entries());
        entries.forEach(async ([id, node]) => {
            const index = {
                id: node.id,
                content: node.content,
                level: node.level,
                embedding: Array.from(node.embedding),
                neighbors: node.neighbors.map((level) => Array.from(level))
            };
            await this.collection?.put("index", index, String(id));
        });
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

    query(target: Embedding, k: number = 3): vectorResult {
        return super.query(target, k);
    }
}
