import { HNSW } from "./hnsw";
import { openDB, deleteDB, DBSchema, IDBPDatabase } from "idb";
import {
    VectorStoreIndexPurgeFailed,
    VectorStoreRecreationFailed,
    VectorStoreUnintialized
} from "./errors";
import { VectorStoreOptions } from "./options";
import { Node } from "./node";
import { SimilarityMetric } from "./metric";
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
        if (await VectorStore.exists(collectionName)) {
            await deleteDB(collectionName);
        }
        const instance = new VectorStore(M, efConstruction, collectionName);
        await instance.init();
        return instance;
    }

    // attempt to recreate the index from collection
    static async recreate({
        collectionName
    }: {
        collectionName: string;
    }): Promise<VectorStore> {
        if (!(await VectorStore.exists(collectionName)))
            return this.create({ collectionName });

        const { M, efConstruction } = await VectorStore.getMeta(collectionName);
        const instance = new VectorStore(M, efConstruction, collectionName);
        await instance.loadIndex();
        return instance;
    }

    // check if the collection exists
    static async exists(collectionName: string): Promise<boolean> {
        return (await indexedDB.databases())
            .map((db) => db.name)
            .includes(collectionName);
    }

    private async init() {
        this.collection = await openDB<IndexSchema>(this.collectionName, 1, {
            upgrade(collection: IDBPDatabase<IndexSchema>) {
                collection.createObjectStore("meta");
                collection.createObjectStore("index");
            }
        });
    }

    // get metadata about any collection
    static async getMeta(collectionName: string) {
        const collection = await openDB<IndexSchema>(collectionName, 1);
        const efConstruction = await collection.get("meta", "efConstruction");
        const M = await collection.get("meta", "neighbors");
        collection.close();
        return { M, efConstruction, collectionName };
    }

    // save meta info onto meta object store
    private async saveMeta() {
        if (!this.collection) throw VectorStoreUnintialized;
        await this.collection?.put("meta", this.d, "dimension");
        await this.collection?.put(
            "meta",
            this.collectionName,
            "collectionName"
        );
        await this.collection?.put("meta", this.M, "neighbors");
        await this.collection?.put("meta", this.entryPointId, "entryPointId");
        await this.collection?.put(
            "meta",
            this.efConstruction,
            "efConstruction"
        );
        await this.collection?.put("meta", this.probs, "probs");
        await this.collection?.put("meta", this.levelMax, "levelMax");
        await this.collection?.put(
            "meta",
            this.metric === SimilarityMetric.cosine ? "cosine" : "euclidean",
            "levelMax"
        );
    }

    // load meta info from meta object store
    private async loadMeta() {
        if (!this.collection) throw VectorStoreUnintialized;
        this.d = await this.collection?.get("meta", "dimension");
        this.collectionName = await this.collection?.get(
            "meta",
            "collectionName"
        );
        this.M = await this.collection?.get("meta", "neighbors");
        this.entryPointId = await this.collection?.get("meta", "entryPointId");
        this.efConstruction = await this.collection?.get(
            "meta",
            "efConstruction"
        );
        this.probs = await this.collection?.get("meta", "probs");
        this.levelMax = await this.collection?.get("meta", "levelMax");
        this.metric =
            (await this.collection?.get("meta", "levelMax")) === "cosine"
                ? SimilarityMetric.cosine
                : SimilarityMetric.euclidean;
    }

    // save index into index object store
    async saveIndex() {
        if (!this.collection) throw VectorStoreUnintialized;
        // delete index if it exists already
        if (await VectorStore.exists(this.collectionName))
            await this.deleteIndex();
        // populate the index
        const nodes = this.nodes;
        nodes.forEach(async (node: Node, key: number) => {
            await this.collection?.put("index", node, String(key));
        });
        // populate the meta
        await this.saveMeta();
    }

    // load index into index object store
    private async loadIndex() {
        if (!this.collection) throw VectorStoreUnintialized;
        try {
            // hold the nodes loaded in from indexedDB
            const nodes: Map<number, Node> = new Map();
            let store = this.collection.transaction("index").store;
            let cursor = await store.openCursor();
            // traverse the cursor
            while (true) {
                const id = Number(cursor?.key);
                const node = cursor?.value;

                nodes.set(id, node);

                cursor = await cursor!.continue();
                if (!cursor) break;
            }
            // map the nodes
            this.nodes = nodes;
            // load the meta data
            await this.loadMeta();
        } catch (error) {
            throw VectorStoreRecreationFailed;
        }
    }

    // delete index if it exists and populate it with empty index
    async deleteIndex() {
        if (!this.collection) return VectorStoreUnintialized;

        try {
            await deleteDB(this.collectionName);
            this.init();
        } catch (error) {
            throw VectorStoreIndexPurgeFailed;
        }
    }
}
