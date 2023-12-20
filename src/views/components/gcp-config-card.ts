import { ADC_FILE_PATH } from "../../constants";
import { configNameToTitle, readJsonFile } from "../../helpers";
import { GCP_CONFIGURATION } from "../../types";

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
          ${
            gcpConfig.is_active
              ? '<div class="gcp-config-badge"><i class="badge badge-active"></i></div>'
              : `<input class="gcp-config-badge" type="radio" name="gcpConfig" onclick="handleSwitchProjectClick(this);" value="${gcpConfigIndex}"/>`
          }
          <h3 class="gcp-config-title">${configNameToTitle(gcpConfig.name)}</h3>
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
                        gcpConfig.properties.core.account === "undefined"
                          ? `<div class="message-warning"><i class='codicon codicon-warning'></i> Undefined</div>`
                          : `${gcpConfig.properties.core.account}`
                      }
                  </small>
              </div>
          </div>
      </div>`;
};
