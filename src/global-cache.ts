import vscode from "vscode";

import {
  ACTIVITY,
  APPLICATION_DEFAULT_CREDENTIAL,
  GCP_CONFIGURATION,
  GCP_PROJECT,
  GLOBAL_CACHE,
} from "./types";
import { CACHE_VERSION } from "./constants";

import {
  getGcpConfigurations,
  getGcpProjects,
} from "./services/gcloud-services";

const globalCache = (extensionContext: vscode.ExtensionContext) => {
  const cache = extensionContext.globalState.get<GLOBAL_CACHE>(CACHE_VERSION, {
    ADCs: {},
    GCP_CONFIGURATIONS: [],
    GCP_PROJECTS: [],
    ACTIVITIES: [],
  });

  return {
    get: <TKey extends keyof GLOBAL_CACHE>(key: TKey): GLOBAL_CACHE[TKey] => {
      return cache[key] as GLOBAL_CACHE[TKey];
    },

    getGcpConfigADC: (gcpConfigName: string) => {
      return cache["ADCs"][gcpConfigName];
    },
    addGcpConfigADC: (
      gcpConfigName: string,
      ADC: APPLICATION_DEFAULT_CREDENTIAL
    ) => {
      cache["ADCs"][gcpConfigName] = ADC;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },
    removeGcpConfigADC: async (gcpConfigName: string) => {
      delete cache["ADCs"][gcpConfigName];
      await extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    setGcpConfigurations: (gcpConfigurations: GCP_CONFIGURATION[]) => {
      cache["GCP_CONFIGURATIONS"] = gcpConfigurations;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    getActiveGcpConfiguration: () => {
      return cache["GCP_CONFIGURATIONS"].find(
        (gcpConfig) => gcpConfig.is_active
      );
    },

    setGcpProjects: (gcpProjects: GCP_PROJECT[]) => {
      cache["GCP_PROJECTS"] = gcpProjects;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    addActivity: (activity: ACTIVITY) => {
      cache["ACTIVITIES"].push(activity);
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },

    clearUnusedCache: () => {
      const newADCs: GLOBAL_CACHE["ADCs"] = {};
      cache["GCP_CONFIGURATIONS"].forEach((gcpConfig) => {
        newADCs[gcpConfig.name] = cache["ADCs"][gcpConfig.name];
      });

      cache["ADCs"] = newADCs;
      extensionContext.globalState.update(CACHE_VERSION, cache);
    },
  };
};

const refreshGcpConfigurations = async (
  extensionContext: vscode.ExtensionContext
) => {
  const gcpConfigurations = await getGcpConfigurations();

  if (!gcpConfigurations) {
    return [];
  }

  globalCache(extensionContext).setGcpConfigurations(gcpConfigurations);

  return gcpConfigurations;
};

const refreshGcpProjects = async (
  extensionContext: vscode.ExtensionContext
) => {
  const gcpProjects = await getGcpProjects();

  if (!gcpProjects) {
    return [];
  }

  globalCache(extensionContext).setGcpProjects(gcpProjects);

  return gcpProjects;
};

export { globalCache, refreshGcpConfigurations, refreshGcpProjects };
