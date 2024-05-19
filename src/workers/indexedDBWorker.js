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

function createObjectStore(db, storeName) {
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
    }
}

async function seedDataIfNeeded(db, jsonData, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);

        jsonData.forEach((issue) => {
            const request = objectStore.put(issue);
            request.onerror = function (event) {
                console.error('Error adding data:', event.target.error);
            };
        });

        transaction.oncomplete = function () {
            resolve();
        };

        transaction.onerror = function (event) {
            console.error('Error during transaction:', event.target.error);
            reject(event.target.error);
        };
    });
}
