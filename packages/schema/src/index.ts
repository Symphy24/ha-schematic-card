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
  symbols?: SchematicSymbolDefinition[];
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
  visibleWhen?: SchematicVisibilityCondition;
  style?: SchematicStyle;
  styleWhen?: SchematicConditionalStyle[];
  transform?: SchematicTransform[];
};

export type SchematicVisibilityCondition = {
  entityId: string;
  equals: string;
};

export type SchematicConditionalStyle = {
  when: SchematicVisibilityCondition;
  style: SchematicStyle;
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
  precision?: number;
  unavailableText?: string;
};

export type SchematicSymbolDefinition = {
  id: string;
  viewport?: SchematicViewport;
  items: SchematicSymbolChildItem[];
};

export type SchematicSymbolInstance = SchematicBaseItem & {
  type: "symbol";
  symbolId: string;
  x: number;
  y: number;
  scale?: number;
};

export type SchematicSymbolChildItem =
  | SchematicLine
  | SchematicPolyline
  | SchematicRect
  | SchematicCircle
  | SchematicText
  | SchematicPath
  | SchematicGroup
  | SchematicEntityValue;

export type SchematicItem =
  | SchematicLine
  | SchematicPolyline
  | SchematicRect
  | SchematicCircle
  | SchematicText
  | SchematicPath
  | SchematicGroup
  | SchematicEntityValue
  | SchematicSymbolInstance;

const SUPPORTED_ITEM_TYPES = new Set([
  "line",
  "polyline",
  "rect",
  "circle",
  "text",
  "path",
  "group",
  "entityValue",
  "symbol"
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
  const symbolIds = validateSymbols(value.symbols, errors);

  if (!Array.isArray(value.items)) {
    errors.push("items must be an array");
  } else {
    value.items.forEach((item, index) => validateItem(item, `items[${index}]`, errors, symbolIds));
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

function validateSymbols(value: unknown, errors: string[]): Set<string> {
  const symbolIds = new Set<string>();

  if (value === undefined) {
    return symbolIds;
  }

  if (!Array.isArray(value)) {
    errors.push("symbols must be an array");
    return symbolIds;
  }

  value.forEach((symbol, index) => {
    const path = `symbols[${index}]`;

    if (!isRecord(symbol)) {
      errors.push(`${path} must be an object`);
      return;
    }

    if (typeof symbol.id !== "string" || symbol.id.length === 0) {
      errors.push(`${path}.id must be a non-empty string`);
    } else if (symbolIds.has(symbol.id)) {
      errors.push(`${path}.id must be unique`);
    } else {
      symbolIds.add(symbol.id);
    }

    if (symbol.viewport !== undefined) {
      validateViewport(symbol.viewport, errors);
    }

    if (!Array.isArray(symbol.items)) {
      errors.push(`${path}.items must be an array`);
    } else {
      symbol.items.forEach((item, itemIndex) => validateItem(
        item,
        `${path}.items[${itemIndex}]`,
        errors,
        symbolIds,
        false
      ));
    }
  });

  return symbolIds;
}

function validateItem(
  value: unknown,
  path: string,
  errors: string[],
  symbolIds: Set<string>,
  allowSymbolReference = true
): void {
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
  validateVisibilityCondition(value.visibleWhen, `${path}.visibleWhen`, errors);
  validateConditionalStyles(value.styleWhen, `${path}.styleWhen`, errors);

  if (value.type === "path") {
    validatePathData(value.d, `${path}.d`, errors);
  }

  if (value.type === "symbol") {
    if (!allowSymbolReference) {
      errors.push(`${path}.type cannot be symbol inside a symbol definition`);
    }

    if (typeof value.symbolId !== "string" || value.symbolId.length === 0) {
      errors.push(`${path}.symbolId must be a non-empty string`);
    } else if (!symbolIds.has(value.symbolId)) {
      errors.push(`${path}.symbolId must reference a defined symbol`);
    }

    validateFiniteNumber(value.x, `${path}.x`, errors);
    validateFiniteNumber(value.y, `${path}.y`, errors);
    validateOptionalFiniteNumber(value.scale, `${path}.scale`, errors);
  }

  if (value.type === "entityValue") {
    if (typeof value.entityId !== "string" || value.entityId.length === 0) {
      errors.push(`${path}.entityId must be a non-empty string`);
    }

    validateOptionalString(value.unit, `${path}.unit`, errors);
    validateOptionalString(value.fallback, `${path}.fallback`, errors);
    validateOptionalString(value.unavailableText, `${path}.unavailableText`, errors);
    validateOptionalInteger(value.precision, `${path}.precision`, errors);
  }

  if (value.type === "group") {
    if (!Array.isArray(value.children)) {
      errors.push(`${path}.children must be an array`);
    } else {
      value.children.forEach((child, index) => validateItem(
        child,
        `${path}.children[${index}]`,
        errors,
        symbolIds,
        allowSymbolReference
      ));
    }
  }
}

function validateConditionalStyles(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;

    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      return;
    }

    validateVisibilityCondition(entry.when, `${entryPath}.when`, errors);
    validateStyle(entry.style, `${entryPath}.style`, errors);
  });
}

function validateStyle(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const supportedProperties = new Set([
    "stroke",
    "strokeWidth",
    "strokeDasharray",
    "fill",
    "opacity",
    "fontSize",
    "fontWeight",
    "textAnchor"
  ]);

  for (const property of Object.keys(value)) {
    if (!supportedProperties.has(property)) {
      errors.push(`${path}.${property} is not a supported style property`);
    }
  }

  validateOptionalString(value.stroke, `${path}.stroke`, errors);
  validateOptionalFiniteNumber(value.strokeWidth, `${path}.strokeWidth`, errors);
  validateOptionalString(value.strokeDasharray, `${path}.strokeDasharray`, errors);
  validateOptionalString(value.fill, `${path}.fill`, errors);
  validateOptionalFiniteNumber(value.opacity, `${path}.opacity`, errors);
  validateOptionalFiniteNumber(value.fontSize, `${path}.fontSize`, errors);

  if (
    value.fontWeight !== undefined
    && value.fontWeight !== "normal"
    && value.fontWeight !== "bold"
    && (typeof value.fontWeight !== "number" || !Number.isFinite(value.fontWeight))
  ) {
    errors.push(`${path}.fontWeight must be "normal", "bold", or a finite number`);
  }

  if (
    value.textAnchor !== undefined
    && value.textAnchor !== "start"
    && value.textAnchor !== "middle"
    && value.textAnchor !== "end"
  ) {
    errors.push(`${path}.textAnchor must be "start", "middle", or "end"`);
  }
}

function validateVisibilityCondition(value: unknown, path: string, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (typeof value.entityId !== "string" || value.entityId.length === 0) {
    errors.push(`${path}.entityId must be a non-empty string`);
  }

  if (typeof value.equals !== "string") {
    errors.push(`${path}.equals must be a string`);
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

function validateOptionalString(value: unknown, path: string, errors: string[]): void {
  if (value !== undefined && typeof value !== "string") {
    errors.push(`${path} must be a string`);
  }
}

function validateOptionalInteger(value: unknown, path: string, errors: string[]): void {
  if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < 0)) {
    errors.push(`${path} must be a non-negative integer`);
  }
}
