export const HSC_SCHEMA_VERSION = 1;

export const LAYER_ZONES = {
  background: { min: 0, max: 99 },
  pipesAndDucts: { min: 100, max: 199 },
  flow: { min: 200, max: 299 },
  components: { min: 300, max: 399 },
  symbolDetails: { min: 400, max: 499 },
  sensors: { min: 500, max: 599 },
  labels: { min: 600, max: 699 },
  alarms: { min: 700, max: 799 },
  overlay: { min: 900, max: 1000 }
} as const;

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type SchematicPayload = {
  schemaVersion: number;
  metadata?: SchematicMetadata;
  viewport: SchematicViewport;
  items: SchematicItem[];
};

export type SchematicMetadata = {
  name?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
};

export type SchematicViewport = {
  width: number;
  height: number;
};

export type SchematicPoint = {
  x: number;
  y: number;
};

export type SchematicStyle = {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  opacity?: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | number;
  textAnchor?: "start" | "middle" | "end";
};

export type SchematicBaseItem = {
  id: string;
  layer: number;
  visible?: boolean;
  style?: SchematicStyle;
  transform?: SchematicTransform[];
};

export type SchematicTransform =
  | {
      type: "translate";
      x: number;
      y: number;
    }
  | {
      type: "rotate";
      angle: number;
      cx?: number;
      cy?: number;
    }
  | {
      type: "scale";
      x: number;
      y?: number;
    };

export type SchematicLine = SchematicBaseItem & {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type SchematicPolyline = SchematicBaseItem & {
  type: "polyline";
  points: SchematicPoint[];
};

export type SchematicRect = SchematicBaseItem & {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
};

export type SchematicCircle = SchematicBaseItem & {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
};

export type SchematicText = SchematicBaseItem & {
  type: "text";
  x: number;
  y: number;
  text: string;
};

export type SchematicPath = SchematicBaseItem & {
  type: "path";
  d: string;
};

export type SchematicGroup = SchematicBaseItem & {
  type: "group";
  children: SchematicItem[];
};

export type SchematicEntityValue = SchematicBaseItem & {
  type: "entityValue";
  x: number;
  y: number;
  entityId: string;
  label?: string;
  unit?: string;
  fallback?: string;
};

export type SchematicItem =
  | SchematicLine
  | SchematicPolyline
  | SchematicRect
  | SchematicCircle
  | SchematicText
  | SchematicPath
  | SchematicGroup
  | SchematicEntityValue;

const SUPPORTED_ITEM_TYPES = new Set([
  "line",
  "polyline",
  "rect",
  "circle",
  "text",
  "path",
  "group",
  "entityValue"
]);

export function isSchematicPayload(value: unknown): value is SchematicPayload {
  return validateSchematicPayload(value).valid;
}

export function validateSchematicPayload(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ["payload must be an object"]
    };
  }

  if (value.schemaVersion !== HSC_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${HSC_SCHEMA_VERSION}`);
  }

  validateViewport(value.viewport, errors);

  if (!Array.isArray(value.items)) {
    errors.push("items must be an array");
  } else {
    value.items.forEach((item, index) => validateItem(item, `items[${index}]`, errors));
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateViewport(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("viewport must be an object");
    return;
  }

  if (!isPositiveNumber(value.width)) {
    errors.push("viewport.width must be a positive number");
  }

  if (!isPositiveNumber(value.height)) {
    errors.push("viewport.height must be a positive number");
  }
}

function validateItem(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    errors.push(`${path}.id must be a non-empty string`);
  }

  if (typeof value.type !== "string" || !SUPPORTED_ITEM_TYPES.has(value.type)) {
    errors.push(`${path}.type must be a supported item type`);
  }

  if (typeof value.layer !== "number" || !Number.isFinite(value.layer)) {
    errors.push(`${path}.layer must be a finite number`);
  }

  validateTransforms(value.transform, `${path}.transform`, errors);

  if (value.type === "path") {
    validatePathData(value.d, `${path}.d`, errors);
  }

  if (value.type === "group") {
    if (!Array.isArray(value.children)) {
      errors.push(`${path}.children must be an array`);
    } else {
      value.children.forEach((child, index) => validateItem(child, `${path}.children[${index}]`, errors));
    }
  }
}

function validatePathData(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty path data string`);
    return;
  }

  const lowerValue = value.toLowerCase();
  if (
    value.includes("<")
    || value.includes(">")
    || value.includes("\"")
    || value.includes("'")
    || lowerValue.includes("script")
    || lowerValue.includes("javascript:")
    || lowerValue.includes("url(")
    || !/^[MmZzLlHhVvCcSsQqTtAaEe0-9,\s.+-]+$/.test(value)
  ) {
    errors.push(`${path} contains unsupported or unsafe path data`);
  }
}

function validateTransforms(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((transform, index) => validateTransform(transform, `${path}[${index}]`, errors));
}

function validateTransform(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  switch (value.type) {
    case "translate":
      validateFiniteNumber(value.x, `${path}.x`, errors);
      validateFiniteNumber(value.y, `${path}.y`, errors);
      return;
    case "rotate":
      validateFiniteNumber(value.angle, `${path}.angle`, errors);
      validateOptionalFiniteNumber(value.cx, `${path}.cx`, errors);
      validateOptionalFiniteNumber(value.cy, `${path}.cy`, errors);
      return;
    case "scale":
      validateFiniteNumber(value.x, `${path}.x`, errors);
      validateOptionalFiniteNumber(value.y, `${path}.y`, errors);
      return;
    default:
      errors.push(`${path}.type must be a supported transform type`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateFiniteNumber(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path} must be a finite number`);
  }
}

function validateOptionalFiniteNumber(value: unknown, path: string, errors: string[]): void {
  if (value !== undefined) {
    validateFiniteNumber(value, path, errors);
  }
}
