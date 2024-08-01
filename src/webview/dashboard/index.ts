import vscode from "vscode";

import { ADC_FILE_PATH, WEBVIEW_COMMAND } from "../../constants";
import { GCP_CONFIGURATION, GCP_CONFIG_FORM } from "../../types";

import {
  globalCache,
  refreshGcpConfigurations,
  refreshGcpProjects,
} from "../../global-cache";

import {
  updateJsonFile,
  createWebViewPanel,
  createOsAbsolutePath,
} from "../../helpers";

import {
  setGcpConfigADC,
  activateConfig,
  setGcpConfigAccount,
  createGcpConfig,
  updateGcpConfig,
  setGcpConfigProject,
  deleteGcpConfig,
} from "../../services/gcloud-services";

import { configFormTemplate } from "./config-form.template";
import { dashboardTemplate } from "./dashboard.template";

import { loadingPage } from "../../components/loading-page.template";
import { gcpConfigurationStatusBarItem } from "../../gcp-config-status";

export const openADCFile = () => {
  const uri = vscode.Uri.parse(createOsAbsolutePath(ADC_FILE_PATH));
  vscode.window.showTextDocument(uri);
};

const renderDashbordWebview = (
  extensionContext: vscode.ExtensionContext,
  webview: vscode.Webview
) => {
  webview.html = dashboardTemplate({
    extensionContext,
    webview,
    gcpConfigurations: globalCache(extensionContext).get("GCP_CONFIGURATIONS"),
  });

  webview.onDidReceiveMessage(
    async ({ gcpConfigIndex, command }) => {
      if (command === WEBVIEW_COMMAND.switch_config) {
        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];

        if (gcpConfig.is_active) {
          return;
        }

        webview.postMessage({ command: "start_loading" });
        gcpConfigurationStatusBarItem.setPending();

        switchGcpConfig(
          extensionContext,
          webview,
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
        openConfigFormPanel(extensionContext, webview);
        return;
      }

      if (command === WEBVIEW_COMMAND.edit_config) {
        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];
        openConfigFormPanel(extensionContext, webview, gcpConfig);
        return;
      }

      if (command === WEBVIEW_COMMAND.clear_adc_cache) {
        await webview.postMessage({ command: "start_loading" });

        const gcpConfig =
          globalCache(extensionContext).get("GCP_CONFIGURATIONS")[
            gcpConfigIndex
          ];
        await globalCache(extensionContext).removeGcpConfigADC(gcpConfig.name);

        if (!gcpConfig.is_active) {
          await webview.postMessage({ command: "stop_loading" });
          return;
        }

        await switchGcpConfig(
          extensionContext,
          webview,
          {
            name: gcpConfig.name,
            account: gcpConfig.properties.core.account,
            project: gcpConfig.properties.core.project,
          },
          false
        );
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
              webview.postMessage({ command: "start_loading" });

              await deleteGcpConfig(gcpConfig.name);
              await globalCache(extensionContext).removeGcpConfigADC(
                gcpConfig.name
              );

              await refreshDashboardTemplate({ extensionContext, webview });
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
  webview: vscode.Webview,
  gcpConfig: {
    name: GCP_CONFIGURATION["name"];
    account: GCP_CONFIGURATION["properties"]["core"]["account"];
    project: GCP_CONFIGURATION["properties"]["core"]["project"];
  },
  shouldUpdateGcpConfigProperties = true
) => {
  const message = `GCP config switched successfully to [${gcpConfig.name}]`;

  try {
    await activateConfig(gcpConfig.name);

    if (shouldUpdateGcpConfigProperties) {
      await setGcpConfigAccount(gcpConfig.account);
      await setGcpConfigProject(gcpConfig.project);
    }

    // check if current gcpConfig ADC exist in globalCache
    const gcpConfigADC = globalCache(extensionContext).getGcpConfigADC(
      gcpConfig.name
    );

    if (shouldUpdateGcpConfigProperties || !gcpConfigADC) {
      const newGcpConfigADC = await setGcpConfigADC();

      await refreshDashboardTemplate({ extensionContext, webview });

      vscode.window.showInformationMessage(message);
      globalCache(extensionContext).addGcpConfigADC(
        gcpConfig.name,
        newGcpConfigADC
      );

      return;
    }

    // get ADC of current gcpConfig from cache
    updateJsonFile(ADC_FILE_PATH, gcpConfigADC);
    await refreshDashboardTemplate({ extensionContext, webview });
    vscode.window.showInformationMessage(message);
    return;
  } catch (error: any) {
    vscode.window.showErrorMessage(error);
    await refreshDashboardTemplate({ extensionContext, webview });
  }
};

const openConfigFormPanel = async (
  extensionContext: vscode.ExtensionContext,
  webview: vscode.Webview,
  gcpConfig?: GCP_CONFIGURATION
) => {
  const editMode = Boolean(gcpConfig);

  const configFormPanel = createWebViewPanel(
    extensionContext,
    vscode.ViewColumn.Beside
  );

  configFormPanel.webview.html = loadingPage({
    extensionContext,
    webview: configFormPanel.webview,
  });

  await refreshGcpProjects(extensionContext);

  configFormPanel.webview.html = configFormTemplate({
    extensionContext,
    webview: configFormPanel.webview,
    gcpConfig,
    gcpConfigurations: globalCache(extensionContext).get("GCP_CONFIGURATIONS"),
    gcpProjects: globalCache(extensionContext).get("GCP_PROJECTS"),
  });

  configFormPanel.webview.onDidReceiveMessage(
    async ({ command, ...rest }) => {
      webview.postMessage({ command: "start_loading" });
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
            switchGcpConfig(extensionContext, webview, {
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

const refreshDashboardTemplate = async ({
  extensionContext,
  webview,
}: {
  extensionContext: vscode.ExtensionContext;
  webview: vscode.Webview;
}) => {
  const gcpConfigurations = await refreshGcpConfigurations(extensionContext);
  webview.html = dashboardTemplate({
    extensionContext,
    webview,
    gcpConfigurations,
  });

  await webview.postMessage({ command: "stop_loading" });
  gcpConfigurationStatusBarItem.setPending(false);

  const activeGcpConfiguration =
    globalCache(extensionContext).getActiveGcpConfiguration();

  gcpConfigurationStatusBarItem.update({
    configName: activeGcpConfiguration?.name,
  });
};

export { renderDashbordWebview };
