import { VectorStore } from "../../src/store";
import { SimilarityMetric } from "../../src/metric";
import fs from "fs/promises";
import { HNSW } from "../../src/hnsw";

export const testStore = async (
    dataSizes: number[], // Vary the size of the dataset
    dimensions: number[], // Vary the dimensionality of vectors
    kValues: number[], // Vary the number of neighbors to search for
    similarityMetrics: SimilarityMetric[] = [SimilarityMetric.cosine], // Similarity metrics as needed
    checkSerialization: boolean = false
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
                            embedding: Array.from({ length: dimension }, () =>
                                Math.random()
                            )
                        })
                    );

                    // Test HNSW index
                    const hnsw = new HNSW();

                    // Measure index build time
                    console.time("HNSWIndexBuildTime");
                    await hnsw.buildIndex(data);
                    console.timeEnd("HNSWIndexBuildTime");

                    if (checkSerialization) {
                        // Serialize the index to JSON
                        const serializedIndex = hnsw.serialize();

                        // Save the serialized index to a file (optional)
                        await fs.writeFile(
                            `./test/hnsw_index_${dataSize}_${dimension}_${kValue}_${similarityMetric}.json`,
                            JSON.stringify(serializedIndex, null, 2)
                        );
                    }

                    // Generate a random query vector
                    const queryVector = Array.from({ length: dimension }, () =>
                        Math.random()
                    );

                    console.log("Query vector", queryVector);

                    // // Measure query time
                    console.time("HNSWQueryTime");
                    const hnswResults = hnsw.query(queryVector, kValue);
                    console.timeEnd("HNSWQueryTime");

                    console.log(`HNSW Query Results:`, hnswResults);

                    // Test VectorStore
                    const vectorStore = await VectorStore.create({
                        collectionName: "test-collection"
                    });

                    // Measure index build time
                    console.time("VectorStoreIndexBuildTime");
                    for (const item of data) {
                        await vectorStore.addVector(item.id, item.embedding);
                    }
                    console.timeEnd("VectorStoreIndexBuildTime");

                    // Save the index
                    await vectorStore.saveIndex();

                    // Load the index
                    // await vectorStore.loadIndex();

                    // Measure query time
                    console.time("VectorStoreQueryTime");
                    const vectorStoreResults = vectorStore.query(
                        queryVector,
                        kValue
                    );
                    console.timeEnd("VectorStoreQueryTime");
                    console.log(
                        `VectorStore Query Results:`,
                        vectorStoreResults
                    );

                    // Measure cached query time
                    console.time("cachedVectorStoreResults");
                    const cachedVectorStoreResults = vectorStore.query(
                        queryVector,
                        kValue
                    );
                    console.timeEnd("cachedVectorStoreResults");
                    console.log(
                        `CachedVectorStore Query Results:`,
                        cachedVectorStoreResults
                    );

                    // Optionally, delete the VectorStore index
                    // Uncomment the line below to test index deletion
                    // await vectorStore.deleteIndex();

                    console.log("\n");
                }
            }
        }
    }
};

// Example usage
// const dataSizes = [1000];
// const dimensions = [128];
// const kValues = [5];
// const similarityMetric = [SimilarityMetric.cosine];
// const cacheOptions: CacheOptions = {
//     max: 100,
//     maxAge: 10 * 10
// };
// testStore(
//     dataSizes,
//     dimensions,
//     kValues,
//     similarityMetric,
//     false,
//     cacheOptions
// );
