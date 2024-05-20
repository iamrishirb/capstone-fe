import React, { useEffect, useState } from 'react';
import issues0 from '../data/issues-0.json';
import issues1 from '../data/issues-1.json';
import issues2 from '../data/issues-2.json';
import issues3 from '../data/issues-3.json';
import FilterArea from './Filter/FilterArea';
import IssueLane from './Issue/IssueLane';

const dbName = 'issueTrackerDB';
const dbVersion = 11;

const IssueTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [filters, setFilters] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [workersCompleted, setWorkersCompleted] = useState(0);
    const [teams, setTeams] = useState({});
    const [tags, setTags] = useState({});

    const onSelectFilter = (key, selected) => {
        setSelectedFilters((prevFilters) => ({
            ...prevFilters,
            [key]: selected,
        }));
    };

    const onRemoveFilter = (key) => {
        setSelectedFilters((prevFilters) => {
            const updatedFilters = { ...prevFilters };
            delete updatedFilters[key];
            return updatedFilters;
        });
    };

    useEffect(() => {
        parseAndStoreJSONFiles();
    }, []);

    const filterJSONData = (data) => {
        return data.slice(0, 200);
    };

    const parseAndStoreJSONFiles = async () => {
        const jsonDataArray = [
            filterJSONData(issues0),
            filterJSONData(issues1),
            filterJSONData(issues2),
            filterJSONData(issues3),
        ];

        const dbRequest = indexedDB.open(dbName, dbVersion);

        dbRequest.onupgradeneeded = function (event) {
            const db = event.target.result;
            for (let i = 0; i < jsonDataArray.length; i++) {
                const storeName = `issues${i}`;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            }
            if (!db.objectStoreNames.contains('teams')) {
                db.createObjectStore('teams', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('tags')) {
                db.createObjectStore('tags', { keyPath: 'id' });
            }
        };

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const allTags = {};

            for (let i = 0; i < jsonDataArray.length; i++) {
                const jsonData = jsonDataArray[i];
                const storeName = `issues${i}`;
                seedData(db, storeName, jsonData);

                // Collect tags
                jsonData.forEach(issue => {
                    const issueTags = issue.tag || [];
                    issueTags.forEach(tag => {
                        if (allTags[tag]) {
                            allTags[tag].push(issue.id);
                        } else {
                            allTags[tag] = [issue.id];
                        }
                    });
                });
            }

            setTags(allTags);
            seedTagsData(db, allTags);

            // Start the team worker
            const teamWorker = new Worker(new URL('../workers/teamWorker.js', import.meta.url));
            teamWorker.onmessage = handleTeamWorkerMessage;
            teamWorker.postMessage({ jsonDataArray });
        };

        dbRequest.onerror = function (event) {
            console.error('Error opening IndexedDB:', event.target.error);
        };
    };

    const seedData = async (db, storeName, jsonData) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            jsonData.forEach(item => {
                objectStore.put(item);
            });

            transaction.oncomplete = () => {
                // console.log(`Data successfully seeded into ${storeName}`);
                setWorkersCompleted(prevCount => prevCount + 1);
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(`Error seeding data into ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    };

    const seedTagsData = async (db, tags) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('tags', 'readwrite');
            const objectStore = transaction.objectStore('tags');

            Object.entries(tags).forEach(([tagName, tagData]) => {
                objectStore.put({ id: tagName, data: tagData });
            });

            transaction.oncomplete = () => {
                console.log('Tags data successfully seeded into IndexedDB');
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('Error seeding tags data into IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    };

    const handleTeamWorkerMessage = (event) => {
        const { teams } = event.data;

        if (teams && typeof teams === 'object' && !Array.isArray(teams)) {
            const teamsArray = Object.entries(teams).map(([teamName, teamData]) => ({
                id: teamName,
                data: teamData,
            }));
            setTeams(teamsArray);

            const seedTeamsData = async (db) => {
                const transaction = db.transaction('teams', 'readwrite');
                const objectStore = transaction.objectStore('teams');

                teamsArray.forEach(team => {
                    objectStore.put(team);
                });

                // transaction.oncomplete = function () {
                //     console.log('Teams data successfully seeded into IndexedDB');
                // };

                transaction.onerror = function (event) {
                    console.error('Error seeding teams data into IndexedDB:', event.target.error);
                };
            };

            const initializeTeamsStore = async () => {
                try {
                    const dbRequest = indexedDB.open(dbName, dbVersion);

                    dbRequest.onsuccess = async function (event) {
                        const db = event.target.result;
                        await seedTeamsData(db);
                    };

                    dbRequest.onerror = function (event) {
                        console.error('Error opening IndexedDB:', event.target.error);
                    };
                } catch (error) {
                    console.error('Error initializing IndexedDB:', error);
                }
            };

            initializeTeamsStore();
        } else {
            console.error('Received teams data is not an object:', teams);
        }
    };

    useEffect(() => {
        if (workersCompleted === 4) {
            setIsLoading(false);
            fetchDataFromIndexedDB();
        }
    }, [workersCompleted]);

    const fetchDataFromIndexedDB = async () => {
        try {
            const allIssues = [];
            const dbRequest = indexedDB.open(dbName, dbVersion);
            dbRequest.onsuccess = async function (event) {
                const db = event.target.result;
                const storeNames = ['issues0', 'issues1', 'issues2', 'issues3'];
                for (const storeName of storeNames) {
                    const transaction = db.transaction(storeName, 'readonly');
                    const objectStore = transaction.objectStore(storeName);
                    const request = objectStore.getAll();

                    request.onsuccess = (event) => {
                        allIssues.push(...event.target.result);
                    };

                    request.onerror = (event) => {
                        console.error('Error fetching data from IndexedDB:', event.target.error);
                    };

                    await transaction.complete;
                }
                setIssues(allIssues);
                setIsLoading(false);
            };

            dbRequest.onerror = function (event) {
                console.error('Error opening IndexedDB:', event.target.error);
                setIsLoading(false);
            };
        } catch (error) {
            console.error('Error fetching data from IndexedDB:', error);
            setIsLoading(false);
        }
    };

    const filterIssuesByStatus = (status) => {
        return issues.filter(issue => issue.status === status);
    };


    return (
        <div className='issue-tracker'>
            {isLoading ? (
                <div className='loading-screen'>
                    <dotlottie-player src="https://lottie.host/88c4fcc9-4a9e-47c2-b73f-4b3b5a03ef38/d1daYtUo0K.lottie"
                        background="transparent" speed="1" loop autoplay></dotlottie-player>
                </div>
            ) : (
                <>
                    <FilterArea
                        filters={filters}
                        selectedFilters={selectedFilters}
                        onSelectFilter={onSelectFilter}
                        onRemoveFilter={onRemoveFilter}
                    />
                    <div className='lane-area'>
                        <IssueLane title='To-Do' issues={filterIssuesByStatus('To Do')} />
                        <IssueLane title='In Progress' issues={filterIssuesByStatus('In Progress')} />
                        <IssueLane title='Review' issues={filterIssuesByStatus('Review')} />
                        <IssueLane title='Completed' issues={filterIssuesByStatus('Completed')} />
                    </div>
                </>
            )}
        </div>
    );
};

export default IssueTracker;
