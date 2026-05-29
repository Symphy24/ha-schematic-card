import type {
  SchematicCircle,
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
  SchematicText
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
  entityStates?: Record<string, unknown>;
  className?: string;
};

type RenderContext = {
  document: Document;
  entityStates?: Record<string, unknown>;
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
  if (item.visible === false) {
    return null;
  }

  switch (item.type) {
    case "line":
      return renderLine(context.document, item);
    case "polyline":
      return renderPolyline(context.document, item);
    case "rect":
      return renderRect(context.document, item);
    case "circle":
      return renderCircle(context.document, item);
    case "text":
      return renderText(context.document, item);
    case "path":
      return renderPath(context.document, item);
    case "group":
      return renderGroup(item, context);
    case "entityValue":
      return renderEntityValue(context.document, item, context);
    case "symbol":
      return renderSymbol(item, context);
  }
}

function renderLine(documentRef: Document, item: SchematicLine): SVGElement {
  const element = createSvgElement(documentRef, "line");
  setBaseAttrs(element, item);
  setNumberAttr(element, "x1", item.x1);
  setNumberAttr(element, "y1", item.y1);
  setNumberAttr(element, "x2", item.x2);
  setNumberAttr(element, "y2", item.y2);
  applySafeStyle(element, item.style);
  return element;
}

function renderPolyline(documentRef: Document, item: SchematicPolyline): SVGElement {
  const element = createSvgElement(documentRef, "polyline");
  setBaseAttrs(element, item);
  setStringAttr(element, "points", formatPoints(item.points));
  applySafeStyle(element, item.style);
  return element;
}

function renderRect(documentRef: Document, item: SchematicRect): SVGElement {
  const element = createSvgElement(documentRef, "rect");
  setBaseAttrs(element, item);
  setNumberAttr(element, "x", item.x);
  setNumberAttr(element, "y", item.y);
  setNumberAttr(element, "width", item.width);
  setNumberAttr(element, "height", item.height);
  setNumberAttr(element, "rx", item.rx);
  setNumberAttr(element, "ry", item.ry);
  applySafeStyle(element, item.style);
  return element;
}

function renderCircle(documentRef: Document, item: SchematicCircle): SVGElement {
  const element = createSvgElement(documentRef, "circle");
  setBaseAttrs(element, item);
  setNumberAttr(element, "cx", item.cx);
  setNumberAttr(element, "cy", item.cy);
  setNumberAttr(element, "r", item.r);
  applySafeStyle(element, item.style);
  return element;
}

function renderText(documentRef: Document, item: SchematicText): SVGElement {
  const element = createSvgElement(documentRef, "text");
  setBaseAttrs(element, item);
  setNumberAttr(element, "x", item.x);
  setNumberAttr(element, "y", item.y);
  element.textContent = item.text;
  applySafeStyle(element, item.style);
  return element;
}

function renderPath(documentRef: Document, item: SchematicPath): SVGElement {
  const element = createSvgElement(documentRef, "path");
  setBaseAttrs(element, item);
  setStringAttr(element, "d", item.d);
  applySafeStyle(element, item.style);
  return element;
}

function renderGroup(item: SchematicGroup, context: RenderContext): SVGElement {
  const documentRef = context.document;
  const element = createSvgElement(documentRef, "g");
  setBaseAttrs(element, item);
  applySafeStyle(element, item.style);

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
  applySafeStyle(element, item.style);

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
  applySafeStyle(element, item.style);

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

function getEntityValueText(item: SchematicEntityValue, entityStates: Record<string, unknown> | undefined): string {
  if (entityStates && Object.hasOwn(entityStates, item.entityId)) {
    return formatEntityState(entityStates[item.entityId], item.unit);
  }

  if (item.fallback !== undefined) {
    return item.unit ? `${item.fallback} ${item.unit}` : item.fallback;
  }

  return "";
}

function formatEntityState(value: unknown, unit: string | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return unit && text ? `${text} ${unit}` : text;
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
