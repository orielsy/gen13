import type { Scene, Vec2 } from "../scene";
import type { Trace, TraceEvent } from "../trace";

const SVG_NS = "http://www.w3.org/2000/svg";
const SCALE = 100;
const DISPLAY_RAY_LENGTH = 4.25;
const DISPLAY_SURFACE_HALF_LENGTH = 6;

export interface TraceSelection {
  readonly type: "trace-event";
  readonly id: string;
}

interface RenderOptions {
  readonly selection: TraceSelection | null;
  readonly onSelect: (selection: TraceSelection) => void;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  return element;
}

/**
 * Gen13 uses a normal mathematical coordinate system where +Y points upward.
 * SVG uses +Y downward, so rendering flips Y and applies a presentation-only
 * scale. No simulation values are changed.
 */
function toScreen(point: Vec2): Vec2 {
  return {
    x: point.x * SCALE,
    y: -point.y * SCALE,
  };
}

function endpoint(origin: Vec2, direction: Vec2, length: number): Vec2 {
  return {
    x: origin.x + direction.x * length,
    y: origin.y + direction.y * length,
  };
}

function line(
  from: Vec2,
  to: Vec2,
  className: string,
  extra: Record<string, string> = {},
): SVGLineElement {
  const a = toScreen(from);
  const b = toScreen(to);

  return svgElement("line", {
    x1: String(a.x),
    y1: String(a.y),
    x2: String(b.x),
    y2: String(b.y),
    class: className,
    ...extra,
  });
}

function label(
  text: string,
  at: Vec2,
  className = "scene-label",
): SVGTextElement {
  const point = toScreen(at);
  const node = svgElement("text", {
    x: String(point.x),
    y: String(point.y),
    class: className,
  });
  node.textContent = text;
  return node;
}

function firstEvent(trace: Trace): TraceEvent | null {
  return trace.rays[0]?.events[0] ?? null;
}

/**
 * Renderer contract:
 *
 * Scene + Trace -> SVG
 *
 * This module does not calculate refraction, reflection, Fresnel values, or
 * critical angles. Direction vectors and event positions come from Trace.
 * Scene is consulted only for drawable geometry and human-readable labels.
 */
export function renderTrace(
  svg: SVGSVGElement,
  scene: Scene,
  trace: Trace,
  options: RenderOptions,
): void {
  svg.replaceChildren();

  const surface = scene.surfaces[0];
  const ray = scene.rays[0];
  const event = firstEvent(trace);

  if (!surface || !ray) {
    return;
  }

  // Draw the infinite interface as a long finite line for the viewport.
  const normalLength = Math.hypot(surface.normal.x, surface.normal.y);
  const normal = {
    x: surface.normal.x / normalLength,
    y: surface.normal.y / normalLength,
  };
  const tangent = { x: -normal.y, y: normal.x };

  const surfaceStart = endpoint(
    surface.point,
    tangent,
    -DISPLAY_SURFACE_HALF_LENGTH,
  );
  const surfaceEnd = endpoint(
    surface.point,
    tangent,
    DISPLAY_SURFACE_HALF_LENGTH,
  );

  svg.append(
    line(surfaceStart, surfaceEnd, "surface-line"),
    label(
      scene.materials[surface.materialA]?.name ?? surface.materialA,
      { x: surface.point.x - 0.35, y: 3.45 },
      "material-label material-a",
    ),
    label(
      scene.materials[surface.materialB]?.name ?? surface.materialB,
      { x: surface.point.x + 0.35, y: 3.45 },
      "material-label material-b",
    ),
  );

  // The source itself is Scene data.
  const source = toScreen(ray.origin);
  svg.append(
    svgElement("circle", {
      cx: String(source.x),
      cy: String(source.y),
      r: "8",
      class: "source-point",
    }),
    label("source", { x: ray.origin.x - 0.1, y: ray.origin.y - 0.2 }),
  );

  if (!event || event.kind === "escape") {
    return;
  }

  // The incident line ends exactly where the solver says the interaction occurs.
  svg.append(line(ray.origin, event.at, "ray ray-incident"));

  // Draw the local surface normal through the interaction point.
  svg.append(
    line(
      endpoint(event.at, normal, -0.75),
      endpoint(event.at, normal, 0.75),
      "normal-line",
    ),
  );

  // Reflected direction is already a Trace result.
  svg.append(
    line(
      event.at,
      endpoint(event.at, event.reflectedDirection, DISPLAY_RAY_LENGTH),
      "ray ray-reflected",
    ),
  );

  if (event.kind === "refract") {
    // Transmitted direction is already a Trace result.
    svg.append(
      line(
        event.at,
        endpoint(event.at, event.transmittedDirection, DISPLAY_RAY_LENGTH),
        "ray ray-transmitted",
      ),
    );
  }

  const selected = options.selection?.id === event.id;
  const marker = toScreen(event.at);
  const hitTarget = svgElement("circle", {
    cx: String(marker.x),
    cy: String(marker.y),
    r: "18",
    class: selected ? "event-target selected" : "event-target",
    tabindex: "0",
    role: "button",
    "aria-label": `Inspect trace event ${event.id}`,
  });

  const select = () =>
    options.onSelect({
      type: "trace-event",
      id: event.id,
    });

  hitTarget.addEventListener("click", select);
  hitTarget.addEventListener("keydown", (keyboardEvent) => {
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault();
      select();
    }
  });

  svg.append(
    svgElement("circle", {
      cx: String(marker.x),
      cy: String(marker.y),
      r: "6",
      class: "event-point",
    }),
    hitTarget,
  );
}
