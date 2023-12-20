import vscode from "vscode";
import { GCP_CONFIGURATION } from "../model";
import { configNameToTitle } from "../helpers";

export const dashboardView = ({
  gcpConfigurations,
  webview,
  extensionUri,
}: {
  gcpConfigurations: GCP_CONFIGURATION[];
  webview: vscode.Webview;
  extensionUri: vscode.Uri;
}) => {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "styles.css")
  );
  const codiconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css"
    )
  );

  const gcloudActiveConfig = gcpConfigurations.find(
    (gcpConfig) => gcpConfig.is_active
  );

  const projectSwitchButtons = gcpConfigurations.map(
    (gcpConfig, gcpConfigIndex) => {
      return `
              <div class="gcp-config-card ${
                gcpConfig.is_active ? "selected" : ""
              }">
                  ${
                    gcpConfig.is_active
                      ? '<div class="gcp-config-badge"><i class="badge badge-active"></i></div>'
                      : `<input class="gcp-config-badge" type="radio" name="gcpConfig" onclick="handleSwitchProjectClick(this);" value="${gcpConfigIndex}"/>`
                  }
                  <h3 class="gcp-config-title">${configNameToTitle(
                    gcpConfig.name
                  )}</h3>
                  <div class="gcp-config-info">
                      <div class="gcp-config-info-item">
                          <small class="title">Project Id</small>
                          <small class="gcp-config-info-value">
                          ${
                            !gcpConfig.properties.core.project ||
                            gcpConfig.properties.core.project === "undefined"
                              ? `<div class="message-warning"><i class='codicon codicon-warning'></i> Undefined</div>`
                              : `${gcpConfig.properties.core.project}`
                          }
                          </small>
                      </div>
                      <div class="gcp-config-info-item">
                          <small class="title">Account</small>
                          <small class="gcp-config-info-value">
                              ${
                                !gcpConfig.properties.core.account ||
                                gcpConfig.properties.core.account ===
                                  "undefined"
                                  ? `<div class="message-warning"><i class='codicon codicon-warning'></i> Undefined</div>`
                                  : `${gcpConfig.properties.core.account}`
                              }
                          </small>
                      </div>
                  </div>
              </div>
          `;
    }
  );

  return `
          <!DOCTYPE html>
          <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="Content-Security-Policy" font-src ${
                    webview.cspSource
                  }; style-src ${webview.cspSource};">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>GCP Switch Configuration</title>
  
                  <link href="${styleUri}" rel="stylesheet" />
                  <link href="${codiconsUri}" rel="stylesheet" />
              </head>
              <style>
                  :root {
                      --success-color: #33a853;
                      --blue-color: #4285F4;
  
                      --grey-100: #f2f2f2;
                      --grey-200: #e9e9e9;
                      --grey-500: #b0b0b0;
                      --grey-800: #2e2e2e;
                  }
  
                  body {
                      padding: 16px 24px;
                  }
  
                  body.vscode-light {
                      --text-primary-color: rgba(0, 0, 0, 0.87);
                      --text-secondary-color: rgba(0, 0, 0, 0.6);
                      --text-disabled-color: rgba(0, 0, 0, 0.38);
                      --text-warning-color: #f4c000;
  
                      --bg-paper: #ffffff;
                      --bg-default: #ffffff;
                      --bg-secondary: var(--grey-200);
  
                      --border-color: rgba(0, 0, 0, 0.12);
                  }
                  
                  body.vscode-dark {
                      --text-primary-color: #ffffff;
                      --text-secondary-color: rgba(255, 255, 255, 0.7);
                      --text-disabled-color: rgba(255, 255, 255, 0.5);
                      --text-warning-color: #f4c000;
  
                      --bg-paper: #121212;
                      --bg-default: #121212;
                      --bg-secondary: var(--grey-800);
  
                      --border-color: rgba(255, 255, 255, 0.12);
                  }
  
                  .message-warning {
                      display: flex;
                      align-items: center;
                      gap: 0.5em;
                      color: var(--text-warning-color);
                  }
  
                  .header {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      gap: 1.5em;
                  }
  
                  .gcp-config-card {
                      position: relative;
                      padding: 16px;
                      border-radius: 3px;
                      display: flex;
                      flex-direction: column;
                      background-color: var(--bg-paper);
                      color: var(--text-primary-color);
                      border: 1px solid var(--border-color);
                  }
                  .gcp-config-card .gcp-config-title {
                      font-weight: bold;
                      margin: 0;
                  }
                  .gcp-config-info {
                      display: flex;
                      flex-direction: column;
                      gap: 0.5em;
                      margin-top: 16px;
                  }
                  .gcp-config-info-item {
                      display: flex;
                      align-items: center;
                  }
                  .gcp-config-info-item .title {
                      min-width: 60px;
                      font-weight: 500;
                  }
                  .gcp-config-info-value {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 0.5em;
                      margin-left: 4px;
                      padding: 2px 4px;
                      background-color: var(--bg-secondary);
                      border-radius: 4px;
                  }
                  .gcp-config-card:hover {
                      border-color: var(--blue-color);
                  }
                  .gcp-config-card.selected {
                      box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
                  }
                  .gcp-config-card .gcp-config-badge {
                      position: absolute;
                      top: 16px;
                      right: 16px;
                  }
                  .badge {
                      position: relative;
                      width: 1.15em;
                      height: 1.15em;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                  }
                  .badge-active {
                      border-radius: 100%;
                      background-color: var(--success-color);
                      color: var(--success-color);
                  }
                  .badge-active::after {
                      position: absolute;
                      top: -0.07em;
                      right: -0.09em;
                      width: 100%;
                      height: 100%;
                      border-radius: 100%;
                      animation: 1.2s ease-in-out 0s infinite normal none running ripple;
                      border: 1px solid currentcolor;
                      content: "";
                  }
  
                  .gcp-current-configuration {
                      display: flex;
                      align-items: center;
                      gap: 1em;
                  }
  
                  input[type="radio"] {
                      /* Add if not using autoprefixer */
                      -webkit-appearance: none;
                      /* Remove most all native input styles */
                      appearance: none;
                      /* Not removed via appearance */
                      margin: 0;
                    
                      font: inherit;
                      color: currentColor;
                      width: 1.15em;
                      height: 1.15em;
                      border: 0.15em solid var(--grey-500);
                      border-radius: 50%;
                      transform: translateY(-0.075em);
                    
                      display: grid;
                      place-content: center;
                  }
                  
                  input[type="radio"]::before {
                  content: "";
                  width: 0.65em;
                  height: 0.65em;
                  border-radius: 50%;
                  transform: scale(0);
                  transition: 120ms transform ease-in-out;
                  box-shadow: inset 1em 1em var(--form-control-color);
                  /* Windows High Contrast Mode */
                  background-color: var(--success-color);
                  }
                  
                  input[type="radio"]:checked::before {
                  transform: scale(1);
                  }
  
                  input[type="radio"]:focus {
                  outline: none;
                  }
          
                  @keyframes ripple {
                      0% {
                          transform: scale(0.8);
                          opacity: 1;
                      }
                      100% {
                          transform: scale(2.4);
                          opacity: 0;
                      }
                  }
  
                  .gcp-configurations-container {
                      width: 100%; 
                      margin: 48px 0 100px; 
                      display: grid; 
                      grid-template-columns: repeat(1, 1fr);
                      grid-gap: 2em;
                  }
  
                  @media (min-width: 450px) {
                      .gcp-configurations-container { 
                          grid-template-columns: repeat(1, 1fr); 
                      }
                  }
  
                  @media (min-width: 550px) {
                      .gcp-configurations-container { 
                          grid-template-columns: repeat(2, 1fr); 
                      }
                  }
  
                  @media (min-width: 900px) {
                      .gcp-configurations-container { 
                          grid-template-columns: repeat(3, 1fr); 
                      }
                  }
  
                  @media (min-width: 1200px) {
                      .gcp-configurations-container { 
                          grid-template-columns: repeat(4, 1fr); 
                      }
                  }
              </style>
              <body>
                  <div class="header">
                      <div style="display: flex; justify-content: flex-start; align-items: center; gap: 1.5em"> 
                          <img src="https://avatars.githubusercontent.com/u/2810941?s=280&v=4" width="40"/>
                          <h1 style="margin: 0;">GCP Configuration Switch</h1>
                      </div>
                      <div class="gcp-current-configuration">
                          <i class="badge badge-active"></i> 
                          <h3>${configNameToTitle(
                            gcloudActiveConfig?.name
                          )}</h3>
                      </div>
                  </div>
  
                  <div class="gcp-configurations-container">
                      ${projectSwitchButtons?.join(" ")}
                  </div>
  
                  <div style="left: 0; bottom: 0; width: 100%;"> 
                      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 1.5em; padding: 8px 12px;"> 
                          <img src="https://m.media-amazon.com/images/I/61RMA77giZL.jpg" width="40"/>
                          <h4>For smart and lazy developers</h4>
                      </div>
                  </div>
  
                  <script>
                      const vscode = acquireVsCodeApi();
                      function handleSwitchProjectClick(radio) {
                          vscode.postMessage({ gcpConfigIndex: radio.value })
                      } 
                  </script>
              </body>
          </html>
      `;
};
