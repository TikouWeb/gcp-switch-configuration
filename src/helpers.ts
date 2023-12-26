import vscode from "vscode";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import {
  APPLICATION_DEFAULT_CREDENTIAL,
  GCP_CONFIGURATION,
  NEW_CONFIG_FORM,
} from "./types";
import { ADC_FILE_PATH, APP_NAME } from "./constants";

export const createConfig = async (newConfig: NEW_CONFIG_FORM) => {
  return new Promise<NEW_CONFIG_FORM>((resolve, reject) => {
    exec(
      `gcloud config configurations create ${newConfig.configName} ${
        !newConfig.activateConfig ? "--no-activate" : ""
      }`,
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

export const setAccount = async (gcpConfigAccount: string) => {
  return new Promise((resolve, reject) => {
    exec(
      `gcloud config set account ${gcpConfigAccount}`,
      (error, stdout, stderr) => {
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

export const setADC = async () => {
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

export const configNameToTitle = (configName = "") =>
  configName.replaceAll("-", " ");

export const createOsAbsolutePath = (relativePath: string) =>
  path.join(os.homedir(), relativePath);

export const createExtensionAbsolutePath = (relativePath: string) =>
  path.join(os.homedir(), relativePath);

export const getGcpConfigurations = async () => {
  return new Promise<GCP_CONFIGURATION[]>((resolve, reject) => {
    exec(
      "gcloud config configurations list --format=json",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Execution error: ${error}`);
          return;
        }
        if (stderr) {
          console.error(`Error: ${stderr}`);
          return;
        }

        if (stdout) {
          let gcpConfigurations = JSON.parse(stdout) as GCP_CONFIGURATION[];
          gcpConfigurations = gcpConfigurations.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          resolve(gcpConfigurations);
          return;
        }

        reject(null);
      }
    );
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
