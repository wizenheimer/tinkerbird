import {
    SimilarityMetric,
    cosineSimilarity,
    euclideanSimilarity
} from "./metric";

import { Content, Node, Embedding } from "./node";
import { Heap } from "./heap";

export type vectorReducer = (a: Embedding, b: Embedding) => number;
export type vectorTransformer = (a: Embedding, b: Embedding) => Embedding;
export type vectorResult = {
    id: number;
    content: Content;
    embedding: Embedding;
    score: number;
}[];

const incorrectDimension = new Error("Invalid Vector Dimension");

export class HNSW {
    metric: SimilarityMetric; // similarity metric
    similarityFunction: vectorReducer; // similarity function
    d: number | null = null; // embedding dimension
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

    // perform vector search on the index
    query(target: Embedding, k: number = 3): vectorResult {
        const result: vectorResult = []; // storing the query result
        const visited: Set<number> = new Set<number>(); // de duplicate candidate search

        // main a heap of candidates that are ordered by similarity
        const orderBySimilarity = (aID: number, bID: number) => {
            const aNode = this.nodes.get(aID)!;
            const bNode = this.nodes.get(bID)!;
            return (
                this.similarityFunction(target, bNode.embedding) -
                this.similarityFunction(target, aNode.embedding)
            );
        };
        const candidates = new Heap<number>(orderBySimilarity);
        candidates.push(this.entryPointId);

        let level = this.levelMax;
        // do until we have required result
        while (!candidates.isEmpty() && result.length < k) {
            const currID = candidates.pop()!;
            if (visited.has(currID)) continue;

            visited.add(currID);
            const currNode = this.nodes.get(currID)!;
            const currSimilarity = this.similarityFunction(
                currNode.embedding,
                target
            );
            if (currSimilarity > 0) {
                result.push({
                    id: currID,
                    content: currNode.content,
                    embedding: currNode.embedding,
                    score: currSimilarity
                });
            }

            // no more levels left to explore
            if (currNode.level === 0) {
                continue;
            }

            // explore the neighbors of candidates from each level
            level = Math.min(level, currNode.level - 1);
            for (let i = level; i >= 0; i -= 1) {
                const neighbors = currNode.neighbors[i];
                for (const neighborId of neighbors) {
                    if (!visited.has(neighborId)) {
                        candidates.push(neighborId);
                    }
                }
            }
        }

        // pick the top k candidates from the result
        return result.slice(0, k);
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

    async buildIndex(
        data: { id: number; embedding: Embedding; content: Content }[]
    ) {
        // reset existing index
        this.nodes.clear();
        this.levelMax = 0;
        this.entryPointId = -1;

        // add current points into index
        data.forEach(async (item) => {
            await this.addVector(item.id, item.embedding, item.content);
        });
    }

    async addVector(id: number, embedding: Embedding, content: Content) {
        // check and initialize dimensions if needed
        if (this.d === null) {
            this.d = embedding.length;
        } else if (embedding.length !== this.d) {
            throw incorrectDimension;
        }

        // create and add newNode into index
        const newNode = new Node(
            id,
            this.determineLevel(),
            embedding,
            this.M,
            content
        );
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
                    targetNode.embedding,
                    nextNode.embedding
                );
                if (
                    similarity >
                    this.similarityFunction(
                        targetNode.embedding,
                        closestNode.embedding
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
                targetNode.embedding,
                neighborNode.embedding
            );
            // if so, make it the nextNode
            if (neighborSimilarity > maxSimilarity) {
                maxSimilarity = neighborSimilarity;
                nextNode = neighborNode;
            }
        }
        return nextNode;
    }

    serialize() {
        /*
        Sample Serialized           
        {
            "M": 16,
            "efConstruction": 200,
            "levelMax": 3,
            "entryPointId": 1,
            "nodes": [
                {
                "id": 1,
                "level": 2,
                "embedding": [0.5, 0.3, 0.8],
                "neighbors": [[2, 3], [4, 5], [6, 7]]
                },
                {
                "id": 2,
                "level": 1,
                "embedding": [0.2, 0.7, 0.1],
                "neighbors": [[1, 3], [8, 9]]
                },
                {
                "id": 3,
                "level": 2,
                "embedding": [0.9, 0.4, 0.6],
                "neighbors": [[1, 2], [10, 11], [12, 13]]
                },
                // ... additional nodes ...
            ]
        }
        */
        const entries = Array.from(this.nodes.entries());
        const nodes = entries.map(([id, node]) => {
            return [
                id,
                {
                    id: node.id,
                    content: node.content,
                    level: node.level,
                    embedding: Array.from(node.embedding),
                    neighbors: node.neighbors.map((level) => Array.from(level))
                }
            ];
        });

        return {
            M: this.M,
            efConstruction: this.efConstruction,
            levelMax: this.levelMax,
            entryPointId: this.entryPointId,
            node: nodes
        };
    }

    static deserialize(data: any): HNSW {
        // deserialize json data
        const hnsw = new HNSW(data.M, data.efConstruction);
        hnsw.levelMax = data.levelMax;
        hnsw.entryPointId = data.entryPointId;
        hnsw.nodes = new Map(
            data.nodes.map(([id, node]: [number, any]) => {
                return [
                    id,
                    {
                        ...node,
                        embedding: new Float32Array(node.embedding)
                    }
                ];
            })
        );
        return hnsw;
    }
}
