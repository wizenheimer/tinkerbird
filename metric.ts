export enum SimilarityMetric {
    cosine = "cosine",
    euclidean = "euclidean"
}

function dotProduct(a: number[], b: number[]): number {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result += a[i] * b[i];
    }
    return result;
}

function euclideanDistance(a: number[], b: number[]): number {
    let result = 0.0;
    for (let i = 0; i < a.length; i++) {
        result += (a[i] - b[i]) ** 2;
    }
    result = Math.sqrt(result);
    return result;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    return (
        dotProduct(a, b) /
        (Math.sqrt(dotProduct(a, a)) * Math.sqrt(dotProduct(b, b)))
    );
}

export function euclideanSimilarity(a: number[], b: number[]): number {
    return 1 / (1 + euclideanDistance(a, b));
}
