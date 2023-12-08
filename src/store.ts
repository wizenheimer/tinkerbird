import { HNSW } from "./hnsw";
import { openDB, deleteDB, DBSchema, IDBPDatabase } from "idb";

interface VectorSchema extends DBSchema {
    "hnsw-index": {
        key: string;
        value: any;
    };
}

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
}
