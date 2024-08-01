import vscode from "vscode";
import { OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND } from "./constants";

type State = {
  configName?: string;
};

type GcpConfigurationStatusBar = {
  create: ({ configName }?: State) => vscode.StatusBarItem;
  update: ({ configName }?: State) => void;
  show: () => void;
  hide: () => void;
  setPending: (pending?: boolean) => void;
};

const gcpConfigurationStatusBarManager = () => {
  let statusBarItem: vscode.StatusBarItem;
  const state: State = {
    configName: "",
  };

  const text = () => `$(cloud) | $(check)${state.configName?.slice(0, 15)}`;
  const tooltip = () => `Open GCP Config Switch \n Active: ${state.configName}`;
  const pendingText = () => `$(cloud) | $(sync~spin) Switching...`;
  const updateConfigName = (configName: State["configName"] = "") => {
    state.configName = configName ?? "";
  };

  const gcpConfigurationStatusBarItem: GcpConfigurationStatusBar = {
    create: ({ configName } = state) => {
      updateConfigName(configName);

      statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
      );
      statusBarItem.command = OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND;
      statusBarItem.text = text();
      statusBarItem.tooltip = tooltip();
      gcpConfigurationStatusBarItem.show();
      return statusBarItem;
    },
    show: () => {
      statusBarItem.show();
    },
    update: ({ configName } = state) => {
      updateConfigName(configName);

      statusBarItem.text = text();
      statusBarItem.tooltip = tooltip();
    },
    hide: () => {
      statusBarItem.hide();
    },
    setPending: (pending = true) => {
      if (pending) {
        statusBarItem.text = pendingText();
        return;
      }

      statusBarItem.text = text();
    },
  };

  return gcpConfigurationStatusBarItem;
};

export const gcpConfigurationStatusBarItem = gcpConfigurationStatusBarManager();
