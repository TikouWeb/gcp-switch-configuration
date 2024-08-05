import vscode from "vscode";

import { ADC_FILE_PATH, WEBVIEW_COMMAND } from "../constants";
import { GCP_CONFIGURATION, GCP_CONFIG_FORM } from "../types";

import {
  globalCache,
  refreshGcpConfigurations,
  refreshGcpProjects,
} from "../global-cache";

import { updateJsonFile, createWebViewPanel, openADCFile } from "../helpers";

import {
  setGcpConfigADC,
  activateConfig,
  setGcpConfigAccount,
  createGcpConfig,
  updateGcpConfig,
  setGcpConfigProject,
  deleteGcpConfig,
} from "../services/gcloud-services";

import { configFormTemplate } from "./config-form.template";
import { dashboardTemplate } from "./dashboard.template";

import { loadingPage } from "../components/loading-page.template";
import { GcpConfigStatusBarItemManager } from "../gcp-config-status";

export class WebviewManager {
  private panel: vscode.WebviewPanel | undefined;
  private view: vscode.WebviewView | undefined;
  private context: vscode.ExtensionContext;
  private webviewOptions: vscode.WebviewOptions;
  private gcpConfigStatusBarItem: GcpConfigStatusBarItemManager;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.webviewOptions = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "assets"),
        vscode.Uri.joinPath(this.context.extensionUri, "node_modules"),
      ],
    };
    this.gcpConfigStatusBarItem =
      GcpConfigStatusBarItemManager.getInstance(context);
  }

  setPanelView(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.webview.options = this.webviewOptions;
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.renderDashboardWebview(this.context, this.panel.webview);
  }

  setActivityBarView(view: vscode.WebviewView) {
    this.view = view;
    this.view.webview.options = this.webviewOptions;
    this.renderDashboardWebview(this.context, this.view.webview);
  }

  setOptions() {
    if (this.panel) {
      this.panel.webview.options = this.webviewOptions;
    }
    if (this.view) {
      this.view.webview.options = this.webviewOptions;
    }
  }

  updateWebviews = async () => {
    await refreshGcpConfigurations(this.context);

    if (this.panel) {
      await this.updateWebviewContent(this.panel.webview);
    }
    if (this.view) {
      await this.updateWebviewContent(this.view.webview);
    }
  };

  updateWebviewContent = async (webview: vscode.Webview) => {
    const gcpConfigurations = globalCache(this.context).get(
      "GCP_CONFIGURATIONS"
    );
    webview.html = dashboardTemplate({
      context: this.context,
      webview: webview,
      gcpConfigurations,
    });

    await webview.postMessage({ command: "stop_loading" });
    this.gcpConfigStatusBarItem.setPendingState(false);

    const activeGcpConfiguration = globalCache(
      this.context
    ).getActiveGcpConfiguration();

    this.gcpConfigStatusBarItem.updateStatusBarItem({
      configName: activeGcpConfiguration?.name,
    });
  };

  renderDashboardWebview = (
    context: vscode.ExtensionContext,
    webview: vscode.Webview
  ) => {
    webview.html = dashboardTemplate({
      context,
      webview,
      gcpConfigurations: globalCache(context).get("GCP_CONFIGURATIONS"),
    });

    webview.onDidReceiveMessage(
      async ({ gcpConfigIndex, command }) => {
        if (command === WEBVIEW_COMMAND.switch_config) {
          const gcpConfig =
            globalCache(context).get("GCP_CONFIGURATIONS")[gcpConfigIndex];

          if (gcpConfig.is_active) {
            return;
          }

          webview.postMessage({ command: "start_loading" });
          this.gcpConfigStatusBarItem.setPendingState(true);

          this.switchGcpConfig(
            context,
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
          console.log("open_adc_file");

          openADCFile();
          return;
        }

        if (command === WEBVIEW_COMMAND.open_add_config_panel) {
          this.openConfigFormPanel(context, webview);
          return;
        }

        if (command === WEBVIEW_COMMAND.edit_config) {
          const gcpConfig =
            globalCache(context).get("GCP_CONFIGURATIONS")[gcpConfigIndex];
          this.openConfigFormPanel(context, webview, gcpConfig);
          return;
        }

        if (command === WEBVIEW_COMMAND.clear_adc_cache) {
          await webview.postMessage({ command: "start_loading" });

          const gcpConfig =
            globalCache(context).get("GCP_CONFIGURATIONS")[gcpConfigIndex];
          await globalCache(context).removeGcpConfigADC(gcpConfig.name);

          if (!gcpConfig.is_active) {
            await webview.postMessage({ command: "stop_loading" });
            return;
          }

          await this.switchGcpConfig(
            context,
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
            globalCache(context).get("GCP_CONFIGURATIONS")[gcpConfigIndex];

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
                await globalCache(context).removeGcpConfigADC(gcpConfig.name);

                await this.updateWebviews();
                vscode.window.showInformationMessage(
                  `Successfully deleted [${gcpConfig.name}]`
                );
              }
            });
          return;
        }
      },
      undefined,
      context.subscriptions
    );
  };

  private switchGcpConfig = async (
    context: vscode.ExtensionContext,
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
      const gcpConfigADC = globalCache(context).getGcpConfigADC(gcpConfig.name);

      if (shouldUpdateGcpConfigProperties || !gcpConfigADC) {
        const newGcpConfigADC = await setGcpConfigADC();

        await this.updateWebviews();

        vscode.window.showInformationMessage(message);
        globalCache(context).addGcpConfigADC(gcpConfig.name, newGcpConfigADC);

        return;
      }

      // get ADC of current gcpConfig from cache
      updateJsonFile(ADC_FILE_PATH, gcpConfigADC);
      await this.updateWebviews();
      vscode.window.showInformationMessage(message);
      return;
    } catch (error: any) {
      vscode.window.showErrorMessage(error);
      await this.updateWebviews();
    }
  };

  openConfigFormPanel = async (
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    gcpConfig?: GCP_CONFIGURATION
  ) => {
    const editMode = Boolean(gcpConfig);

    const configFormPanel = createWebViewPanel(
      context,
      vscode.ViewColumn.Beside
    );

    configFormPanel.webview.html = loadingPage({
      context,
      webview: configFormPanel.webview,
    });

    await refreshGcpProjects(context);

    configFormPanel.webview.html = configFormTemplate({
      context,
      webview: configFormPanel.webview,
      gcpConfig,
      gcpConfigurations: globalCache(context).get("GCP_CONFIGURATIONS"),
      gcpProjects: globalCache(context).get("GCP_PROJECTS"),
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
              await updateGcpConfig(
                gcpConfig!,
                gcpConfigForm as GCP_CONFIG_FORM
              );
            } else {
              await createGcpConfig(gcpConfigForm as GCP_CONFIG_FORM);
            }
            const gcpConfigurations = await refreshGcpConfigurations(context);
            const newGcpConfig = gcpConfigurations.find(
              (gcpConfig) => gcpConfig.name === gcpConfigForm.configName
            );

            if (newGcpConfig) {
              this.switchGcpConfig(context, webview, {
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
      context.subscriptions
    );
  };
}
