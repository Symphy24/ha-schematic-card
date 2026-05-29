import type {
  SchematicCircle,
  SchematicConditionalStyle,
  SchematicEntityValue,
  SchematicGroup,
  SchematicItem,
  SchematicLine,
  SchematicPath,
  SchematicPayload,
  SchematicPoint,
  SchematicPolyline,
  SchematicRect,
  SchematicStyle,
  SchematicSymbolDefinition,
  SchematicSymbolInstance,
  SchematicText,
  SchematicVisibilityCondition
} from "@ha-schematic-card/schema";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DEFAULT_CLASS_NAME = "ha-schematic-card-svg";
const SAFE_CSS_VARIABLES = new Set([
  "var(--primary-text-color)",
  "var(--secondary-text-color)",
  "var(--divider-color)",
  "var(--accent-color)",
  "var(--error-color)",
  "var(--warning-color)",
  "var(--success-color)"
]);

export const SCHEMATIC_RENDERER_NAME = "ha-schematic-renderer";

export type RenderOptions = {
  document?: Document;
  entityStates?: Record<string, EntityStateValue>;
  className?: string;
};

export type EntityStateValue = string | number | boolean | null | undefined | {
  state: unknown;
  attributes?: Record<string, unknown>;
};

type RenderContext = {
  document: Document;
  entityStates?: Record<string, EntityStateValue>;
  symbols: Map<string, SchematicSymbolDefinition>;
};

export function renderSchematicSvg(payload: SchematicPayload, options: RenderOptions = {}): SVGSVGElement {
  const documentRef = options.document ?? document;
  const context: RenderContext = {
    document: documentRef,
    entityStates: options.entityStates,
    symbols: new Map((payload.symbols ?? []).map((symbol) => [symbol.id, symbol]))
  };
  const svg = createSvgElement(documentRef, "svg");
  const className = options.className ?? DEFAULT_CLASS_NAME;

  setStringAttr(svg, "class", className);
  setStringAttr(svg, "viewBox", `0 0 ${payload.viewport.width} ${payload.viewport.height}`);
  setStringAttr(svg, "preserveAspectRatio", "xMidYMid meet");
  setNumberAttr(svg, "width", payload.viewport.width);
  setNumberAttr(svg, "height", payload.viewport.height);

  for (const item of sortItemsByLayer(payload.items)) {
    const element = renderItem(item, context);

    if (element) {
      svg.append(element);
    }
  }

  return svg;
}

export function sortItemsByLayer(items: SchematicItem[]): SchematicItem[] {
  return [...items].sort((left, right) => left.layer - right.layer);
}

function renderItem(item: SchematicItem, context: RenderContext): SVGElement | null {
  if (!isItemVisible(item, context.entityStates)) {
    return null;
  }

  switch (item.type) {
    case "line":
      return renderLine(context.document, item, context);
    case "polyline":
      return renderPolyline(context.document, item, context);
    case "rect":
      return renderRect(context.document, item, context);
    case "circle":
      return renderCircle(context.document, item, context);
    case "text":
      return renderText(context.document, item, context);
    case "path":
      return renderPath(context.document, item, context);
    case "group":
      return renderGroup(item, context);
    case "entityValue":
      return renderEntityValue(context.document, item, context);
    case "symbol":
      return renderSymbol(item, context);
  }
}

function isItemVisible(item: SchematicItem, entityStates: Record<string, EntityStateValue> | undefined): boolean {
  if (item.visible === false) {
    return false;
  }

  if (!item.visibleWhen) {
    return true;
  }

  return evaluateVisibilityCondition(item.visibleWhen, entityStates);
}

function evaluateVisibilityCondition(
  condition: SchematicVisibilityCondition,
  entityStates: Record<string, EntityStateValue> | undefined
): boolean {
  if (!entityStates || !Object.hasOwn(entityStates, condition.entityId)) {
    return false;
  }

  const state = getEntityState(entityStates[condition.entityId]);
  return state !== null && state !== undefined && String(state) === condition.equals;
}

function renderLine(documentRef: Document, item: SchematicLine, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "line");
  setBaseAttrs(element, item);
  setNumberAttr(element, "x1", item.x1);
  setNumberAttr(element, "y1", item.y1);
  setNumberAttr(element, "x2", item.x2);
  setNumberAttr(element, "y2", item.y2);
  applyItemStyle(element, item, context.entityStates);
  return element;
}

function renderPolyline(documentRef: Document, item: SchematicPolyline, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "polyline");
  setBaseAttrs(element, item);
  setStringAttr(element, "points", formatPoints(item.points));
  applyItemStyle(element, item, context.entityStates);
  return element;
}

function renderRect(documentRef: Document, item: SchematicRect, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "rect");
  setBaseAttrs(element, item);
  setNumberAttr(element, "x", item.x);
  setNumberAttr(element, "y", item.y);
  setNumberAttr(element, "width", item.width);
  setNumberAttr(element, "height", item.height);
  setNumberAttr(element, "rx", item.rx);
  setNumberAttr(element, "ry", item.ry);
  applyItemStyle(element, item, context.entityStates);
  return element;
}

function renderCircle(documentRef: Document, item: SchematicCircle, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "circle");
  setBaseAttrs(element, item);
  setNumberAttr(element, "cx", item.cx);
  setNumberAttr(element, "cy", item.cy);
  setNumberAttr(element, "r", item.r);
  applyItemStyle(element, item, context.entityStates);
  return element;
}

function renderText(documentRef: Document, item: SchematicText, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "text");
  setBaseAttrs(element, item);
  setNumberAttr(element, "x", item.x);
  setNumberAttr(element, "y", item.y);
  element.textContent = item.text;
  applyItemStyle(element, item, context.entityStates);
  return element;
}

function renderPath(documentRef: Document, item: SchematicPath, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "path");
  setBaseAttrs(element, item);
  setStringAttr(element, "d", item.d);
  applyItemStyle(element, item, context.entityStates);
  return element;
}

function renderGroup(item: SchematicGroup, context: RenderContext): SVGElement {
  const documentRef = context.document;
  const element = createSvgElement(documentRef, "g");
  setBaseAttrs(element, item);
  applyItemStyle(element, item, context.entityStates);

  for (const child of sortItemsByLayer(item.children)) {
    const childElement = renderItem(child, context);

    if (childElement) {
      element.append(childElement);
    }
  }

  return element;
}

function renderEntityValue(documentRef: Document, item: SchematicEntityValue, context: RenderContext): SVGElement {
  const element = createSvgElement(documentRef, "g");
  setBaseAttrs(element, item);
  applyItemStyle(element, item, context.entityStates);

  if (item.label) {
    const label = createSvgElement(documentRef, "text");
    setStringAttr(label, "data-role", "label");
    setNumberAttr(label, "x", item.x);
    setNumberAttr(label, "y", item.y);
    label.textContent = item.label;
    element.append(label);
  }

  const value = createSvgElement(documentRef, "text");
  setStringAttr(value, "data-role", "value");
  setNumberAttr(value, "x", item.x);
  setNumberAttr(value, "y", item.label ? item.y + 16 : item.y);
  value.textContent = getEntityValueText(item, context.entityStates);
  element.append(value);

  return element;
}

function renderSymbol(item: SchematicSymbolInstance, context: RenderContext): SVGElement | null {
  const symbol = context.symbols.get(item.symbolId);

  if (!symbol) {
    return null;
  }

  const element = createSvgElement(context.document, "g");
  setBaseAttrs(element, item);
  setStringAttr(element, "data-symbol-id", item.symbolId);
  setStringAttr(element, "transform", formatSymbolTransform(item));
  applyItemStyle(element, item, context.entityStates);

  for (const child of sortItemsByLayer(symbol.items)) {
    const childElement = renderItem(child, context);

    if (childElement) {
      element.append(childElement);
    }
  }

  return element;
}

function setBaseAttrs(element: SVGElement, item: SchematicItem): void {
  setStringAttr(element, "data-id", item.id);
  setNumberAttr(element, "data-layer", item.layer);
  setStringAttr(element, "transform", formatTransform(item.transform));
}

function applyItemStyle(
  element: SVGElement,
  item: SchematicItem,
  entityStates: Record<string, EntityStateValue> | undefined
): void {
  applySafeStyle(element, resolveItemStyle(item, entityStates));
}

function resolveItemStyle(
  item: SchematicItem,
  entityStates: Record<string, EntityStateValue> | undefined
): SchematicStyle | undefined {
  if (!item.styleWhen || item.styleWhen.length === 0) {
    return item.style;
  }

  const matchedStyles = item.styleWhen
    .filter((entry) => evaluateConditionalStyle(entry, entityStates))
    .map((entry) => entry.style);

  return Object.assign({}, item.style, ...matchedStyles) as SchematicStyle;
}

function evaluateConditionalStyle(
  entry: SchematicConditionalStyle,
  entityStates: Record<string, EntityStateValue> | undefined
): boolean {
  return evaluateVisibilityCondition(entry.when, entityStates);
}

function getEntityValueText(
  item: SchematicEntityValue,
  entityStates: Record<string, EntityStateValue> | undefined
): string {
  const entityState = entityStates && Object.hasOwn(entityStates, item.entityId)
    ? entityStates[item.entityId]
    : undefined;
  const state = getEntityState(entityState);

  if (isUnavailableState(state)) {
    return item.fallback ?? item.unavailableText ?? "";
  }

  const formattedState = formatEntityState(state, item.precision);
  const unit = item.unit ?? getEntityUnit(entityState);

  if (formattedState !== "") {
    return unit ? `${formattedState} ${unit}` : formattedState;
  }

  return item.fallback ?? "";
}

function getEntityState(value: EntityStateValue): unknown {
  if (isEntityStateObject(value)) {
    return value.state;
  }

  return value;
}

function getEntityUnit(value: EntityStateValue): string | undefined {
  if (!isEntityStateObject(value)) {
    return undefined;
  }

  const unit = value.attributes?.unit_of_measurement;
  return typeof unit === "string" && unit.length > 0 ? unit : undefined;
}

function isEntityStateObject(value: EntityStateValue): value is { state: unknown; attributes?: Record<string, unknown> } {
  return typeof value === "object" && value !== null && "state" in value;
}

function isUnavailableState(value: unknown): boolean {
  return value === null
    || value === undefined
    || value === ""
    || value === "unknown"
    || value === "unavailable";
}

function formatEntityState(value: unknown, precision: number | undefined): string {
  const numericValue = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;

  if (Number.isFinite(numericValue) && precision !== undefined) {
    return numericValue.toFixed(precision);
  }

  return String(value);
}

function applySafeStyle(element: SVGElement, style: SchematicStyle | undefined): void {
  if (!style) {
    return;
  }

  setSafePaintAttr(element, "stroke", style.stroke);
  setNumberAttr(element, "stroke-width", style.strokeWidth);
  setSafeDasharrayAttr(element, style.strokeDasharray);
  setSafePaintAttr(element, "fill", style.fill);
  setNumberAttr(element, "opacity", style.opacity);
  setNumberAttr(element, "font-size", style.fontSize);
  setSafeFontWeightAttr(element, style.fontWeight);
  setSafeTextAnchorAttr(element, style.textAnchor);
}

function formatPoints(points: SchematicPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function formatTransform(transform: SchematicItem["transform"]): string | undefined {
  if (!transform || transform.length === 0) {
    return undefined;
  }

  return transform.map((item) => {
    switch (item.type) {
      case "translate":
        return `translate(${item.x} ${item.y})`;
      case "rotate":
        return item.cx === undefined || item.cy === undefined
          ? `rotate(${item.angle})`
          : `rotate(${item.angle} ${item.cx} ${item.cy})`;
      case "scale":
        return item.y === undefined
          ? `scale(${item.x})`
          : `scale(${item.x} ${item.y})`;
    }
  }).join(" ");
}

function formatSymbolTransform(item: SchematicSymbolInstance): string {
  return [
    `translate(${item.x} ${item.y})`,
    item.scale === undefined ? undefined : `scale(${item.scale})`,
    formatTransform(item.transform)
  ].filter((value) => value !== undefined && value.length > 0).join(" ");
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  documentRef: Document,
  tagName: K
): SVGElementTagNameMap[K] {
  return documentRef.createElementNS(SVG_NAMESPACE, tagName);
}

function setNumberAttr(element: SVGElement, name: string, value: number | undefined): void {
  if (value === undefined || !Number.isFinite(value)) {
    return;
  }

  element.setAttribute(name, String(value));
}

function setStringAttr(element: SVGElement, name: string, value: string | number | undefined): void {
  if (value === undefined || value === null) {
    return;
  }

  element.setAttribute(name, String(value));
}

function setSafePaintAttr(element: SVGElement, name: "stroke" | "fill", value: string | undefined): void {
  if (!value || !isSafePaintValue(value)) {
    return;
  }

  element.setAttribute(name, value);
}

function setSafeDasharrayAttr(element: SVGElement, value: string | undefined): void {
  if (!value || !/^[\d\s,.-]+$/.test(value)) {
    return;
  }

  element.setAttribute("stroke-dasharray", value);
}

function setSafeFontWeightAttr(element: SVGElement, value: SchematicStyle["fontWeight"]): void {
  if (value === "normal" || value === "bold" || typeof value === "number") {
    element.setAttribute("font-weight", String(value));
  }
}

function setSafeTextAnchorAttr(element: SVGElement, value: SchematicStyle["textAnchor"]): void {
  if (value === "start" || value === "middle" || value === "end") {
    element.setAttribute("text-anchor", value);
  }
}

function isSafePaintValue(value: string): boolean {
  if (SAFE_CSS_VARIABLES.has(value)) {
    return true;
  }

  return /^(none|transparent|currentColor|#[0-9a-fA-F]{3,8}|rgb\([\d\s,%.]+\)|rgba\([\d\s,%.]+\)|hsl\([\d\s,%.]+\)|hsla\([\d\s,%.]+\))$/.test(value);
}
