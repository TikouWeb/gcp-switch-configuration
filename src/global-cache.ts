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

const globalCache = (context: vscode.ExtensionContext) => {
  const cache = context.globalState.get<GLOBAL_CACHE>(CACHE_VERSION, {
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
      context.globalState.update(CACHE_VERSION, cache);
    },
    removeGcpConfigADC: async (gcpConfigName: string) => {
      delete cache["ADCs"][gcpConfigName];
      await context.globalState.update(CACHE_VERSION, cache);
    },

    setGcpConfigurations: (gcpConfigurations: GCP_CONFIGURATION[]) => {
      cache["GCP_CONFIGURATIONS"] = gcpConfigurations;
      context.globalState.update(CACHE_VERSION, cache);
    },

    getActiveGcpConfiguration: () => {
      return cache["GCP_CONFIGURATIONS"].find(
        (gcpConfig) => gcpConfig.is_active
      );
    },

    setGcpProjects: (gcpProjects: GCP_PROJECT[]) => {
      cache["GCP_PROJECTS"] = gcpProjects;
      context.globalState.update(CACHE_VERSION, cache);
    },

    addActivity: (activity: ACTIVITY) => {
      cache["ACTIVITIES"].push(activity);
      context.globalState.update(CACHE_VERSION, cache);
    },

    clearUnusedCache: () => {
      const newADCs: GLOBAL_CACHE["ADCs"] = {};
      cache["GCP_CONFIGURATIONS"].forEach((gcpConfig) => {
        newADCs[gcpConfig.name] = cache["ADCs"][gcpConfig.name];
      });

      cache["ADCs"] = newADCs;
      context.globalState.update(CACHE_VERSION, cache);
    },
  };
};

const refreshGcpConfigurations = async (context: vscode.ExtensionContext) => {
  const gcpConfigurations = await getGcpConfigurations();

  if (!gcpConfigurations) {
    return [];
  }

  globalCache(context).setGcpConfigurations(gcpConfigurations);

  return gcpConfigurations;
};

const refreshGcpProjects = async (context: vscode.ExtensionContext) => {
  const gcpProjects = await getGcpProjects();

  if (!gcpProjects) {
    return [];
  }

  globalCache(context).setGcpProjects(gcpProjects);

  return gcpProjects;
};

export { globalCache, refreshGcpConfigurations, refreshGcpProjects };
