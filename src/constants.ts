export const APP_NAME = "gcp-switch-config";

// --------------------------------------------
// this commands should be the same in package.json
export const OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND = `${APP_NAME}.open-dashboard-webview-panel`;
export const REFRESH_DASHBOARD_WEBVIEW_COMMAND = `${APP_NAME}.refresh-dashboard-webview`;
export const WEBVIEW_ID = `${APP_NAME}-webview-id`;
// --------------------------------------------

export const ADC_FILE_PATH =
  ".config/gcloud/application_default_credentials.json";

export const CACHE_VERSION = `${APP_NAME}_cache_v1`;

export const WEBVIEW_COMMAND = {
  switch_config: "switch_config",
  edit_config: "edit_config",
  update_config: "update_config",
  delete_config: "delete_config",
  open_adc_file: "open_adc_file",
  open_add_config_panel: "open_add_config_panel",
  create_config: "create_config",
  clear_adc_cache: "clear_adc_cache",
};

export const INFO_MESSAGE = {
  CONFIG_SWITCHED: (gcpConfigName: string) =>
    `GCP config switched successfully to [${gcpConfigName}]`,

  CONFIG_DELETE_CONFIRM: (gcpConfigName: string) =>
    `Are you sure you want to delete \n [${gcpConfigName}] ?`,

  CONFIG_DELETED: (gcpConfigName: string) =>
    `Successfully deleted configuration: [${gcpConfigName}]`,
};

export const ERROR_MESSAGE = {
  CONFIG_DELETE_FAILED: (gcpConfigName: string) =>
    `Can not delete [${gcpConfigName}] because is set as active. Switch to another configuration and retry`,

  CONFIG_CREATE_FAILED: (error: any) => `Error on submit form: ${error}`,
};
