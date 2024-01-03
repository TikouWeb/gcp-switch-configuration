import vscode from "vscode";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import {
  APPLICATION_DEFAULT_CREDENTIAL,
  GCP_CONFIGURATION,
  GCP_PROJECT,
  GCP_CONFIG_FORM,
} from "./types";
import { ADC_FILE_PATH, APP_NAME } from "./constants";

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
    exec(`gcloud auth application-default login`, (error, _, stderr) => {
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
    });
  });
};

export const readJsonFile = (filePath: string) => {
  const absoluteFilePath = path.join(os.homedir(), filePath);
  if (fs.existsSync(absoluteFilePath)) {
    const data = fs.readFileSync(absoluteFilePath, "utf8");
    return JSON.parse(data);
  } else {
    console.error("File does not exist:", absoluteFilePath);
    return null;
  }
};

export const updateJsonFile = (
  filePath: string,
  jsonData: Record<string, any>
) => {
  const absoluteFilePath = path.join(os.homedir(), filePath);
  if (fs.existsSync(absoluteFilePath)) {
    fs.writeFileSync(
      absoluteFilePath,
      JSON.stringify(jsonData, null, 2),
      "utf8"
    );
  } else {
    console.error("File does not exist:", absoluteFilePath);
  }
};

export const createOsAbsolutePath = (relativePath: string) =>
  path.join(os.homedir(), relativePath);

export const createExtensionAbsolutePath = (relativePath: string) =>
  path.join(os.homedir(), relativePath);

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

export const createHtmlHead = (
  extensionContext: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
) => {
  const codiconsUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionContext.extensionUri,
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css"
    )
  );

  const stylesUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionContext.extensionUri, "assets", "styles.css")
  );

  return `
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" font-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource};">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GCP Switch Configuration</title>
      <link href="${stylesUri}" rel="stylesheet"/>
      <link href="${codiconsUri}" rel="stylesheet" />
    </head>
  `;
};

export const createWebViewPanel = (
  extensionContext: vscode.ExtensionContext,
  viewColumn: vscode.ViewColumn = vscode.ViewColumn.One
) => {
  const panel = vscode.window.createWebviewPanel(
    APP_NAME,
    "GCP Switch Config",
    viewColumn,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      enableCommandUris: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionContext.extensionUri, "assets"),
        vscode.Uri.joinPath(extensionContext.extensionUri, "node_modules"),
      ],
    }
  );

  const iconPath = vscode.Uri.joinPath(
    extensionContext.extensionUri,
    "assets",
    "gcp-logo.png"
  );

  panel.iconPath = { dark: iconPath, light: iconPath };

  return panel;
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
