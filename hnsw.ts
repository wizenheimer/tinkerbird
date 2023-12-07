import { SimilarityMetric } from "./metric";

type vectorReducer = (a: number[], b: number[]) => number;
type vectorTransformer = (a: number[], b: number[]) => number[];

export class HNSW {
    metric: SimilarityMetric; // similarity metric
    d: number | null = null; // vector dimension
    M: number; // maximum neighbor count
    efConstruction: number; // effervescence coefficient
    entryPointId: number; // id of entry node
    nodes: Map<number, Node>; // mapping of [id: Node]

    constructor(
        M = 16,
        efConstruction = 200,
        d: number | null = null,
        metric: SimilarityMetric = SimilarityMetric.cosine
    ) {
        this.metric = metric;
        this.d = d;
        this.M = M;
        this.efConstruction = efConstruction;
        this.entryPointId = -1;
        this.nodes = new Map<number, Node>();
    }
}
