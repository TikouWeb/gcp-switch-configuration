export const APP_NAME = "gcp-switch-config";

// `GCP_SWITCH_COMMAND` should be the same in package.json
export const OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND = `${APP_NAME}.open-dashboard-webview-panel`;

// `webviewId` should be the same in package.json
export const WEBVIEW_ID = `${APP_NAME}-webview-id`;

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
