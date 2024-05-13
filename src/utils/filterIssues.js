
export const filterIssues = (filters) => {

    return new Promise((resolve, reject) => {
        const dbName = 'issueTrackerDB';
        const objectStoreNamePrefix = 'issues';
        const openDBRequest = indexedDB.open(dbName, 1);
        const results = [];

        openDBRequest.onerror = (event) => {
            reject(new Error('Error opening IndexedDB: ' + event.target.error));
        };

        openDBRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([`${objectStoreNamePrefix}0`, `${objectStoreNamePrefix}1`, `${objectStoreNamePrefix}2`, `${objectStoreNamePrefix}3`], 'readonly');

            const addResults = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const issue = cursor.value;
                    let isMatch = true;
                    // Check if the issue matches all filters
                    Object.entries(filters).forEach(([key, value]) => {
                        if (issue[key] !== value) {
                            isMatch = false;
                        }
                    });
                    if (isMatch) {
                        results.push(issue);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
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
