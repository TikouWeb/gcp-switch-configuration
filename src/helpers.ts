import vscode from "vscode";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { APPLICATION_DEFAULT_CREDENTIAL, GCP_CONFIGURATION } from "./model";

export const activateConfig = async ({ gcpConfig }: any) => {
  return new Promise((resolve, reject) => {
    exec(
      `gcloud config configurations activate ${gcpConfig.name}`,
      (error, _, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr && !stderr.includes(gcpConfig.name)) {
          reject(false);
          return;
        }

        resolve(stderr);
      }
    );
  });
};

export const setAccount = async ({ gcpConfig }: any) => {
  return new Promise((resolve, reject) => {
    exec(
      `gcloud config set account ${gcpConfig.properties.core.account}`,
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
    exec(`gcloud auth application-default login`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`);
        reject(false);
        return;
      }

      if (stderr) {
        // Matches application_default_credentials.json inside brackets
        const regex = /\[([^\]]+)\]/;
        const matches = stderr.match(regex);

        if (matches && matches[1]) {
          const jsonData: APPLICATION_DEFAULT_CREDENTIAL = readJsonFile(
            matches[1]
          );
          if (jsonData) {
            resolve(jsonData);
            return;
          }
        }

        reject(stderr);
        return;
      }

      reject(stderr);
    });
  });
};

export const readJsonFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } else {
    console.error("File does not exist:", filePath);
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
          resolve(JSON.parse(stdout));
          return;
        }

        reject(null);
      }
    );
  });
};
