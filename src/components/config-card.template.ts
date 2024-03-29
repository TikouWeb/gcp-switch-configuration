import { GCP_CONFIGURATION } from "../types";

type GcpConfigCardProps = {
  gcpConfig: GCP_CONFIGURATION;
  gcpConfigIndex: number;
};

export const gcpConfigCard = ({
  gcpConfig,
  gcpConfigIndex,
}: GcpConfigCardProps) => {
  return `
    <div class="gcp-config-card ${gcpConfig.is_active ? "selected" : ""}">
          <input 
            class="gcp-config-badge" 
            type="radio" name="gcpConfig" 
            onclick="handleSwitchConfigClick(this);" 
            value="${gcpConfigIndex}" 
            ${gcpConfig.is_active ? "checked" : ""}
          />
          <div class="gcp-config-card-header">
            <h4 class="gcp-config-title">
              ${gcpConfig.name}
            </h4>
            <div class="gcp-config-edit-action">
              <button class="button-icon button-text" title="Edit config" onclick="handleEditConfigClick(${gcpConfigIndex});">
                <i class='codicon codicon-edit'></i>
              </button>
              <button class="button-icon button-text" title="Delete config" onclick="handleDeleteConfigClick(${gcpConfigIndex});">
                <i class='codicon codicon-trash'></i>
              </button>
              <button class="button-icon button-text" title="Clear ADC cache" onclick="handleClearAdcCacheClick(${gcpConfigIndex});">
                <i class='codicon codicon-circle-slash'></i>
              </button>
            </div>
          </div>
          <div class="gcp-config-info">
              <div class="gcp-config-info-item">
                  <small class="title">Project</small>
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
                        gcpConfig.properties.core.account === "undefined"
                          ? `<div class="message-warning"><i class='codicon codicon-warning'></i></div>`
                          : `${gcpConfig.properties.core.account}`
                      }
                  </small>
              </div>
          </div>
      </div>`;
};
