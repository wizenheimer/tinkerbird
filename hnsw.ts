import {
    SimilarityMetric,
    cosineSimilarity,
    euclideanSimilarity
} from "./metric";

import { Node } from "./node";

type vectorReducer = (a: number[], b: number[]) => number;
type vectorTransformer = (a: number[], b: number[]) => number[];

const incorrectDimension = new Error("Invalid Vector Dimension");

export class HNSW {
    metric: SimilarityMetric; // similarity metric
    similarityFunction: vectorReducer; // similarity function
    d: number | null = null; // vector dimension
    M: number; // maximum neighbor count
    efConstruction: number; // effervescence coefficient
    entryPointId: number; // id of entry node
    nodes: Map<number, Node>; // mapping of [id: Node]
    probs: number[]; // probabilities for each level
    levelMax: number; // maximum level of the graph

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
        this.levelMax = this.probs.length - 1;
    }

    private getSimilarityFunction() {
        return this.metric === SimilarityMetric.cosine
            ? cosineSimilarity
            : euclideanSimilarity;
    }

    // figure out the probability distribution along the level of the layers
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

    // stochastically pick a level, higher the probability greater the chances of getting picked
    private determineLevel(): number {
        let r = Math.random();
        this.probs.forEach((pLevel, index) => {
            if (r < pLevel) return index;
            r -= pLevel;
        });
        return this.probs.length - 1;
    }

    async buildIndex(data: { id: number; vector: number[] }[]) {
        // reset existing index
        this.nodes.clear();
        this.levelMax = 0;
        this.entryPointId = -1;

        // add current points into index
        data.forEach(async (item) => {
            await this.addVector(item.id, item.vector);
        });
    }

    async addVector(id: number, vector: number[]) {
        // check and initialize dimensions if needed
        if (this.d === null) {
            this.d = vector.length;
        } else if (vector.length !== this.d) {
            throw incorrectDimension;
        }

        // create and add newNode into index
        const newNode = new Node(id, this.determineLevel(), vector, this.M);
        this.nodes.set(id, newNode);

        // TODO: add node to index
        // await this.addNode(newNode);
    }
}
