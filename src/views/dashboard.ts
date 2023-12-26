import vscode from "vscode";
import { GCP_CONFIGURATION } from "../types";
import { createHtmlHead } from "../helpers";
import { gcpConfigCard } from "./components/gcp-config-card";
import { loadingSpinner } from "./components/loading-spinner";
import { gcpTopbar } from "./components/gco-topbar";

type DashboardProps = {
  extensionContext: vscode.ExtensionContext;
  gcpConfigurations: GCP_CONFIGURATION[];
  panel: vscode.WebviewPanel;
};

export const dashboardView = ({
  extensionContext,
  gcpConfigurations,
  panel,
}: DashboardProps) => {
  return `
          <!DOCTYPE html>
          <html lang="en">
            ${createHtmlHead(extensionContext, panel)}
              <body>
                  ${gcpTopbar(gcpConfigurations)}
                  <div class="gcp-toolbar">
                    <div>
                      <button class="button-base button-contained-secondary" onclick="handleOpenAddConfigPanelClick()">
                        <i class='codicon codicon-add'></i> Configuration
                      </button>
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

                      function handleOpenAddConfigPanelClick() {
                        vscode.postMessage({ 
                          command: "open_add_config_panel" 
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
