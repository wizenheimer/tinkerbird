import { VectorStore } from "../src/store";
import { SimilarityMetric } from "../src/metric";

export const testStore = async (
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

                    // Test VectorStore
                    const vectorStore = await VectorStore.create({
                        collectionName: "test-collection"
                    });

                    // Measure index build time
                    console.time("VectorStoreIndexBuildTime");
                    for (const item of data) {
                        await vectorStore.addVector(item.id, item.vector);
                    }
                    console.timeEnd("VectorStoreIndexBuildTime");

                    // Save the index
                    await vectorStore.saveIndex();
                }
            }
        }
    }
};

// Example usage
const dataSizes = [1000];
const dimensions = [128];
const kValues = [1];
const similarityMetric = [SimilarityMetric.cosine];

console.log("loading scripts...");
testStore(dataSizes, dimensions, kValues, similarityMetric);
