import { HNSW } from "../src/hnsw";
import { SimilarityMetric } from "../src/metric";
import fs from "fs/promises";

const runTests = async (
    dataSizes: number[], // Vary the size of the dataset
    dimensions: number[], // Vary the dimensionality of vectors
    kValues: number[], // Vary the number of neighbors to search for
    similarityMetrics: SimilarityMetric[] = [SimilarityMetric.cosine] // Similarity metrics as needed
) => {
    for (const dataSize of dataSizes) {
        for (const dimension of dimensions) {
            for (const kValue of kValues) {
                for (const similarityMetric of similarityMetrics) {
                    console.log(
                        `Running tests with dataSize=${dataSize}, dimension=${dimension}, k=${kValue}, metric=${similarityMetric}`
                    );

                    // Generate random data
                    const data = Array.from(
                        { length: dataSize },
                        (_, index) => ({
                            id: index + 1,
                            vector: Array.from({ length: dimension }, () =>
                                Math.random()
                            )
                        })
                    );

                    const hnsw = new HNSW();

                    // Measure index build time
                    console.time("IndexBuildTime");
                    await hnsw.buildIndex(data);
                    console.timeEnd("IndexBuildTime");

                    // Serialize the index to JSON
                    const serializedIndex = hnsw.serialize();

                    // Save the serialized index to a file (optional)
                    await fs.writeFile(
                        `./test/hnsw_index_${dataSize}_${dimension}_${kValue}_${similarityMetric}.json`,
                        JSON.stringify(serializedIndex, null, 2)
                    );

                    // Generate a random query vector
                    const queryVector = Array.from({ length: dimension }, () =>
                        Math.random()
                    );

                    // Measure query time
                    console.time("QueryTime");
                    const results = hnsw.query(queryVector, kValue);
                    console.timeEnd("QueryTime");

                    console.log(`Query Results:`, results);
                    console.log("\n");
                }
            }
        }
    }
};
