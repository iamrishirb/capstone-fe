self.onmessage = async function (event) {
    const { jsonDataArray } = event.data;
    const teams = {};

    // Process the JSON data to organize teams
    jsonDataArray.forEach((jsonData) => {
        jsonData.forEach((issue) => {
            const teamName = issue.team;
            if (teams[teamName]) {
                teams[teamName].push(issue.id);
            } else {
                teams[teamName] = [issue.id];
            }
        });
    });

    const dbName = 'issueTrackerDB';
    const dbVersion = 11;

    // Open or upgrade the database
    const openDb = (version) => {
        return new Promise((resolve, reject) => {
            const dbRequest = indexedDB.open(dbName, version);

            dbRequest.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('teams')) {
                    db.createObjectStore('teams', { keyPath: 'id' });
                }
            };

            dbRequest.onsuccess = function (event) {
                resolve(event.target.result);
            };

            dbRequest.onerror = function (event) {
                reject(event.target.error);
            };
        });
    };

    // Seed teams data into the IndexedDB
    const seedTeamsData = async (db) => {
        const transaction = db.transaction('teams', 'readwrite');
        const objectStore = transaction.objectStore('teams');

        Object.entries(teams).forEach(([teamName, teamData]) => {
            objectStore.put({ id: teamName, data: teamData });
        });

        transaction.oncomplete = function () {
            console.log('Teams data successfully seeded into IndexedDB');
        };

        transaction.onerror = function (event) {
            console.error('Error seeding teams data into IndexedDB:', event.target.error);
        };
    };

    try {
        const initialDbRequest = indexedDB.open(dbName);
        initialDbRequest.onsuccess = async function (event) {
            const db = event.target.result;
            const currentVersion = db.version;
            db.close();

            const dbInstance = await openDb(currentVersion < dbVersion ? dbVersion : currentVersion);
            await seedTeamsData(dbInstance);
        };

        initialDbRequest.onerror = function (event) {
            console.error('Error opening IndexedDB:', event.target.error);
        };
    } catch (error) {
        console.error('Error initializing IndexedDB:', error);
    }

    self.postMessage({ teams });
};
