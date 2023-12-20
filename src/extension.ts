import vscode from "vscode";

import {
  getGcpConfigurations,
  configNameToTitle,
  activateConfig,
  setAccount,
  setADC,
  updateJsonFile,
} from "./helpers";
import {
  APP_NAME,
  GCP_SWITCH_COMMAND,
  APPLICATION_DEFAULT_CREDENTIALS_FILE_PATH,
  CACHE_VERSION,
} from "./constants";
import {
  APPLICATION_DEFAULT_CREDENTIAL,
  GCP_CONFIGURATION,
  GLOBAL_CACHE,
} from "./model";
import { dashboardView } from "./views/dashboard";

let webViewPanel: vscode.WebviewPanel;
let globalContext: vscode.ExtensionContext;

export const activate = async (extentionContext: vscode.ExtensionContext) => {
  globalContext = extentionContext;

  await refreshGcpConfigurations(extentionContext);

  let disposable = vscode.commands.registerCommand(
    GCP_SWITCH_COMMAND,
    function () {
      webViewPanel = vscode.window.createWebviewPanel(
        APP_NAME,
        "GCP Switch Config",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      webViewPanel.iconPath = {
        dark: vscode.Uri.joinPath(extentionContext.extensionUri, "image.svg"),
        light: vscode.Uri.joinPath(extentionContext.extensionUri, "image.svg"),
      };

      webViewPanel.webview.html = dashboardView({
        webview: webViewPanel.webview,
        extensionUri: extentionContext.extensionUri,
        gcpConfigurations:
          globalCache(extentionContext).get("GCP_CONFIGURATIONS"),
      });

      webViewPanel.webview.onDidReceiveMessage(
        async ({ gcpConfigIndex }) => {
          const gcpConfig =
            globalCache(extentionContext).get("GCP_CONFIGURATIONS")[
              gcpConfigIndex
            ];

          switchGcpConfig(gcpConfig, extentionContext);
        },
        undefined,
        extentionContext.subscriptions
      );
    }
  );

  const gcpSwitchStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    1
  );
  gcpSwitchStatusBarItem.command = GCP_SWITCH_COMMAND;
  gcpSwitchStatusBarItem.text = `$(cloud) ${APP_NAME}`;
  gcpSwitchStatusBarItem.tooltip = "Switch to another GCP project";
  gcpSwitchStatusBarItem.show();
  extentionContext.subscriptions.push(gcpSwitchStatusBarItem);

  extentionContext.subscriptions.push(disposable);
};

export const deactivate = async () => {};

const switchGcpConfig = (
  gcpConfig: GCP_CONFIGURATION,
  extentionContext: vscode.ExtensionContext
) => {
  vscode.window.showInformationMessage(
    `Start switching gcp config to: ${configNameToTitle(gcpConfig.name)}`
  );

  activateConfig({ gcpConfig })
    .then(() => {
      setAccount({ gcpConfig })
        .then(async () => {
          const message = `GCP config switched successfully to: ${configNameToTitle(
            gcpConfig.name
          )}`;

          const ADC = globalCache(extentionContext).getGcpConfigADC(gcpConfig);
          if (ADC) {
            updateJsonFile(APPLICATION_DEFAULT_CREDENTIALS_FILE_PATH, ADC);
            const gcpConfigurations = await refreshGcpConfigurations(
              extentionContext
            );
            webViewPanel.webview.html = dashboardView({
              webview: webViewPanel.webview,
              extensionUri: globalContext.extensionUri,
              gcpConfigurations,
            });
            vscode.window.showInformationMessage(message);
            return;
          }

          setADC()
            .then(async (ADC) => {
              const gcpConfigurations = await refreshGcpConfigurations(
                extentionContext
              );
              webViewPanel.webview.html = dashboardView({
                webview: webViewPanel.webview,
                extensionUri: globalContext.extensionUri,
                gcpConfigurations,
              });
              vscode.window.showInformationMessage(message);
              globalCache(extentionContext).addGcpConfigADC(gcpConfig, ADC);
            })
            .catch(vscode.window.showErrorMessage);
        })
        .catch(vscode.window.showErrorMessage);
    })
    .catch(vscode.window.showErrorMessage);
};

const refreshGcpConfigurations = async (
  extentionContext: vscode.ExtensionContext
) => {
  const gcpConfigurations = await getGcpConfigurations();

  if (!gcpConfigurations) {
    return [];
  }

  globalCache(extentionContext).setGcpConfigurations(gcpConfigurations);

  return gcpConfigurations;
};

const globalCache = <TValue>(extentionContext: vscode.ExtensionContext) => {
  const cache = extentionContext.globalState.get<GLOBAL_CACHE>(CACHE_VERSION, {
    ADCs: {},
    GCP_CONFIGURATIONS: [],
  });

  return {
    get: <TKey extends keyof GLOBAL_CACHE>(key: TKey): GLOBAL_CACHE[TKey] => {
      return cache[key] as GLOBAL_CACHE[TKey];
    },
    getGcpConfigADC: (gcpConfig: GCP_CONFIGURATION) => {
      return cache["ADCs"][gcpConfig.name];
    },
    addGcpConfigADC: (
      gcpConfig: GCP_CONFIGURATION,
      ADC: APPLICATION_DEFAULT_CREDENTIAL
    ) => {
      cache["ADCs"][gcpConfig.name] = ADC;
      extentionContext.globalState.update(CACHE_VERSION, cache);
    },

    setGcpConfigurations: (gcpConfigurations: GCP_CONFIGURATION[]) => {
      cache["GCP_CONFIGURATIONS"] = gcpConfigurations;
      extentionContext.globalState.update(CACHE_VERSION, cache);
    },
  };
};