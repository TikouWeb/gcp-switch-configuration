import { exec } from "child_process";
import {
  APPLICATION_DEFAULT_CREDENTIAL,
  GCP_CONFIGURATION,
  GCP_CONFIG_FORM,
  GCP_PROJECT,
} from "../types";
import { ADC_FILE_PATH } from "../constants";
import { readJsonFile } from "../helpers";

export const createGcpConfig = async (newConfig: GCP_CONFIG_FORM) => {
  return new Promise<GCP_CONFIG_FORM>((resolve, reject) => {
    exec(
      `gcloud config configurations create ${newConfig.configName}`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes(newConfig.configName)) {
          reject(false);
          return;
        }

        resolve(newConfig);
      }
    );
  });
};

export const updateGcpConfig = async (
  oldGcpConfig: GCP_CONFIGURATION,
  gcpConfigForm: GCP_CONFIG_FORM
) => {
  return new Promise<GCP_CONFIG_FORM>((resolve, reject) => {
    if (oldGcpConfig.name === gcpConfigForm.configName) {
      resolve(gcpConfigForm);
      return;
    }

    exec(
      `gcloud config configurations rename ${oldGcpConfig.name} --new-name=${gcpConfigForm.configName}`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes(gcpConfigForm.configName)) {
          reject(false);
          return;
        }

        resolve(gcpConfigForm);
      }
    );
  });
};

export const deleteGcpConfig = async (gcpConfigName: string) => {
  return new Promise<boolean>((resolve, reject) => {
    exec(
      `gcloud config configurations delete ${gcpConfigName} --quiet`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes(`Deleted [${gcpConfigName}]`)) {
          reject(false);
          return;
        }

        resolve(true);
      }
    );
  });
};

export const activateConfig = async (gcpConfigName: string) => {
  return new Promise((resolve, reject) => {
    exec(
      `gcloud config configurations activate ${gcpConfigName}`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes(gcpConfigName)) {
          reject(false);
          return;
        }

        resolve(stderr);
      }
    );
  });
};

export const setGcpConfigAccount = async (gcpConfigAccount: string) => {
  return new Promise((resolve, reject) => {
    exec(
      `gcloud config set account ${gcpConfigAccount}`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes("Updated property [core/account]")) {
          reject(stderr);
          return;
        }

        resolve(stderr);
      }
    );
  });
};

export const setGcpConfigProject = async (gcpConfigProject: string) => {
  return new Promise((resolve, reject) => {
    exec(
      `gcloud config set project ${gcpConfigProject}`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes("Updated property [core/project]")) {
          reject(stderr);
          return;
        }

        resolve(stderr);
      }
    );
  });
};

export const setGcpConfigADC = async () => {
  return new Promise<APPLICATION_DEFAULT_CREDENTIAL>((resolve, reject) => {
    const execInstance = exec(
      `gcloud auth application-default login`,
      (error, _, stderr) => {
        if (error) {
          reject(false);
          return;
        }

        if (stderr) {
          const jsonData: APPLICATION_DEFAULT_CREDENTIAL =
            readJsonFile(ADC_FILE_PATH);
          if (jsonData) {
            resolve(jsonData);
            return;
          }

          reject(stderr);
          return;
        }

        reject(stderr);
      }
    );

    const timeout = setTimeout(() => {
      execInstance.kill("SIGTERM");
      reject("Authentication process terminated due to timeout");
    }, 60000);

    execInstance.on("close", () => {
      clearTimeout(timeout);
    });
  });
};

export const getGcpConfigurations = async () => {
  return new Promise<GCP_CONFIGURATION[]>(async (resolve, reject) => {
    try {
      const gcpConfigurationsOutput = await executeCommand(
        `gcloud config configurations list --sort-by=name --format=json`
      );
      const gcpConfigurations = JSON.parse(
        gcpConfigurationsOutput
      ) as GCP_CONFIGURATION[];
      resolve(gcpConfigurations);
    } catch (error) {
      console.error("Error in getGcpConfigurations:", error);
      reject(error);
    }
  });
};

export const getGcpProjects = async () => {
  return new Promise<GCP_PROJECT[]>(async (resolve, reject) => {
    try {
      const gcpProjectsOutput = await executeCommand(
        `gcloud projects list --sort-by=projectId --format=json`
      );
      const gcpProjects = JSON.parse(gcpProjectsOutput) as GCP_PROJECT[];
      resolve(gcpProjects);
    } catch (error) {
      console.error("Error in getGcpProjects:", error);
      reject(error);
    }
  });
};

const executeCommand = (command: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
};
