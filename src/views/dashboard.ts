import vscode from "vscode";
import { GCP_CONFIGURATION } from "../types";
import { configNameToTitle } from "../helpers";
import { gcpConfigCard } from "./components/gcp-config-card";
import path from "path";

type DashboardProps = {
  extentionContext: vscode.ExtensionContext;
  gcpConfigurations: GCP_CONFIGURATION[];
  webview: vscode.Webview;
  extensionUri: vscode.Uri;
};

export const dashboardView = ({
  extentionContext,
  gcpConfigurations,
  webview,
  extensionUri,
}: DashboardProps) => {
  const codiconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css"
    )
  );

  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "styles.css")
  );

  const gcpActiveConfig = gcpConfigurations.find(
    (gcpConfig) => gcpConfig.is_active
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
                  <link href="${stylesUri}" rel="stylesheet"/>
                  <link href="${codiconsUri}" rel="stylesheet" />
              </head>
              <body>
                  <div class="header">
                      <div style="display: flex; justify-content: flex-start; align-items: center; gap: 1.5em"> 
                          <img src="https://avatars.githubusercontent.com/u/2810941?s=280&v=4" width="40"/>
                          <h1 style="margin: 0;">GCP Configuration Switch</h1>
                      </div>
                      <div style="display: flex; justify-content: flex-start; align-items: center; gap: 1em">
                        <div class="gcp-current-configuration">
                            <i class="badge"></i> 
                            <h3>${configNameToTitle(gcpActiveConfig?.name)}</h3>
                        </div>
                        <div class="gcp-current-adc">
                          <i class='codicon codicon-key'></i>
                          <a href="#" onclick="handleADCJsonClick()">
                            ADC.json
                          </a>
                        </div>
                      </div>
                  </div>
  
                  <div class="gcp-configurations-container">
                      ${gcpConfigurations
                        .map((gcpConfig, gcpConfigIndex) => {
                          return gcpConfigCard({ gcpConfig, gcpConfigIndex });
                        })
                        ?.join("")}
                  </div>
  
                  <div style="left: 0; bottom: 0; width: 100%;"> 
                      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 1em; padding: 8px 12px;"> 
                          <img src="https://m.media-amazon.com/images/I/61RMA77giZL.jpg" width="30" style="border-radius: 50%;"/>
                          <h4>For smart and lazy developers</h4>
                      </div>
                  </div>
  
                  <script>
                      const vscode = acquireVsCodeApi();
                      function handleSwitchProjectClick(radio) {
                          vscode.postMessage({ 
                            gcpConfigIndex: radio.value, 
                            command: "switch_config" 
                          })
                      }
                      function handleADCJsonClick() {
                        vscode.postMessage({ 
                          command: "open_adc_file" 
                        })
                    } 
                  </script>
              </body>
          </html>
      `;
};
