import { GCP_CONFIGURATION } from "../types";

export const gcpTopbar = (gcpConfigurations: GCP_CONFIGURATION[]) => {
  const gcpActiveConfig = gcpConfigurations.find(
    (gcpConfig) => gcpConfig.is_active
  );

  return `
        <div class="header">
            <div id="header-title" style="display: flex; justify-content: flex-start; align-items: center; gap: 3em; flex: 1;"> 
            <div class="gcp-current-configuration">
                <p><i class="codicon codicon-pass-filled"></i>Active</p>
                <h2>${gcpActiveConfig?.name}</h2>
            </div>
            </div>
            <div class="header-searchbar" style="flex: 1;">
                <input class="search-input" id="search-input" autocomplete="off" type="search" spellcheck="false" aria-label="Search for configurations" placeholder="Search for configurations">
            </div>
            <div class="header-notification">
                <div class="gcp-notification">
                    <i class='codicon codicon-bell' style="font-size: 24px;"></i>
                    <div class="gcp-notification-spinner"></div>
                </div>
                <div class="gcp-current-adc">
                    <i class='codicon codicon-key'></i>
                    <a href="#" onclick="handleADCJsonClick()">
                    ADC.json
                    </a>
                </div>
            </div>
        </div>
    `;
};
