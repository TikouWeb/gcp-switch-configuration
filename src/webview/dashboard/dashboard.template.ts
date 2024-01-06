import vscode from "vscode";
import { GCP_CONFIGURATION } from "../../types";

import { gcpConfigCard } from "../../components/config-card.template";
import { loadingSpinner } from "../../components/loading-spinner.template";
import { gcpTopbar } from "../../components/topbar.template";
import { htmlHeadTemplate } from "../../components/html-head.template";

type DashboardTemplateProps = {
  extensionContext: vscode.ExtensionContext;
  gcpConfigurations: GCP_CONFIGURATION[];
  webview: vscode.Webview;
};

export const dashboardTemplate = ({
  extensionContext,
  gcpConfigurations,
  webview,
}: DashboardTemplateProps) => {
  return `
          <!DOCTYPE html>
          <html lang="en">
            ${htmlHeadTemplate(extensionContext, webview)}
              <body>
                  ${gcpTopbar(gcpConfigurations)}
                  <div class="gcp-toolbar">
                    <div>
                      <button class="button-base button-contained-secondary" onclick="handleOpenAddConfigPanelClick()">
                        <i class='codicon codicon-add'></i> <span>Configuration</span>
                      </button>
                    </div>
                  </div>
                  
                  <div class="gcp-main">
                    <div class="gcp-configurations-container" id="gcp-configurations-list">
                        ${gcpConfigurations
                          .map((gcpConfig, gcpConfigIndex) => {
                            return gcpConfigCard({ gcpConfig, gcpConfigIndex });
                          })
                          .join("")}
                    </div>
                  </div>
  
                  <script>
                      const vscode = acquireVsCodeApi();
                      function handleSwitchConfigClick(radio) {
                          vscode.postMessage({ 
                            gcpConfigIndex: radio.value, 
                            command: "switch_config" 
                          })
                      }

                      function handleEditConfigClick(gcpConfigIndex) {
                        vscode.postMessage({ 
                          gcpConfigIndex: gcpConfigIndex, 
                          command: "edit_config" 
                        })
                      }

                      function handleDeleteConfigClick(gcpConfigIndex) {
                        vscode.postMessage({ 
                          gcpConfigIndex: gcpConfigIndex, 
                          command: "delete_config" 
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

                      const searchInput = document.getElementById('search-input');

                      searchInput.addEventListener('input', function() {
                        const value = this.value?.toLowerCase();
                        const gcpConfigurationsList = document.getElementById('gcp-configurations-list');
                        const gcpConfigurations = ${JSON.stringify(
                          gcpConfigurations
                        )};
                        const gcpConfigCardRenderer = ${gcpConfigCard}
                        gcpConfigurationsList.innerHTML = "";
                        
                        if(!value) {

                          gcpConfigurations.forEach((gcpConfig, gcpConfigIndex) => {
                            gcpConfigurationsList.innerHTML += gcpConfigCardRenderer({ gcpConfig, gcpConfigIndex });
                          })
                          return;
                        }

                        gcpConfigurations.forEach((gcpConfig, gcpConfigIndex) => {
                          if (
                            gcpConfig.name?.toLowerCase().includes(value) 
                            || gcpConfig.properties.core.project?.toLowerCase().includes(value) 
                            || gcpConfig.properties.core.account?.toLowerCase().includes(value)
                          ){
                            
                            gcpConfigurationsList.innerHTML += gcpConfigCardRenderer({ gcpConfig, gcpConfigIndex });
                          }
                        });

                      });
            
                      searchInput.addEventListener('focus', function() {
                        this.dispatchEvent(new Event('input'));
                      });
                  </script>
              </body>
          </html>
      `;
};
