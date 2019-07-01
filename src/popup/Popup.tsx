import * as React from 'react';
import './Popup.scss';
import { ListItemText, List, ListItem, ListSubheader, Avatar, Paper, Typography } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import HistoryIcon from '@material-ui/icons/History';

enum StoreKeys {
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

interface AppProps {}

interface AppState {
    archivedTabLogs: TabLog[],
}

export default class Popup extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {archivedTabLogs: []};
    }

    componentDidMount() {
        var react = this
        chrome.storage.local.get(StoreKeys.ArchivedTabLogs, function(data: {[key: string]: any;}) {
            var archivedTabLogs: TabLog[] = data[StoreKeys.ArchivedTabLogs] || [];
            react.setState({archivedTabLogs: archivedTabLogs.reverse()});
        });
    }

    handleClick(tabLog: TabLog) {
        chrome.tabs.create({url: tabLog.url})
    }

    nowTimestamp(): number {
        const date = new Date();
        return Math.floor(date.getTime() / 1000);    
    }

    formatTimestamp(timestamp: number): string {
        const seconds = this.nowTimestamp() - timestamp;
        if (seconds < 60) {
            return `${seconds}秒前`;
        } else if (seconds < 60 * 60) {
            return `${Math.floor(seconds / 60)}分前`;
        } else if (seconds < 60 * 60 * 24) {
            return `${Math.floor(seconds / (60 * 60))}時間前`;
        } else if (seconds < 60 * 60 * 24 * 4) {
            return `${Math.floor(seconds / (60 * 60 * 24))}日前`;
        } else {
            return new Date(timestamp * 1000).toDateString();
        }
    }

    render() {
        return (
            <Paper>
                {/* <SettingsIcon></SettingsIcon>
                <HistoryIcon></HistoryIcon> */}
                <List component="nav">
                {
                    this.state.archivedTabLogs.map((tabLog) => {
                        return (
                            <ListItem button onClick={() => {this.handleClick(tabLog)}}>
                                <Avatar src={tabLog.iconUrl} />
                                <ListItemText 
                                    primary={tabLog.title} 
                                    secondary={this.formatTimestamp(tabLog.removedAt)}
                                />
                            </ListItem>
                        );                     
                    })
                }
                </List>
            </Paper>
        );
    }
}
