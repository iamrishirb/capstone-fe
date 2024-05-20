self.onmessage = async function (event) {
    const { jsonDataArray } = event.data;
    const tags = {};

    // Process the JSON data to organize tags
    jsonDataArray.forEach((jsonData) => {
        jsonData.forEach((issue) => {
            const issueTags = issue.tag || [];
            issueTags.forEach((tag) => {
                if (tags[tag]) {
                    tags[tag].push(issue.id);
                } else {
                    tags[tag] = [issue.id];
                }
            });
        });
    });

    const dbName = 'issueTrackerDB';
    const dbVersion = 11;

    // Open or upgrade the database
    const openDb = () => {
        return new Promise((resolve, reject) => {
            const dbRequest = indexedDB.open(dbName, dbVersion);

            dbRequest.onupgradeneeded = function (event) {
                console.log('onupgradeneeded called');
                const db = event.target.result;
                if (!db.objectStoreNames.contains('tags')) {
                    console.log('Creating tags object store');
                    db.createObjectStore('tags', { keyPath: 'id' });
                }
            };

            dbRequest.onsuccess = function (event) {
                console.log('Database opened successfully');
                resolve(event.target.result);
            };

            dbRequest.onerror = function (event) {
                console.error('Error opening database', event.target.error);
                reject(event.target.error);
            };
        });
    };

    // Seed tags data into the IndexedDB
    const seedTagsData = async (db) => {
        console.log('Seeding tags data into IndexedDB');
        const transaction = db.transaction('tags', 'readwrite');
        const objectStore = transaction.objectStore('tags');

        Object.entries(tags).forEach(([tagName, tagData]) => {
            objectStore.put({ id: tagName, data: tagData });
        });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = function () {
                console.log('Tags data successfully seeded into IndexedDB');
                resolve();
            };

            transaction.onerror = function (event) {
                console.error('Error seeding tags data into IndexedDB', event.target.error);
                reject(event.target.error);
            };
        });
    };

    try {
        console.log('Opening database with version', dbVersion);
        const db = await openDb();
        await seedTagsData(db);
        self.postMessage({ tags });
    } catch (error) {
        console.error('Error initializing IndexedDB:', error);
    }
};
