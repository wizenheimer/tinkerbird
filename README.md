# <p align="center">TinkerBird</p>

TinkerBird is a browser native vector database designed for efficient storage and
retrieval of high-dimensional vectors (embeddings). It's query engine, written in
TypeScript, leverages HNSW (Hierarchical Navigable Small World) indexes for fast
vector retrieval. The storage layer utilizes IndexedDB, which could be extended
with an lru-cache.

By co-locating data and embeddings, Tikerbird eliminates the roundtrip and reduces 
reliance on server-side interactions for vector search workloads. With Tinkerbird, 
sensitive data remains local, thus benefiting from vector search, without the associated cost,
compliance and security risks.

TinkerBird uses IndexedDB as it's storage layer, which in turn builds upon Blobs
and LevelDB storage systems. By using Indexeddb, it benefits from IndexedDB's
adoption, stability and familiarity as a native choice for offline first
workflows.

## Examples

Here's a sample app built using TinkerBird. Check out [Tinkerboard](https://tinkerboard.vercel.app/) and [Source](https://github.com/wizenheimer/tinkerboard).

## Contributing

Feel free to contribute to TinkerBird by sending us your suggestions, bug
reports, or cat videos. Contributions are what make the open source community
such an amazing place to be learn, inspire, and create. Any contributions you
make are **greatly appreciated**.

## License

Distributed under the MIT License. See [LICENSE](LICENSE.md) for more information.
TinkerBird is provided "as is" and comes with absolutely no guarantees. We take
no responsibility for irrelevant searches, confused users, or existential crises
induced by unpredictable results. If it breaks, well, that's your problem now! jk.


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
