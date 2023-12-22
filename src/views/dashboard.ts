import vscode from "vscode";
import { GCP_CONFIGURATION } from "../types";
import { configNameToTitle } from "../helpers";
import { gcpConfigCard } from "./components/gcp-config-card";
import { loadingSpinner } from "./components/loading-spinner";

type DashboardProps = {
  extentionContext: vscode.ExtensionContext;
  gcpConfigurations: GCP_CONFIGURATION[];
  webview: vscode.Webview;
  extensionUri: vscode.Uri;
};

export const dashboardView = ({
  // extentionContext,
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
    vscode.Uri.joinPath(extensionUri, "assets", "styles.css")
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
                      <div id="header-title" style="display: flex; justify-content: flex-start; align-items: center; gap: 3em; flex: 1;"> 
                        <div class="gcp-current-configuration">
                          <i class="badge"></i>
                          <h2>${configNameToTitle(gcpActiveConfig?.name)}</h2>
                        </div>
                      </div>
                      <div style="flex: 1;">
                        <input class="search-input" autocomplete="off" type="search" spellcheck="false" tabindex="0" aria-label="Search for configurations" aria-autocomplete="list" placeholder="Search for configurations">
                      </div>
                      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 2em; flex: 1;">
                        <div class="gcp-notification">
                          <i class='codicon codicon-bell' style="font-size: 24px;"></i>
                          <div class="gcp-notification-spinner">
                          </div>
                        </div>
                        <div class="gcp-current-adc">
                          <i class='codicon codicon-key'></i>
                          <a href="#" onclick="handleADCJsonClick()">
                            ADC.json
                          </a>
                        </div>
                      </div>
                  </div>
                  
                  <div style="padding: 0 24px;">
                    <div class="gcp-configurations-container">
                        ${gcpConfigurations
                          .map((gcpConfig, gcpConfigIndex) => {
                            return gcpConfigCard({ gcpConfig, gcpConfigIndex });
                          })
                          ?.join("")}
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

                      // handle message comming from extension
                      window.addEventListener('message', event => {
                          const message = event.data; 
                          
                          if(message.command === "start_loading"){
                            const headerTitle = document.getElementsByClassName("gcp-notification-spinner")[0]; 
                            headerTitle.innerHTML +=  '${loadingSpinner({
                              size: "large",
                            })}'
                          }
                      }); 
                  </script>
              </body>
          </html>
      `;
};
