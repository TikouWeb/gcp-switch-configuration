import vscode from "vscode";

import {
  getGcpConfigurations,
  activateConfig,
  setGcpConfigAccount,
  setGcpConfigADC,
  updateJsonFile,
  createOsAbsolutePath,
  createWebViewPanel,
  createGcpConfig,
  getGcpProjects,
  updateGcpConfig,
  setGcpConfigProject,
  deleteGcpConfig,
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
  GCP_PROJECT,
  GLOBAL_CACHE,
  GCP_CONFIG_FORM,
} from "./types";

import { dashboardView } from "./views/dashboard";
import { gcpConfigFormView } from "./views/gcp-config-form";
import { loadingPage } from "./views/components/gcp-loading-page";

export const activate = async (extensionContext: vscode.ExtensionContext) => {
  await refreshGcpConfigurations(extensionContext);
  globalCache(extensionContext).clearUnusedCache();

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
        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];

        if (gcpConfig.is_active) {
          return;
        }

        dashboardPanel.webview.postMessage({ command: "start_loading" });

        switchGcpConfig(
          extensionContext,
          dashboardPanel,
          {
            name: gcpConfig.name,
            account: gcpConfig.properties.core.account,
            project: gcpConfig.properties.core.project,
          },
          false
        );

        return;
      }

      if (command === WEBVIEW_COMMAND.open_adc_file) {
        openADCFile();
        return;
      }

      if (command === WEBVIEW_COMMAND.open_add_config_panel) {
        openConfigFormPanel(extensionContext, dashboardPanel);
        return;
      }

      if (command === WEBVIEW_COMMAND.edit_config) {
        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];
        openConfigFormPanel(extensionContext, dashboardPanel, gcpConfig);
        return;
      }

      if (command === WEBVIEW_COMMAND.delete_config) {
        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];

        if (gcpConfig.is_active) {
          vscode.window.showErrorMessage(
            `Can not delete [${gcpConfig.name}] because is set as active. Switch to another configuration and retry`
          );
          return;
        }

        vscode.window
          .showInformationMessage(
            `Are you sure you want to delete \n [${gcpConfig.name}] ?`,
            { modal: true, detail: "This action is irreversible !" },
            "Yes",
            "No"
          )
          .then(async (answer) => {
            if (answer === "Yes") {
              dashboardPanel.webview.postMessage({ command: "start_loading" });

              await deleteGcpConfig(gcpConfig.name);
              globalCache(extensionContext).removeGcpConfigADC(gcpConfig.name);

              const gcpConfigurations = await refreshGcpConfigurations(
                extensionContext
              );
              dashboardPanel.webview.html = dashboardView({
                extensionContext,
                panel: dashboardPanel,
                gcpConfigurations,
              });
              vscode.window.showInformationMessage(
                `Successfully deleted [${gcpConfig.name}]`
              );
            }
          });
        return;
      }
    },
    undefined,
    extensionContext.subscriptions
  );
};

const switchGcpConfig = async (
  extensionContext: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
  gcpConfig: {
    name: GCP_CONFIGURATION["name"];
    account: GCP_CONFIGURATION["properties"]["core"]["account"];
    project: GCP_CONFIGURATION["properties"]["core"]["project"];
  },
  shouldUpdateGcpConfigProperties = true
) => {
  try {
    await activateConfig(gcpConfig.name);
    if (shouldUpdateGcpConfigProperties) {
      await setGcpConfigAccount(gcpConfig.account);
      await setGcpConfigProject(gcpConfig.project);
    }

    const message = `GCP config switched successfully to [${gcpConfig.name}]`;

    const gcpConfigADC = globalCache(extensionContext).getGcpConfigADC(
      gcpConfig.name
    );

    if (gcpConfigADC) {
      updateJsonFile(ADC_FILE_PATH, gcpConfigADC);
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

    const newGcpConfigADC = await setGcpConfigADC();

    const gcpConfigurations = await refreshGcpConfigurations(extensionContext);
    panel.webview.html = dashboardView({
      extensionContext,
      panel,
      gcpConfigurations,
    });

    vscode.window.showInformationMessage(message);
    globalCache(extensionContext).addGcpConfigADC(
      gcpConfig.name,
      newGcpConfigADC
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(error);
    const gcpConfigurations = await refreshGcpConfigurations(extensionContext);
    panel.webview.html = dashboardView({
      extensionContext,
      panel,
      gcpConfigurations,
    });
  }
};

const openADCFile = () => {
  const uri = vscode.Uri.parse(createOsAbsolutePath(ADC_FILE_PATH));
  vscode.window.showTextDocument(uri);
};

const openConfigFormPanel = async (
  extensionContext: vscode.ExtensionContext,
  dashboardPanel: vscode.WebviewPanel,
  gcpConfig?: GCP_CONFIGURATION
) => {
  const editMode = Boolean(gcpConfig);

  const configFormPanel = createWebViewPanel(
    extensionContext,
    vscode.ViewColumn.Beside
  );

  configFormPanel.webview.html = loadingPage({
    extensionContext,
    panel: configFormPanel,
  });

  await refreshGcpProjects(extensionContext);

  configFormPanel.webview.html = gcpConfigFormView({
    extensionContext,
    panel: configFormPanel,
    gcpConfig,
    gcpConfigurations: globalCache(extensionContext).get("GCP_CONFIGURATIONS"),
    gcpProjects: globalCache(extensionContext).get("GCP_PROJECTS"),
  });

  configFormPanel.webview.onDidReceiveMessage(
    async ({ command, ...rest }) => {
      dashboardPanel.webview.postMessage({ command: "start_loading" });
      configFormPanel.dispose();

      const gcpConfigForm: GCP_CONFIG_FORM = { ...rest };
      if (
        command === WEBVIEW_COMMAND.create_config ||
        command === WEBVIEW_COMMAND.update_config
      ) {
        try {
          if (editMode) {
            await updateGcpConfig(gcpConfig!, gcpConfigForm as GCP_CONFIG_FORM);
          } else {
            await createGcpConfig(gcpConfigForm as GCP_CONFIG_FORM);
          }
          const gcpConfigurations = await refreshGcpConfigurations(
            extensionContext
          );
          const newGcpConfig = gcpConfigurations.find(
            (gcpConfig) => gcpConfig.name === gcpConfigForm.configName
          );

          if (newGcpConfig) {
            switchGcpConfig(extensionContext, dashboardPanel, {
              name: gcpConfigForm.configName,
              account: gcpConfigForm.account,
              project: gcpConfigForm.project,
            });
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Error on submit form: ${error}`);
        }

        return;
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

const refreshGcpProjects = async (
  extensionContext: vscode.ExtensionContext
) => {
  const gcpProjects = await getGcpProjects();

  if (!gcpProjects) {
    return [];
  }

  globalCache(extensionContext).setGcpProjects(gcpProjects);

  return gcpProjects;
};

const globalCache = (extensionContext: vscode.ExtensionContext) => {
  const cache = extensionContext.globalState.get<GLOBAL_CACHE>(CACHE_VERSION, {
    ADCs: {},
    GCP_CONFIGURATIONS: [],
    GCP_PROJECTS: [],
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
    removeGcpConfigADC: (gcpConfigName: string) => {
      delete cache["ADCs"][gcpConfigName];
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    setGcpConfigurations: (gcpConfigurations: GCP_CONFIGURATION[]) => {
      cache["GCP_CONFIGURATIONS"] = gcpConfigurations;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    setGcpProjects: (gcpProjects: GCP_PROJECT[]) => {
      cache["GCP_PROJECTS"] = gcpProjects;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    addActivity: (activity: ACTIVITY) => {
      cache["ACTIVITIES"].push(activity);
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    clearUnusedCache: () => {
      const newADCs: GLOBAL_CACHE["ADCs"] = {};
      cache["GCP_CONFIGURATIONS"].forEach((gcpConfig) => {
        newADCs[gcpConfig.name] = cache["ADCs"][gcpConfig.name];
      });

      cache["ADCs"] = newADCs;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },
  };
};
