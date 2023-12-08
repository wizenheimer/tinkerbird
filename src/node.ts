export class Node {
    id: number;
    level: number;
    vector: number[];
    neighbors: number[][];

    constructor(
        id: number,
        level: number,
        vector: number[],
        maxNeighbors: number
    ) {
        this.id = id;
        this.level = level;
        this.vector = vector;

        // fill neighbors arrays with sentinel values
        this.neighbors = Array.from(
            {
                length: level + 1
            },
            () => new Array(maxNeighbors).fill(-1)
        );
    }
}
