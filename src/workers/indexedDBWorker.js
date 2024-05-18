self.onmessage = async function (event) {
    const { type, dbName, storeName, jsonData } = event.data;

    if (type === 'seedData') {
        try {
            const dbRequest = indexedDB.open(dbName, 1);
            dbRequest.onupgradeneeded = function (event) {
                const db = event.target.result;
                createObjectStore(db, storeName);
            };

            dbRequest.onsuccess = async function (event) {
                const db = event.target.result;
                await seedDataIfNeeded(db, jsonData, storeName);
                self.postMessage({ status: 'completed', storeName });
            };

            dbRequest.onerror = function (event) {
                self.postMessage({ status: 'error', error: event.target.error });
            };
        } catch (error) {
            self.postMessage({ status: 'error', error });
        }
    }
};

const createObjectStore = (db, storeName) => {
    if (!db.objectStoreNames.contains(storeName)) {
        const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('priority', 'priority', { unique: false });
        objectStore.createIndex('team', 'team', { unique: false });
        objectStore.createIndex('tag', 'tag', { unique: false, multiEntry: true });
    }
};

const seedDataIfNeeded = async (db, jsonData, storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const countRequest = objectStore.count();

        countRequest.onsuccess = async () => {
            if (countRequest.result === 0) {
                try {
                    await storeData(db, jsonData, storeName);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve();
            }
        };

        countRequest.onerror = (event) => {
            reject(event.target.error);
        };
    });
};

const storeData = (db, jsonData, storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };

        jsonData.forEach((issue) => {
            const addRequest = objectStore.add(issue);
            addRequest.onsuccess = () => {
                self.postMessage({ status: 'progress', storeName, issue });
            };
            addRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });
};