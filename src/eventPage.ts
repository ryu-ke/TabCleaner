function loadActiveLog(): {} {
    return JSON.parse(window.localStorage.getItem('active_log') || "{}");
}

function saveActiveLog(log: {}) {
    window.localStorage.setItem('active_log', JSON.stringify(log))
}

function getNowTimestamp(): number {
    const date = new Date();
    return Math.floor(date.getTime() / 1000);
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
    var log = loadActiveLog();
    log[activeInfo.tabId] = getNowTimestamp();
    console.log(JSON.stringify(log));
    saveActiveLog(log);
})