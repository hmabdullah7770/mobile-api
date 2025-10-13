// Simple in-memory store (use Redis in production)
class ProgressStore {
    constructor() {
        this.store = new Map();
    }

    set(key, value) {
        this.store.set(key, value);
    }

    get(key) {
        return this.store.get(key);
    }

    delete(key) {
        this.store.delete(key);
    }
}

export const progressStore = new ProgressStore();