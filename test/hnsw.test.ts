import { HNSW } from "../src";
import { SimilarityMetric } from "../src/metric";
import { describe, expect } from "vitest";

describe("HNSW Test with Cosine Metric", (test) => {
    test("should return correct nearest neighbors", async () => {
        // Simple example with cosine metric
        const hnsw = new HNSW(16, 200, 5, SimilarityMetric.cosine);

        // Make some data
        const data = [
            { id: 1, content: "foo", embedding: [1, 2, 3, 4, 5] },
            { id: 2, content: "bar", embedding: [2, 3, 4, 5, 6] },
            { id: 3, content: "sho", embedding: [3, 4, 5, 6, 7] },
            { id: 4, content: "que", embedding: [4, 5, 6, 7, 8] },
            { id: 5, content: "wee", embedding: [5, 6, 7, 8, 9] }
        ];

        // Build the index
        await hnsw.buildIndex(data);

        // Search for nearest neighbors
        const results = hnsw.query([6, 7, 8, 9, 10], 2);

        expect(results).toEqual([
            {
                id: 1,
                content: "foo",
                embedding: [1, 2, 3, 4, 5],
                score: 0.9649505047327671
            },
            {
                id: 2,
                content: "bar",
                embedding: [2, 3, 4, 5, 6],
                score: 0.9864400504156211
            }
        ]);
    });
});

describe("HNSW Test with Euclidean Metric", (test) => {
    test("should return correct nearest neighbors with euclidean distance", async () => {
        // Simple example with euclidean distance
        const hnsw = new HNSW(16, 200, 5, SimilarityMetric.euclidean);

        // Make some data
        const data = [
            { id: 1, content: "foo", embedding: [1, 2, 3, 4, 5] },
            { id: 2, content: "bar", embedding: [2, 3, 4, 5, 6] },
            { id: 3, content: "sho", embedding: [3, 4, 5, 6, 7] },
            { id: 4, content: "que", embedding: [4, 5, 6, 7, 8] },
            { id: 5, content: "wee", embedding: [5, 6, 7, 8, 9] }
        ];

        // Build the index
        await hnsw.buildIndex(data);

        // Search for nearest neighbors
        const results = hnsw.query([6, 7, 8, 9, 10], 2);

        expect(results).toEqual([
            {
                id: 1,
                content: "foo",
                embedding: [1, 2, 3, 4, 5],
                score: 0.08209951522176571
            },
            {
                id: 2,
                content: "bar",
                embedding: [2, 3, 4, 5, 6],
                score: 0.10056040392403998
            }
        ]);
    });
});
