# <p align="center">TinkerBird🐦</p>

TinkerBird is a Chrome-native vector database designed for efficient storage and
retrieval of high-dimensional vectors (embeddings). Its query engine, written in
TypeScript, leverages HNSW (Hierarchical Navigable Small World) indexes for fast
vector retrieval. The storage layer utilizes IndexedDB, which could be extended
with an lru-cache.

One significant challenge facing large language models (LLMs) is their tendency
to generate syntactically correct but factually inaccurate responses, a
phenomenon known as hallucination. To address this issue, vector databases
provide LLMs with relevant context to structure it's response. This not only
improves the accuracy of LLM responses but also minimizes computational costs
incurred by irrelevant tokens. Additionally, vector databases ensure that LLMs
are anchored to the required context.

TinkerBird disrupts traditional RAG workflows, which rely heavily on server-side
interactions. By co-locating data and embeddings, it eliminates the roundtrip
delays associated with client-server model. With Tinkerbird, sensitive data
remains local, thus benefiting from vector search, without the associated
compliance and security risks.

TinkerBird uses IndexedDB as it's storage layer, which in turn builds upon Blobs
and LevelDB storage systems. By using Indexeddb, it benefits from IndexedDB's
adoption, stability and familiarity as a native choice for offline first
workflows.

## Documentation

Documentation covers the key methods and usage scenarios for the `HNSW` and
`VectorStore` classes.

### `HNSW` Class

Encapsulates an in-memory implementation of HNSW index

```typescript
// Initialize HNSW index
const hnsw = new HNSW();

// Build HNSW index incrementally
await hnsw.buildIndex(data);

// Save the serialized index to a file
const serializedIndex = hnsw.serialize();

// Query Index with queryVector and kValue
const results = hnsw.query(queryVector, kValue);
```

#### Properties:

-   `metric: SimilarityMetric`: The similarity metric used in the HNSW graph.
-   `similarityFunction: vectorReducer`: The similarity function for reducing
    vectors.
-   `d: number | null`: The vector dimension. It can be `null` if not specified.
-   `M: number`: The maximum neighbor count.
-   `efConstruction: number`: The effervescence coefficient used during
    construction.
-   `entryPointId: number`: The ID of the entry node in the graph.
-   `nodes: Map<number, Node>`: A mapping of node IDs to nodes.
-   `probs: number[]`: Probabilities for each level in the graph.
-   `levelMax: number`: The maximum level of the graph.

#### Usage:

```typescript
// Example usage of the HNSW class
const hnsw = new HNSW();
```

### `SimilarityMetric` Enum

An enumeration of similarity metrics used in the context of the HNSW class.

#### Members:

-   `cosine`: Represents the cosine similarity metric.
-   `euclidean`: Represents the Euclidean similarity metric.

#### Usage:

```typescript
// Example usage of the SimilarityMetric enum
const selectedMetric: SimilarityMetric = SimilarityMetric.cosine;
```

### VectorStore API

This documentation provides an overview of the `VectorStore` class, its methods,
and usage examples. Feel free to adjust the parameters and methods as per your
needs.

The `VectorStore` class extends the HNSW class and provides functionality for
managing a vector index, including building, loading, saving, deleting the
index, and querying vectors. It supports caching to improve query performance.

### Class: VectorStore

#### Static Method: create

```typescript
static async create(options: VectorStoreOptions): Promise<VectorStore>
```

-   Creates a new instance of the `VectorStore` class.
-   `options`: Object containing options for vector store initialization.
    -   `collectionName`: A unique name for the vector collection.
    -   `M`: Maximum neighbor count (default is 16).
    -   `efConstruction`: Effervescence coefficient during construction (default
        is 200).

#### Static Method: recreate

```typescript
static async recreate(collectionName: string): Promise<VectorStore>
```

-   Attempts to recreate index from collection or else create a new instance of
    the `VectorStore` class if collection doesn't exist. This has been reported
    to result in unintended results, prefer create() instead.
-   `options`: Object containing options for vector store initialization.
    -   `collectionName`: A unique name for the vector collection.

#### Method: loadIndex

```typescript
async loadIndex(): Promise<void>
```

-   Loads the vector index and meta data from the IndexedDB database. Used
    internally to recreate index

#### Method: saveIndex

```typescript
async saveIndex(): Promise<void>
```

-   Persists the current state of the vector index and meta data onto the
    IndexedDB database.

#### Method: deleteIndex

```typescript
async deleteIndex(): Promise<void>
```

-   Deletes the persisted index and metadata from the IndexedDB and populates it
    with an empty index and metadata

#### Method: query

```typescript
query(target: number[], k: number = 3): vectorResult
```

-   Performs a vector search on the index.
-   `target`: The vector for which the search is performed.
-   `k`: The number of neighbors to retrieve (default is 3).
-   Returns: The result of the vector query.

#### Constants:

-   `VectorStoreUnintialized`: Error indicating that the vector store is
    uninitialized.
-   `VectorStoreIndexMissing`: Error indicating that the vector store index is
    missing.
-   `VectorStoreIndexPurgeFailed`: Error indicating that the vector store index
    deletion failed.

### Example Usage:

```typescript
// Create VectorStore instance
const vectorStore = await VectorStore.create({
    collectionName: "my-collection",
    M: 16,
    efConstruction: 200
});

// Load, Save, and Delete Index
await vectorStore.loadIndex();
await vectorStore.saveIndex();
await vectorStore.deleteIndex();

// Perform Vector Query
const queryVector = [
    /* ... */
];
const kValue = 5;
const results = vectorStore.query(queryVector, kValue);
```

## VectorStoreOptions

The `VectorStoreOptions` type defines the configuration options for initializing
a VectorStore instance.

### Type: VectorStoreOptions

#### Properties:

-   `collectionName: string`: A unique name for the vector collection.
-   `M?: number`: Maximum neighbor count (default is 16).
-   `efConstruction?: number`: Effervescence coefficient during construction
    (default is 200).
-   `cacheOptions?: CacheOptions | null`: Options for caching (optional).

### Example:

```typescript
const vectorStoreOptions: VectorStoreOptions = {
    collectionName: "my-collection",
    M: 16,
    efConstruction: 200,
    cacheOptions: {
        max: 1000,
        maxAge: 60000 // 1 minute
    }
};
```

## Contributing

Feel free to contribute to TinkerBird by sending us your suggestions, bug
reports, or cat videos. Contributions are what make the open source community
such an amazing place to be learn, inspire, and create. Any contributions you
make are **greatly appreciated**.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
TinkerBird is provided "as is" and comes with absolutely no guarantees. We take
no responsibility for irrelevant searches, confused users, or existential crises
induced by unpredictable results. If it breaks, well, that's your problem now
💀.

## Credits

TinkerBird was brought to you by an indie developer who should probably be
working on something more productive. But hey I am.

## References

-   [ANN-Benchmarks](https://github.com/erikbern/ann-benchmarks)
-   [Skip Lists: A Probabilistic Alternative to Balanced Trees](https://15721.courses.cs.cmu.edu/spring2018/papers/08-oltpindexes1/pugh-skiplists-cacm1990.pdf)
-   [Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small Worlds](https://arxiv.org/abs/1603.09320)
-   [Scalable Distributed Algorithm for Approximate Nearest Neighbor Search Problem in High-Dimensional General Metric Spaces](https://www.iiis.org/CDs2011/CD2011IDI/ICTA_2011/PapersPdf/CT175ON.pdf)
-   [A Comparative Study on Hierarchical Navigable Small World Graphs](https://deepai.org/publication/a-comparative-study-on-hierarchical-navigable-small-world-graphs)
-   [HNSW: Hierarchical Navigable Small World graphs](https://proceedings.mlr.press/v119/prokhorenkova20a/prokhorenkova20a.pdf)
-   [HNSW Graphs](https://github.com/deepfates/hnsw/)
-   [Hierarchical Navigable Small World graphs in FAISS](https://github.com/facebookresearch/faiss/blob/main/faiss/impl/HNSW.cpp)
-   [A Comparative Study on Hierarchical Navigable Small World Graphs](https://escholarship.org/content/qt1rp889r9/qt1rp889r9_noSplash_7071690a1d8a4ee71eb95432887d3a8e.pdf)
-   [Hierarchical Navigable Small World (HNSW) for ApproximateNearest Neighbor Search](https://towardsdatascience.com/similarity-search-part-4-hierarchical-navigable-small-world-hnsw-2aad4fe87d37)
-   [Hierarchical Navigable Small Worlds](https://srivatssan.medium.com/hierarchical-navigable-small-worlds-d44d39d91f4b)
