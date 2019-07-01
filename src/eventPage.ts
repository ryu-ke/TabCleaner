enum StoreKeys {
    ActiveLog = "active_log",
    ActiveTabId = "active_tab_id",
}

function nowTimestamp(): number {
    const date = new Date();
    return Math.floor(date.getTime() / 1000);    
}

chrome.tabs.onActivated.addListener(function(activeInfo: chrome.tabs.TabActiveInfo): void {
    var activeLog = JSON.parse(window.localStorage.getItem(StoreKeys.ActiveLog) || "{}");
    const oldTabId = Number(window.localStorage.getItem(StoreKeys.ActiveTabId));
    const newTabId = activeInfo.tabId;
    const now = nowTimestamp();

    activeLog[oldTabId] = now;
    activeLog[newTabId] = now;

    window.localStorage.setItem(StoreKeys.ActiveLog, JSON.stringify(activeLog));
    window.localStorage.setItem(StoreKeys.ActiveTabId, String(newTabId));
});

chrome.alarms.create("check", { "periodInMinutes": 1 });

chrome.alarms.onAlarm.addListener(function (alarm) {
    chrome.tabs.query({}, function(tabs: chrome.tabs.Tab[]): void {
        const tabIds = tabs.map(function(tab: chrome.tabs.Tab): number {
            return tab.id
        });

        const activeLog = JSON.parse(window.localStorage.getItem(StoreKeys.ActiveLog) || "{}");

        return tabIds.forEach(function(tabId: number) {
            const now = nowTimestamp();
            const unusedSeconds = now - (activeLog[tabId] || now);

            console.log(`${tabId}: ${unusedSeconds}`);

            // if (unusedSeconds >= 5 * 60) {
            //     chrome.tabs.remove(tabId);
            // }
        });
    });
});