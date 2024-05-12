import React, { useEffect, useState } from 'react';
import issues0 from '../data/issues-0.json';
import issues1 from '../data/issues-1.json';
import issues2 from '../data/issues-2.json';
import issues3 from '../data/issues-3.json';

const IssueTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const issueTrackerWorker = new Worker('serviceWorker.js');

    useEffect(() => {
        parseAndStoreJSONFiles();
    }, []);

    const parseAndStoreJSONFiles = async () => {
        try {
            const request = indexedDB.open('issueTrackerDB', 1);
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                createObjectStore(db, 'issues0');
                createObjectStore(db, 'issues1');
                createObjectStore(db, 'issues2');
                createObjectStore(db, 'issues3');
            };

            request.onsuccess = function (event) {
                const db = event.target.result;
                parseAndStoreJSON(db, 'issues0', issues0);
                parseAndStoreJSON(db, 'issues1', issues1);
                parseAndStoreJSON(db, 'issues2', issues2);
                parseAndStoreJSON(db, 'issues3', issues3);
                setIsLoading(false);
            };

            request.onerror = function (event) {
                console.error('Error opening IndexedDB:', event.target.error);
                setIsLoading(false);
            };
        } catch (error) {
            console.error('Error parsing JSON files or storing data in IndexedDB:', error);
            setIsLoading(false);
        }
    };

    const createObjectStore = (db, storeName) => {
        const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('priority', 'priority', { unique: false });
        objectStore.createIndex('team', 'team', { unique: false });
        objectStore.createIndex('tag', 'tag', { unique: false });
    };

    const parseAndStoreJSON = (db, storeName, jsonData) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        jsonData.forEach(issue => {
            objectStore.add(issue);
        });
        transaction.oncomplete = function () {
            console.log(`Data stored in IndexedDB (${storeName}) successfully`);
        };
        transaction.onerror = function (event) {
            console.error(`Error storing data in IndexedDB (${storeName}):`, event.target.error);
        };
    };

    const queryIssuesFromIndexedDB = (pageNumber, pageSize) => {
        console.log(`Querying issues from IndexedDB for page ${pageNumber} with pageSize ${pageSize}`);
        // Implement query logic here
    };

    const filterIssues = (filters) => {
        console.log('Filtering issues based on provided filters:', filters);
        // Implement filter logic here
    };

    function performTask(data) {
        issueTrackerWorker.postMessage({ action: 'performTask', data });
    }

    issueTrackerWorker.onmessage = (event) => {
        const { action, result } = event.data;
        switch (action) {
            case 'taskCompleted':
                console.log(result)
                break;
            default:
                console.error('Unsupported action:', action);
        }
    };

    // Example usage
    performTask(someData);

    return (
        <div>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <p>Data stored in IndexedDB successfully</p>
            )}
        </div>
    );
};

export default IssueTracker;
