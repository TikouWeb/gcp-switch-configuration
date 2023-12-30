export type APPLICATION_DEFAULT_CREDENTIAL = {
  client_id: string;
  client_secret: string;
  quota_project_id: string;
  refresh_token: string;
  type: string;
};

export type GCP_ORGANIZATION = {
  creationTime: string;
  displayName: string;
  lifecycleState:
    | "ACTIVE"
    | "DELETE_REQUESTED"
    | "LIFECYCLE_STATE_UNSPECIFIED"
    | "DELETE_IN_PROGRESS";
  name: string;
};

export type GCP_PROJECT = {
  createTime: string;
  lifecycleState:
    | "ACTIVE"
    | "DELETE_REQUESTED"
    | "LIFECYCLE_STATE_UNSPECIFIED"
    | "DELETE_IN_PROGRESS";
  name: string;
  projectId: string;
  projectNumber: string;
  parent?: {
    id: string;
    type: "folder" | "organization";
  };
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
export type GCP_CONFIG_FORM = {
  configName: string;
  account: string;
  project: string;
};

export type ACTIVITY = {
  action: string;
  date: string;
};

export type GLOBAL_CACHE = {
  ADCs: Record<GCP_CONFIGURATION["name"], APPLICATION_DEFAULT_CREDENTIAL>;
  GCP_CONFIGURATIONS: GCP_CONFIGURATION[];
  GCP_PROJECTS: GCP_PROJECT[];
  ACTIVITIES: ACTIVITY[];
};
