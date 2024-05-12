// serviceWorker.js

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

function determineWorkerIndex(data) {
    const index = data.length % 4;
    return index;
}