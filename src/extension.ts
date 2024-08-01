import vscode from "vscode";

import { createWebViewPanel } from "./helpers";
import { OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND, WEBVIEW_ID } from "./constants";

import { globalCache, refreshGcpConfigurations } from "./global-cache";
import { renderDashbordWebview } from "./webview/dashboard";
import { gcpConfigurationStatusBarItem } from "./gcp-config-status";

export const activate = async (extensionContext: vscode.ExtensionContext) => {
  await refreshGcpConfigurations(extensionContext);
  globalCache(extensionContext).clearUnusedCache();

  const activeGcpConfiguration =
    globalCache(extensionContext).getActiveGcpConfiguration();

  extensionContext.subscriptions.push(
    gcpConfigurationStatusBarItem.create({
      configName: activeGcpConfiguration?.name,
    })
  );

  // Create and Register dashboard webview panel command
  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(
      OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND,
      () => {
        const dashboardPanel = createWebViewPanel(extensionContext);
        return renderDashbordWebview(extensionContext, dashboardPanel.webview);
      }
    )
  );

  // Create and Register dashboard webview provider for the activity bar
  extensionContext.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WEBVIEW_ID, {
      resolveWebviewView(webviewView: vscode.WebviewView) {
        renderDashbordWebview(extensionContext, webviewView.webview);
        webviewView.webview.options = {
          enableScripts: true,
          enableCommandUris: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionContext.extensionUri, "assets"),
            vscode.Uri.joinPath(extensionContext.extensionUri, "node_modules"),
          ],
        };
      },
    })
  );
};

export const deactivate = async () => {};
