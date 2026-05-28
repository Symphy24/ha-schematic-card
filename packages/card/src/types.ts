export type HaSchematicCardConfig = {
  type?: string;
  payload?: string;
  title?: string;
};

export type HomeAssistant = {
  states?: Record<string, {
    state: string;
    attributes?: Record<string, unknown>;
  }>;
};
