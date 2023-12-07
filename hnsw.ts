import {
    SimilarityMetric,
    cosineSimilarity,
    euclideanSimilarity
} from "./metric";

type vectorReducer = (a: number[], b: number[]) => number;
type vectorTransformer = (a: number[], b: number[]) => number[];

export class HNSW {
    metric: SimilarityMetric; // similarity metric
    similarityFunction: vectorReducer; // similarity function
    d: number | null = null; // vector dimension
    M: number; // maximum neighbor count
    efConstruction: number; // effervescence coefficient
    entryPointId: number; // id of entry node
    nodes: Map<number, Node>; // mapping of [id: Node]
    probs: number[]; // probabilities for each level

    constructor(
        M = 16,
        efConstruction = 200,
        d: number | null = null,
        metric: SimilarityMetric = SimilarityMetric.cosine
    ) {
        this.metric = metric;
        this.similarityFunction = this.getSimilarityFunction();
        this.d = d;
        this.M = M;
        this.efConstruction = efConstruction;
        this.entryPointId = -1;
        this.nodes = new Map<number, Node>();
        this.probs = this.getProbDistribution();
    }

    private getSimilarityFunction() {
        return this.metric === SimilarityMetric.cosine
            ? cosineSimilarity
            : euclideanSimilarity;
    }

    private getProbDistribution(): number[] {
        const levelMult = 1 / Math.log(this.M);
        let probs = [] as number[],
            level = 0;
        while (true) {
            const prob =
                Math.exp(-level / levelMult) * (1 - Math.exp(-1 / levelMult));
            if (prob < 1e-9) break;
            probs.push(prob);
            level++;
        }
        return probs;
    }
}
