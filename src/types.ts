export type APPLICATION_DEFAULT_CREDENTIAL = {
  client_id: string;
  client_secret: string;
  quota_project_id: string;
  refresh_token: string;
  type: string;
};

export type GCP_CONFIGURATION = {
  name: string;
  is_active: boolean;
  properties: Record<string, any> & {
    core: {
      project: string;
      account: string;
    };
  };
};

export type NEW_CONFIG_FORM = {
  configName: string;
  account: string;
  project: string;
  activateConfig?: boolean;
};

export type ACTIVITY = {
  action: string;
  date: string;
};

export type GLOBAL_CACHE = {
  ADCs: Record<GCP_CONFIGURATION["name"], APPLICATION_DEFAULT_CREDENTIAL>;
  GCP_CONFIGURATIONS: GCP_CONFIGURATION[];
  ACTIVITIES: ACTIVITY[];
};
