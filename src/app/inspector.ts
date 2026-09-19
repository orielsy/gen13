import type { Scene } from "../scene";
import type { TraceEvent } from "../trace";

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

function row(label: string, value: string): HTMLElement {
  const wrapper = element("div", "evidence-row");
  wrapper.append(
    element("dt", undefined, label),
    element("dd", undefined, value),
  );
  return wrapper;
}

function degrees(value: number): string {
  return `${value.toFixed(2)}°`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function materialName(scene: Scene, id: string): string {
  return scene.materials[id]?.name ?? id;
}

/**
 * Inspector is intentionally a formatter, not a calculator.
 *
 * Every physical number shown here comes directly from Trace. That distinction
 * is important: the UI explains solver evidence rather than re-deriving it.
 */
export function renderInspector(
  root: HTMLElement,
  scene: Scene,
  event: TraceEvent | null,
): void {
  root.replaceChildren();

  if (!event) {
    root.append(
      element(
        "p",
        "empty-state",
        "No trace event is selected. Run the scene and select an interaction.",
      ),
    );
    return;
  }

  const badge = element(
    "div",
    `event-badge event-${event.kind}`,
    event.kind === "tir" ? "TOTAL INTERNAL REFLECTION" : event.kind.toUpperCase(),
  );
  const eventId = element("code", "event-id", event.id);
  const list = element("dl", "evidence-list");

  if (event.kind === "escape") {
    list.append(
      row("Result", "No compatible surface hit"),
      row("Event", event.reason),
    );
    root.append(badge, eventId, list);
    return;
  }

  list.append(
    row("From", materialName(scene, event.fromMaterial)),
    row("To", materialName(scene, event.toMaterial)),
    row("n₁", event.n1.toFixed(6)),
    row("n₂", event.n2.toFixed(6)),
    row("Incident angle", degrees(event.thetaIncidentDeg)),
    row("Wavelength", `${event.wavelengthNm.toFixed(1)} nm`),
  );

  if (event.kind === "refract") {
    list.append(
      row("Transmitted angle", degrees(event.thetaTransmittedDeg)),
      row("Reflectance", percent(event.fresnel.reflectance)),
      row("Transmittance", percent(event.fresnel.transmittance)),
    );

    const law = element("div", "law-card");
    law.append(
      element("span", "law-label", "Governing relation"),
      element("strong", undefined, "Snell's law"),
      element("code", undefined, "n₁ sin(θ₁) = n₂ sin(θ₂)"),
    );

    root.append(badge, eventId, list, law);
    return;
  }

  list.append(row("Critical angle", degrees(event.thetaCriticalDeg)));

  const law = element("div", "law-card");
  law.append(
    element("span", "law-label", "Why"),
    element(
      "strong",
      undefined,
      "Incident angle is above the critical angle",
    ),
    element("code", undefined, "θᵢ > asin(n₂ / n₁)"),
  );

  root.append(badge, eventId, list, law);
}
