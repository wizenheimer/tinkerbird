export type Content = string | null;

export class Node {
    id: number;
    content: Content;
    level: number;
    vector: number[];
    neighbors: number[][];

    constructor(
        id: number,
        level: number,
        vector: number[],
        maxNeighbors: number,
        content: Content = null
    ) {
        this.id = id;
        this.level = level;
        this.vector = vector;
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
