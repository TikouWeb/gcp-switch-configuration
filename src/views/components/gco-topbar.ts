import { configNameToTitle } from "../../helpers";
import { GCP_CONFIGURATION } from "../../types";

export const gcpTopbar = (gcpConfigurations: GCP_CONFIGURATION[]) => {
  const gcpActiveConfig = gcpConfigurations.find(
    (gcpConfig) => gcpConfig.is_active
  );

  return `
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
