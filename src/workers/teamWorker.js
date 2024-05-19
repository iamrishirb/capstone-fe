// teamWorker.js
self.onmessage = function (event) {
    const { jsonDataArray } = event.data;
    const teams = {};

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

    self.postMessage({ teams });
};
