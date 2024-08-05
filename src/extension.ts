import vscode from "vscode";

import { createWebViewPanel } from "./helpers";
import {
  OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND,
  REFRESH_DASHBOARD_WEBVIEW_COMMAND,
  WEBVIEW_ID,
} from "./constants";

import { globalCache, refreshGcpConfigurations } from "./global-cache";

import { GcpConfigStatusBarItemManager } from "./gcp-config-status";
import { WebviewManager } from "./webview/webview-manager";

export const activate = async (context: vscode.ExtensionContext) => {
  /**
   * Refresh gcp configurations and clear unused cache
   * This is necessary to keep the gcp configurations in sync
   * with the global cache .
   */
  await refreshGcpConfigurations(context);
  globalCache(context).clearUnusedCache();

  /**
   * Initialize and set up the GcpConfigStatusBarItemManager instance.
   * This will create a status bar item and associate it with the provided context.
   * The status bar item will display the active gcp configuration name.
   * The status bar item will be disposed when the context is disposed.
   */
  GcpConfigStatusBarItemManager.getInstance(context).initialize();

  const webviewManager = new WebviewManager(context);

  // Create and Register dashboard webview panel command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND,
      () => {
        const dashboardPanel = createWebViewPanel(context);
        webviewManager.setPanelView(dashboardPanel);
      }
    )
  );

  // Create and Register dashboard webview provider for the activity bar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WEBVIEW_ID, {
      resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewManager.setActivityBarView(webviewView);
      },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(REFRESH_DASHBOARD_WEBVIEW_COMMAND, () => {
      webviewManager.updateWebviews();
    })
  );
};

export const deactivate = async () => {
  // Dispose the GcpConfigStatusBarItemManager instance
  // This will dispose the status bar item associated with the instance.
  GcpConfigStatusBarItemManager.getInstance(
    undefined as unknown as vscode.ExtensionContext
  ).dispose();
};
