export type HaSchematicCardConfig = {
  type?: string;
  payload?: string;
  title?: string;
  min_height?: string;
};

export type HomeAssistant = {
  states?: Record<string, {
    state: string;
    attributes?: Record<string, unknown>;
  }>;
};
