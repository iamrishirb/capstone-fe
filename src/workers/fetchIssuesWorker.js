self.onmessage = async function (event) {
    const { type, dbName, storeNames, dbVersion } = event.data;

    if (type === 'fetchFirstTen') {
        try {
            const dbRequest = indexedDB.open(dbName, dbVersion);
            dbRequest.onsuccess = async function (event) {
                const db = event.target.result;
                const issues = await fetchFirstTenIssues(db, storeNames);
                self.postMessage({ issues });
            };

            dbRequest.onerror = function (event) {
                console.error('Error opening IndexedDB:', event.target.error);
            };
        } catch (error) {
            console.error('Error fetching first ten issues:', error);
        }
    }
};

const fetchFirstTenIssues = async (db, storeNames) => {
    const promises = storeNames.map(storeName => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onsuccess = (event) => {
                const result = event.target.result;
                resolve(result.slice(0, 10));
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    });

    const issues = await Promise.all(promises);
    return issues.flat();
};