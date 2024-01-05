import vscode from "vscode";
import { GCP_CONFIGURATION, GCP_PROJECT } from "../types";
import { createHtmlHead } from "../helpers";

type GcpConfigFormViewProps = {
  extensionContext: vscode.ExtensionContext;
  gcpConfigurations: GCP_CONFIGURATION[];
  gcpProjects: GCP_PROJECT[];
  gcpConfig?: GCP_CONFIGURATION;
  panel: vscode.WebviewPanel;
};

export const gcpConfigFormView = ({
  extensionContext,
  gcpConfigurations,
  gcpProjects,
  gcpConfig,
  panel,
}: GcpConfigFormViewProps) => {
  const editMode = Boolean(gcpConfig);

  let submitButtonText = "Submit new config";
  let formTitle = "New Configuration";

  // if gcpConfig, the behave as edit form
  if (editMode) {
    submitButtonText = "Save changes";
    formTitle = "Edit Configuration";
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
        ${createHtmlHead(extensionContext, panel)}
        <style>
          .form-container {
            width: 420px;
            margin: auto auto;
            padding: 20px;
          }
          
          form {
            width: 100%;
            box-sizing: border-box;
            padding: 18px 22px;
            border: 1px solid var(--border-color);
            background-color: var(--bg-paper);
            border-radius: var(--border-radius-medium);
          }

          .form-group {
            position: relative;
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

        </style>
        <body>
          <div class="form-container">
            <h1>${formTitle}</h1>
            <form id="myForm">
              <div class="form-group">
                  <label for="configName">Config Name:</label>
                  <input type="text" id="configName" name="configName" placeholder="my-config" required>
                  <span class="error" id="errorConfigName"></span>
              </div>
              <div class="form-group">
                  <label for="account">Account:</label>
                  <input type="email" id="account" name="account" placeholder="GCP Account" required>
                  <span class="error" id="errorAccount"></span>
              </div>
              <div class="form-group">
                <label for="project">Select GCP Project:</label>
                <input type="text" id="project" name="project" autocomplete="off" placeholder="Search and select a GCP project"/>
                <div id="autocompleteDropdown" class="autocomplete-dropdown">
                </div>
                <span class="error" id="errorProject"></span>
              </div>
              <button class="button-base button-contained-secondary" style="margin: 30px auto 0;" type="submit">
                ${submitButtonText} <i class='codicon codicon-send'></i>
              </button>
            </form>
          </div>

          <script>
            const configNameInput = document.getElementById('configName');
            const accountInput = document.getElementById('account');
            const projectInput = document.getElementById('project');
            const autocompleteDropdown = document.getElementById('autocompleteDropdown');

            if(${editMode}) {
              if("${gcpConfig?.name}" !== "undefined")
                configNameInput.value = "${gcpConfig?.name}"

              if("${gcpConfig?.properties?.core?.account}" !== "undefined")
                accountInput.value = "${gcpConfig?.properties?.core?.account}"

              if("${gcpConfig?.properties?.core?.project}" !== "undefined")
              projectInput.value = "${gcpConfig?.properties?.core?.project}"
            }

            projectInput.addEventListener('input', function() {
                const value = this.value?.toLowerCase();
                autocompleteDropdown.innerHTML = ''; // Clear previous options

                const createDropdownItem = (gcpProject) => {
                  const dropdownItem = document.createElement('div');
                  dropdownItem.classList.add("autocomplete-dropdown-item");

                  dropdownItem.onclick = function() {
                    console.log("clicked hello")
                    projectInput.value = gcpProject.projectId;
                    autocompleteDropdown.style.display = 'none';
                  };

                  const primaryText = document.createElement('span');
                  const secondaryText = document.createElement('span');
                  primaryText.textContent = gcpProject.projectId;
                  secondaryText.textContent = gcpProject.name;

                  dropdownItem.appendChild(primaryText);
                  dropdownItem.appendChild(secondaryText);
                  return dropdownItem
                }

                ${JSON.stringify(gcpProjects)}.forEach(gcpProject => {
                  if(!value) {
                    autocompleteDropdown.appendChild(createDropdownItem(gcpProject));
                    return
                  }
                  if (gcpProject.name?.toLowerCase().includes(value) || gcpProject.projectId?.toLowerCase().includes(value)) {
                    autocompleteDropdown.appendChild(createDropdownItem(gcpProject));
                  }
                });

                autocompleteDropdown.style.display = 'block';
            });

            // Hide dropdown when clicking outside
            window.addEventListener('click', function(e) {
              if (e.target !== projectInput) {
                autocompleteDropdown.style.display = 'none';
              }
            });

            // Show dropdown on input focus
            projectInput.addEventListener('focus', function() {
              this.dispatchEvent(new Event('input'));
            });

            const vscode = acquireVsCodeApi();

            function validateForm() {
              const response = { isValid: false };
      
              // Reset error messages
              document.getElementById('errorConfigName').textContent = '';
              document.getElementById('errorAccount').textContent = '';
              document.getElementById('errorProject').textContent = '';
      
              // Validation
              const configNameValue = configNameInput.value;
              const accountValue = accountInput.value;
              const projectValue = projectInput.value
      
              // Validate Config Name (unique)
              if (!configNameValue) {
                document.getElementById('errorConfigName').textContent = 'Config Name is required.';
                return response;
              }

              if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(configNameValue)) {
                document.getElementById('errorConfigName').textContent = 'Config Name must be lowercase and can include dashes (no spaces).';
                return response;
              }

              const configNameAlreadyExist = ${JSON.stringify(
                gcpConfigurations
              )}.some(config => config.name === configNameValue)
              
              // if editMode, prevent uniqueness check
              if (configNameAlreadyExist && !${editMode}) {
                document.getElementById('errorConfigName').textContent = 'Config Name must be unique.';
                return response;
              }
      
              // Validate Account
              if (!accountValue) {
                document.getElementById('errorAccount').textContent = 'Account is required.';
                return response;
              }
              if (!accountValue.includes('@')) {
                document.getElementById('errorAccount').textContent = 'Invalid email.';
                return response;
              }
      
              // Validate Project
              if (!projectValue) {
                document.getElementById('errorProject').textContent = 'Project is required.';
                return response;
              }

              return {
                isValid: true,
                configName: configNameValue,
                account: accountValue,
                project: projectValue
              }
            };

            // Attach change event listeners to each input
            configNameInput.addEventListener('change', validateForm);
            accountInput.addEventListener('change', validateForm);
            projectInput.addEventListener('change', validateForm);
        
            // Update the form submission event listener
            document.getElementById('myForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const {isValid, ...newConfig } = validateForm();

              if (isValid) {
                vscode.postMessage({ 
                  command: "${editMode ? "update_config" : "create_config"}", 
                  ...newConfig
                })
              }
            });
          </script>
        </body>
    </html>
  `;
};
