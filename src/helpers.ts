import vscode from "vscode";

import { APP_NAME, ADC_FILE_PATH } from "./constants";

import fs from "fs";
import os from "os";
import path from "path";

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

export const createWebViewPanel = (
  context: vscode.ExtensionContext,
  viewColumn: vscode.ViewColumn = vscode.ViewColumn.One
) => {
  const panel = vscode.window.createWebviewPanel(
    APP_NAME,
    "GCP Switch Config",
    viewColumn
  );

  const iconPath = vscode.Uri.joinPath(
    context.extensionUri,
    "assets",
    "logo-256.png"
  );

  panel.iconPath = { dark: iconPath, light: iconPath };

  return panel;
};

export const openADCFile = () => {
  const uri = vscode.Uri.parse(createOsAbsolutePath(ADC_FILE_PATH));
  vscode.window.showTextDocument(uri);
};
