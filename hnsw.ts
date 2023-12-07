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

        // add node to index
        await this.addNode(newNode);
    }

    async addNode(targetNode: Node) {
        // incase this is the first node, set this as entry point and back out
        if (this.entryPointId === -1) {
            this.entryPointId = targetNode.id;
            return;
        }

        // start from the entry point
        // find the closest node to the target node
        let currNode = this.nodes.get(this.entryPointId)!;
        let closestNode = currNode;

        for (let level = this.levelMax; level >= 0; level -= 1) {
            // find the node closest to target node in the level, excluding the currentNode
            let nextNode = this.findNextNode(currNode, targetNode, level);
            // incase there's a nextNode, check to see if it's closer than the closestNode
            if (nextNode) {
                const similarity = this.similarityFunction(
                    targetNode.vector,
                    nextNode.vector
                );
                if (
                    similarity >
                    this.similarityFunction(
                        targetNode.vector,
                        closestNode.vector
                    )
                ) {
                    currNode = nextNode;
                    closestNode = currNode;
                } else {
                    break;
                }
            }
        }

        // find the level that's common to closest node and target node
        // highest level at which both are going to have neighbors
        const commonLevel = Math.min(targetNode.level, closestNode.level);
        for (let level = 0; level <= commonLevel; level += 1) {
            // update the neighborhood, such that both nodes share common neighbors upto a common level
            const addToNeighborhood = (srcNode: Node, trgNode: Node) => {
                // filter out sentinel ids
                srcNode.neighbors[level] = srcNode.neighbors[level].filter(
                    (id) => id !== -1
                );
                // add trgNode to the neighbor
                srcNode.neighbors[level].push(trgNode.id);
                // incase the max neighbor are exceeded, remove the farthest
                if (srcNode.neighbors[level].length > this.M) {
                    srcNode.neighbors[level].pop();
                }
            };
            addToNeighborhood(closestNode, targetNode);
            addToNeighborhood(targetNode, closestNode);
        }
    }

    findNextNode(currNode: Node, targetNode: Node, level: number): Node | null {
        let nextNode = null;
        let maxSimilarity = -Infinity;

        // traverse along the neigboring nodes of curNode
        for (const neighborId of currNode.neighbors[level]) {
            // lone node is the closest next node in the level
            if (neighborId === -1) break;

            // pick the neighbor node and check if it's closer
            const neighborNode = this.nodes.get(neighborId)!;
            const neighborSimilarity = this.similarityFunction(
                targetNode.vector,
                neighborNode.vector
            );
            // if so, make it the nextNode
            if (neighborSimilarity > maxSimilarity) {
                maxSimilarity = neighborSimilarity;
                nextNode = neighborNode;
            }
        }
        return nextNode;
    }
}
