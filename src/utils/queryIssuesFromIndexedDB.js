export const queryIssuesFromIndexedDB = (pageNumber, pageSize) => {
    return new Promise((resolve, reject) => {
        const dbName = 'issueTrackerDB';
        const objectStoreNamePrefix = 'issues';
        const pageSizePerDataset = pageSize / 4;
        const startOffset = (pageNumber - 1) * pageSizePerDataset;

        const openDBRequest = indexedDB.open(dbName, 1);

        openDBRequest.onerror = (event) => {
            reject(new Error('Error opening IndexedDB: ' + event.target.error));
        };

        openDBRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            for (let i = 0; i < 4; i++) {
                const objectStoreName = `${objectStoreNamePrefix}${i}`;
                if (!db.objectStoreNames.contains(objectStoreName)) {
                    db.createObjectStore(objectStoreName, { keyPath: 'id' });
                }
            }
        };

        openDBRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([`${objectStoreNamePrefix}0`, `${objectStoreNamePrefix}1`, `${objectStoreNamePrefix}2`, `${objectStoreNamePrefix}3`], 'readonly');

            const results = [];

            const addResults = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results.slice(startOffset, startOffset + pageSizePerDataset));
                }
            };

            const addError = (event) => {
                reject(new Error('Error fetching data from IndexedDB: ' + event.target.error));
            };

            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = addError;

            // Query each object store
            for (let i = 0; i < 4; i++) {
                const objectStoreName = `${objectStoreNamePrefix}${i}`;
                const objectStore = transaction.objectStore(objectStoreName);
                const request = objectStore.openCursor();
                request.onsuccess = addResults;
                request.onerror = addError;
            }
        };
    });
};