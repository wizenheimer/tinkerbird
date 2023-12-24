export type Content = string;
export type Embedding = number[] | Float32Array;
export class Node {
    id: number;
    content: Content;
    level: number;
    embedding: Embedding;
    neighbors: number[][];

    constructor(
        id: number,
        level: number,
        embedding: Embedding,
        maxNeighbors: number,
        content: Content
    ) {
        this.id = id;
        this.level = level;
        this.embedding = embedding;
        this.content = content;

        // fill neighbors arrays with sentinel values
        this.neighbors = Array.from(
            {
                length: level + 1
            },
            () => new Array(maxNeighbors).fill(-1)
        );
    }
}
