enum StoreKeys {
    TabLogDict = "tab_log_dict",
    ActiveTabId = "active_tab_id",
    ArchivedTabLogs = "archived_tab_logs",
}

interface TabLog {
    tabId: number,
    duration: number,
    title: string,
    url: string,
    iconUrl: string,
    lastActivatedAt: number,
    removedAt: number,
}

function emptyTabLog(tabId: number): TabLog {
    return {
        tabId: tabId,
        duration: 0,
        title: "",
        url: "",
        iconUrl: "",
        lastActivatedAt: null,
        removedAt: null,
    };
}

function nowTimestamp(): number {
    const date = new Date();
    return Math.floor(date.getTime() / 1000);    
}

chrome.tabs.onActivated.addListener(function(activeInfo: chrome.tabs.TabActiveInfo) {
    var tabLogDict: {[key: number]: TabLog;} = JSON.parse(window.sessionStorage.getItem(StoreKeys.TabLogDict) || "{}");
    const oldTabId = Number(window.sessionStorage.getItem(StoreKeys.ActiveTabId));
    const newTabId = activeInfo.tabId;
    const now = nowTimestamp();

    if(oldTabId) {
        var oldTabLog = tabLogDict[oldTabId] || emptyTabLog(oldTabId);
        oldTabLog.duration += now - (oldTabLog.lastActivatedAt || now);
        oldTabLog.lastActivatedAt = now;
        tabLogDict[oldTabId] = oldTabLog;    
    }

    var newTabLog = tabLogDict[newTabId] || emptyTabLog(newTabId);
    newTabLog.lastActivatedAt = now;
    tabLogDict[newTabId] = newTabLog;    

    window.sessionStorage.setItem(StoreKeys.TabLogDict, JSON.stringify(tabLogDict));
    window.sessionStorage.setItem(StoreKeys.ActiveTabId, String(newTabId));

    console.log(tabLogDict);
    chrome.storage.local.get(StoreKeys.ArchivedTabLogs, function(archivedTabLogs: TabLog[]) {
        console.log(archivedTabLogs);
    });
});

chrome.alarms.create("check", { "periodInMinutes": 1 });

chrome.alarms.onAlarm.addListener(function (alarm) {
    chrome.tabs.query({}, function(tabs: chrome.tabs.Tab[]) {
        const tabIds = tabs.map(function(tab: chrome.tabs.Tab): number {
            return tab.id
        });

        const tabLogDict: {[key: number]: TabLog;} = JSON.parse(window.sessionStorage.getItem(StoreKeys.TabLogDict) || "{}");
        const now = nowTimestamp();

        return tabIds.forEach(function(tabId: number) {
            const unusedSeconds = tabLogDict[tabId] ? now - (tabLogDict[tabId].lastActivatedAt || now) : 0;
            
            if (unusedSeconds >= 5 * 60) {
                onTabRemoved(tabId);
                // chrome.tabs.remove(tabId);
            }
        });
    });
});

chrome.tabs.onRemoved.addListener(function(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    onTabRemoved(tabId);
});

chrome.tabs.onUpdated.addListener(function(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    const tabLogDict: {[key: number]: TabLog;} = JSON.parse(window.sessionStorage.getItem(StoreKeys.TabLogDict) || "{}");
    var tabLog = tabLogDict[tabId] || emptyTabLog(tabId);

    tabLog.title = tab.title;
    tabLog.url = tab.url;
    tabLog.iconUrl = tab.favIconUrl;
    tabLogDict[tabId] = tabLog;

    window.sessionStorage.setItem(StoreKeys.TabLogDict, JSON.stringify(tabLogDict));
});

function onTabRemoved(tabId: number) {
    var tabLogDict: {[key: number]: TabLog;} = JSON.parse(window.sessionStorage.getItem(StoreKeys.TabLogDict) || "{}");
    var tabLog = tabLogDict[tabId] || emptyTabLog(tabId);

    const now = nowTimestamp();
    tabLog.removedAt = now;

    const activeTabId = Number(window.sessionStorage.getItem(StoreKeys.ActiveTabId));
    if(tabId == activeTabId) {
        tabLog.duration += now - tabLog.lastActivatedAt
        tabLog.lastActivatedAt = now
        window.sessionStorage.removeItem(StoreKeys.ActiveTabId);
    }

    chrome.storage.local.get(StoreKeys.ArchivedTabLogs, function(data: {[key: string]: any;}) {
        var archivedTabLogs: TabLog[] = data[StoreKeys.ArchivedTabLogs] || [];
        archivedTabLogs.push(tabLog);

        data[StoreKeys.ArchivedTabLogs] = archivedTabLogs;
        chrome.storage.local.set(data);
    })

    delete tabLogDict[tabId];
    window.sessionStorage.setItem(StoreKeys.TabLogDict, JSON.stringify(tabLogDict));
}