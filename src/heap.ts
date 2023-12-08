export class Heap<T> {
    private items: T[] = [];
    constructor(private comparator: (a: T, b: T) => number) {}

    push(item: T): void {
        let i = 0;
        while (
            i < this.items.length &&
            this.comparator(item, this.items[i]) > 0
        ) {
            i += 1;
        }
        this.items.splice(i, 0, item);
    }

    pop(): T | undefined {
        return this.items.shift();
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}
