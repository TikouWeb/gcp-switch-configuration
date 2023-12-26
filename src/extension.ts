import vscode from "vscode";

import {
  getGcpConfigurations,
  configNameToTitle,
  activateConfig,
  setAccount,
  setADC,
  updateJsonFile,
  createOsAbsolutePath,
  createWebViewPanel,
  createConfig,
} from "./helpers";
import {
  APP_NAME,
  GCP_SWITCH_COMMAND,
  ADC_FILE_PATH,
  CACHE_VERSION,
  WEBVIEW_COMMAND,
} from "./constants";
import {
  ACTIVITY,
  APPLICATION_DEFAULT_CREDENTIAL,
  GCP_CONFIGURATION,
  GLOBAL_CACHE,
  NEW_CONFIG_FORM,
} from "./types";

import { dashboardView } from "./views/dashboard";
import { newGcpConfigView } from "./views/new-gcp-config";

export const activate = async (extensionContext: vscode.ExtensionContext) => {
  await refreshGcpConfigurations(extensionContext);

  let disposable = vscode.commands.registerCommand(GCP_SWITCH_COMMAND, () =>
    openDashboardPanel(extensionContext)
  );
  extensionContext.subscriptions.push(disposable);

  addStatusBarItem(extensionContext);
};

export const deactivate = async () => {};

const addStatusBarItem = (extensionContext: vscode.ExtensionContext) => {
  const gcpSwitchStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );
  gcpSwitchStatusBarItem.command = GCP_SWITCH_COMMAND;
  gcpSwitchStatusBarItem.text = `$(cloud) ${APP_NAME}`;
  gcpSwitchStatusBarItem.tooltip = "Switch to another GCP project";
  gcpSwitchStatusBarItem.show();
  extensionContext.subscriptions.push(gcpSwitchStatusBarItem);
};

const openDashboardPanel = (extensionContext: vscode.ExtensionContext) => {
  const dashboardPanel = createWebViewPanel(extensionContext);
  dashboardPanel.webview.html = dashboardView({
    extensionContext,
    panel: dashboardPanel,
    gcpConfigurations: globalCache(extensionContext).get("GCP_CONFIGURATIONS"),
  });

  dashboardPanel.webview.onDidReceiveMessage(
    async ({ gcpConfigIndex, command }) => {
      if (command === WEBVIEW_COMMAND.switch_config) {
        dashboardPanel.webview.postMessage({ command: "start_loading" });
        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];
        switchGcpConfig(extensionContext, dashboardPanel, {
          name: gcpConfig.name,
          account: gcpConfig.properties.core.account,
        });
        return;
      }

      if (command === WEBVIEW_COMMAND.open_adc_file) {
        openADCFile();
        return;
      }

      if (command === WEBVIEW_COMMAND.open_add_config_panel) {
        openAddConfigPanel(extensionContext, dashboardPanel);
        return;
      }
    },
    undefined,
    extensionContext.subscriptions
  );
};

const switchGcpConfig = (
  extensionContext: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  gcpConfig: {
    name: GCP_CONFIGURATION["name"];
    account: GCP_CONFIGURATION["properties"]["core"]["account"];
  }
) => {
  activateConfig(gcpConfig.name)
    .then(() => {
      setAccount(gcpConfig.account)
        .then(async () => {
          const message = `GCP config switched successfully to: ${configNameToTitle(
            gcpConfig.name
          )}`;

          const ADC = globalCache(extensionContext).getGcpConfigADC(
            gcpConfig.name
          );
          if (ADC) {
            updateJsonFile(ADC_FILE_PATH, ADC);
            const gcpConfigurations = await refreshGcpConfigurations(
              extensionContext
            );
            panel.webview.html = dashboardView({
              extensionContext,
              panel,
              gcpConfigurations,
            });
            vscode.window.showInformationMessage(message);
            return;
          }

          setADC()
            .then(async (ADC) => {
              const gcpConfigurations = await refreshGcpConfigurations(
                extensionContext
              );
              panel.webview.html = dashboardView({
                extensionContext,
                panel,
                gcpConfigurations,
              });

              vscode.window.showInformationMessage(message);
              globalCache(extensionContext).addGcpConfigADC(
                gcpConfig.name,
                ADC
              );
            })
            .catch(vscode.window.showErrorMessage);
        })
        .catch(vscode.window.showErrorMessage);
    })
    .catch(vscode.window.showErrorMessage);
};

const openADCFile = () => {
  const uri = vscode.Uri.parse(createOsAbsolutePath(ADC_FILE_PATH));
  vscode.window.showTextDocument(uri);
};

const openAddConfigPanel = (
  extensionContext: vscode.ExtensionContext,
  dashboardPanel: vscode.WebviewPanel
) => {
  const panel = createWebViewPanel(extensionContext, vscode.ViewColumn.Beside);

  panel.webview.html = newGcpConfigView({
    extensionContext,
    panel,
    gcpConfigurations: globalCache(extensionContext).get("GCP_CONFIGURATIONS"),
  });

  panel.webview.onDidReceiveMessage(
    async ({ command, ...newConfigForm }) => {
      if (command === WEBVIEW_COMMAND.create_config) {
        dashboardPanel.webview.postMessage({ command: "start_loading" });
        createConfig(newConfigForm as NEW_CONFIG_FORM)
          .then(async (newConfigForm) => {
            const gcpConfigurations = await refreshGcpConfigurations(
              extensionContext
            );
            const newGcpConfig = gcpConfigurations.find(
              (gcpConfig) => gcpConfig.name === newConfigForm.configName
            );

            if (newGcpConfig && newConfigForm.activateConfig) {
              switchGcpConfig(extensionContext, dashboardPanel, {
                name: newConfigForm.configName,
                account: newConfigForm.account,
              });
            }
          })
          .catch(vscode.window.showErrorMessage);
      }
    },
    undefined,
    extensionContext.subscriptions
  );
};

const refreshGcpConfigurations = async (
  extensionContext: vscode.ExtensionContext
) => {
  const gcpConfigurations = await getGcpConfigurations();

  if (!gcpConfigurations) {
    return [];
  }

  globalCache(extensionContext).setGcpConfigurations(gcpConfigurations);

  return gcpConfigurations;
};

const globalCache = (extensionContext: vscode.ExtensionContext) => {
  const cache = extensionContext.globalState.get<GLOBAL_CACHE>(CACHE_VERSION, {
    ADCs: {},
    GCP_CONFIGURATIONS: [],
    ACTIVITIES: [],
  });

  return {
    get: <TKey extends keyof GLOBAL_CACHE>(key: TKey): GLOBAL_CACHE[TKey] => {
      return cache[key] as GLOBAL_CACHE[TKey];
    },
    getGcpConfigADC: (gcpConfigName: string) => {
      return cache["ADCs"][gcpConfigName];
    },
    addGcpConfigADC: (
      gcpConfigName: string,
      ADC: APPLICATION_DEFAULT_CREDENTIAL
    ) => {
      cache["ADCs"][gcpConfigName] = ADC;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    setGcpConfigurations: (gcpConfigurations: GCP_CONFIGURATION[]) => {
      cache["GCP_CONFIGURATIONS"] = gcpConfigurations;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    addActivity: (activity: ACTIVITY) => {
      cache["ACTIVITIES"].push(activity);
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },
  };
};
