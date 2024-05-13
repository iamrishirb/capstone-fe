/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'capstone-fe-v1';
const urlsToCache = [
    '/',
    '/styles/main.css',
    '/script/main.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});


self.addEventListener('message', async (event) => {
    const { action, data } = event.data;
    switch (action) {
        case 'performTask':
            const workerIndex = determineWorkerIndex(data);
            const worker = new Worker(`worker${workerIndex}.js`);
            worker.postMessage({ action, data });
            worker.onmessage = (messageEvent) => {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage(messageEvent.data);
                    });
                });
            };
            break;
        default:
            console.error('Unsupported action:', action);
    }
});

/* eslint-enable no-restricted-globals */

function determineWorkerIndex(data) {
    const index = data.length % 4;
    return index;
}
