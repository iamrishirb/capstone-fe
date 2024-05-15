import React, { useEffect, useState } from 'react';
import issues0 from '../data/issues-0.json';
import issues1 from '../data/issues-1.json';
import issues2 from '../data/issues-2.json';
import issues3 from '../data/issues-3.json';
import { queryIssuesFromIndexedDB } from '../utils/queryIssuesFromIndexedDB';

const IssueTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const issueTrackerWorker = new Worker('issueTrackerWorker.js');

    useEffect(() => {
        parseAndStoreJSONFiles();
    }, []);

    const parseAndStoreJSONFiles = async () => {
        try {
            const request = indexedDB.open('issueTrackerDB', 1);

            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                createObjectStores(db);
            };

            request.onsuccess = function (event) {
                const db = event.target.result;
                storeData(db, issues0, 'issues0');
                storeData(db, issues1, 'issues1');
                storeData(db, issues2, 'issues2');
                storeData(db, issues3, 'issues3');
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

    const storeData = (db, jsonData, storeName) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            transaction.oncomplete = () => {
                console.log(`Data stored in IndexedDB (${storeName}) successfully`);
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(`Error storing data in IndexedDB (${storeName}):`, event.target.error);
                reject(event.target.error);
            };

            jsonData.forEach(issue => {
                const addRequest = objectStore.add(issue);
                addRequest.onerror = (event) => {
                    console.error(`Error adding data to IndexedDB (${storeName}):`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    };

    const createObjectStores = (db) => {
        try {
            for (let i = 0; i < 4; i++) {
                const storeName = `issues${i}`;
                const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
                objectStore.createIndex('title', 'title', { unique: false });
                objectStore.createIndex('status', 'status', { unique: false });
                // Add more indexes as needed
            }
        } catch (error) {
            console.error('Error creating object stores:', error);
        }
    };

    useEffect(() => {
        const fetchDataFromIndexedDB = async () => {
            try {
                const issues = await queryIssuesFromIndexedDB(pageNumber, pageSize);
                console.log('Fetched issues:', issues);
                setIssues(issues);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data from IndexedDB:', error);
                setIsLoading(false);
            }
        };

        fetchDataFromIndexedDB();
    }, [pageNumber, pageSize]);

    useEffect(() => {
        const data = { pageNumber, pageSize };
        performTask(data);
    }, [pageNumber, pageSize]);

    const performTask = (data) => {
        issueTrackerWorker.postMessage({ action: 'performTask', data });
    };

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
