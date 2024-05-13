// issueTrackerWorker.js
onmessage = async function (event) {
    const { action, data } = event.data;
    switch (action) {
        case 'performTask':
            try {
                const result = await performTask(data);
                postMessage({ action: 'taskCompleted', result });
            } catch (error) {
                console.error('Error performing task:', error);
                postMessage({ action: 'taskFailed', error: error.message });
            }
            break;
        default:
            console.error('Unsupported action:', action);
    }
};

async function performTask(data) {
    const { pageNumber, pageSize } = data;
    const results = [];

    const dbName = 'issueTrackerDB';
    const objectStoreNamePrefix = 'issues';
    const pageSizePerDataset = pageSize / 4;
    const startOffset = (pageNumber - 1) * pageSizePerDataset;

    // Perform querying for each object store
    for (let i = 0; i < 4; i++) {
        const objectStoreName = `${objectStoreNamePrefix}${i}`;
        const objectStoreData = await queryIssuesFromIndexedDB(dbName, objectStoreName, pageSizePerDataset);
        results.push(...objectStoreData);
    }

    // Return the sliced results based on pageNumber and pageSize
    return results.slice(startOffset, startOffset + pageSizePerDataset);
}

async function queryIssuesFromIndexedDB(dbName, objectStoreName, pageSize) {
    return new Promise((resolve, reject) => {
        const openDBRequest = indexedDB.open(dbName, 1);

        openDBRequest.onerror = (event) => {
            reject(new Error('Error opening IndexedDB: ' + event.target.error));
        };

        openDBRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([objectStoreName], 'readonly');
            const objectStore = transaction.objectStore(objectStoreName);

            const results = [];
            const request = objectStore.openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results.slice(0, pageSize));
                }
            };

            request.onerror = (event) => {
                reject(new Error('Error querying data from IndexedDB: ' + event.target.error));
            };
        };

        openDBRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(objectStoreName)) {
                db.createObjectStore(objectStoreName, { keyPath: 'id' });
            }
        };
    });
}
