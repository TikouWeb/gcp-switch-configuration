import vscode from "vscode";
import { GCP_CONFIGURATION } from "../types";
import { createHtmlHead } from "../helpers";

type NewGcpConfigViewProps = {
  extensionContext: vscode.ExtensionContext;
  gcpConfigurations: GCP_CONFIGURATION[];
  panel: vscode.WebviewPanel;
};

export const newGcpConfigView = ({
  extensionContext,
  gcpConfigurations,
  panel,
}: NewGcpConfigViewProps) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
        ${createHtmlHead(extensionContext, panel)}
        <style>
          .form-container {
            width: 400px;
            margin: auto auto;
            padding: 20px;
            height: 100vh;
            display: flex;
            align-items: center;
          }
          
          form {
            width: 100%;
            padding: 24px;
            border: 1px solid var(--border-color);
            background-color: var(--bg-paper);
            border-radius: var(--border-radius-medium);
            box-shadow: var(--shadow-1);
          }

          .form-group {
              margin-bottom: 15px;
          }

          label {
              display: block;
              margin-bottom: 5px;
              font-weight: bold;
          }

          input, select {
              width: 100%;
              padding: 10px;
              margin-top: 5px;
              border-radius: var(--border-radius-medium);
              border: 1px solid var(--border-color);
              box-sizing: border-box;
              background-color: var(--bg-secondary);
              color: var(--text-primary-color);
          }

          input:focus, select:focus {
            border-color: var(--primary-color);
            outline: none;
          }

          .error {
            color: var(--error-color);
            font-size: 0.9em;
            margin-top: 5px;
          }

          .inline-form-group {
            display: flex;
            align-items: center;

            >input {
              flex: 0;
            }

            >label {
              margin: 0;
              margin-left: 0.5rem;
            }
          }


    </style>
        <body>
          <div class="form-container">
            <form id="myForm" style="width: 100%;">
              <div class="form-group">
                  <label for="configName">Config Name:</label>
                  <input type="text" id="configName" name="configName" required>
                  <span class="error" id="errorConfigName"></span>
              </div>
              <div class="form-group">
                  <label for="account">Account:</label>
                  <input type="email" id="account" name="account" placeholder="my-config" required>
                  <span class="error" id="errorAccount"></span>
              </div>
              <div class="form-group">
                  <label for="project">Project:</label>
                  <select id="project" name="project" required>
                      <option value="">Select a project</option>
                      <option value="coucou">coucou</option>
                  </select>
                  <span class="error" id="errorProject"></span>
              </div>
              <div class="form-group inline-form-group">
                  <input type="checkbox" id="activateConfig" name="activateConfig" value="true" checked>
                  <label for="activateConfig">Activate New Config:</label>
              </div>
              <button class="button-base button-contained-primary" style="margin: auto;" type="submit">
                Submit <i class='codicon codicon-send'></i>
              </button>
            </form>
          </div>

          <script>
            const vscode = acquireVsCodeApi();

            function validateForm() {
              const response = { isValid: false };
      
              // Reset error messages
              document.getElementById('errorConfigName').textContent = '';
              document.getElementById('errorAccount').textContent = '';
              document.getElementById('errorProject').textContent = '';
      
              // Validation
              const configName = document.getElementById('configName').value;
              const account = document.getElementById('account').value;
              const project = document.getElementById('project').value;
              const activateConfig = document.getElementById('activateConfig').checked;
      
              // Validate Config Name (unique)
              if (!configName) {
                document.getElementById('errorConfigName').textContent = 'Config Name is required.';
                return response;
              }

              if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(configName)) {
                document.getElementById('errorConfigName').textContent = 'Config Name must be lowercase and can include dashes (no spaces).';
                return response;
              }

              const configNameAlreadyExist = ${JSON.stringify(
                gcpConfigurations
              )}.some(config => config.name === configName)
              
              if (configNameAlreadyExist) {
                document.getElementById('errorConfigName').textContent = 'Config Name must be unique.';
                return response;
              }
      
              // Validate Account
              if (!account) {
                document.getElementById('errorAccount').textContent = 'Account is required.';
                return response;
              }
              if (!account.includes('@')) {
                document.getElementById('errorAccount').textContent = 'Invalid email.';
                return response;
              }
      
              // Validate Project
              if (!project) {
                document.getElementById('errorProject').textContent = 'Project is required.';
                return response;
              }

              return {
                isValid: true,
                configName: configName,
                account: account,
                project: project,
                activateConfig: activateConfig,
              }
            };

            // Attach change event listeners to each input
            document.getElementById('configName').addEventListener('change', validateForm);
            document.getElementById('account').addEventListener('change', validateForm);
            document.getElementById('project').addEventListener('change', validateForm);
        
            // Update the form submission event listener
            document.getElementById('myForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const {isValid, ...newConfig } = validateForm();

              console.log(isValid)
              if (isValid) {
                vscode.postMessage({ 
                  command: "create_config", 
                  ...newConfig
                })
              }
            });
          </script>
        </body>
    </html>
  `;
};
