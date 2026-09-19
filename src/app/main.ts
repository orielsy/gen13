import { parseCommand, type Command } from "../commands";
import { applyCommand } from "../reducer";
import { solve } from "../solve";
import type { Trace, TraceEvent } from "../trace";
import { createDemoScene } from "./demo-scene";
import { renderInspector } from "./inspector";
import { renderTrace, type TraceSelection } from "./render";

function requiredElement<T extends Element>(
  selector: string,
): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Gen13 LIGHT could not find required element: ${selector}`);
  }

  return element;
}

const svg = requiredElement<SVGSVGElement>("#trace-view");
const inspector = requiredElement<HTMLElement>("#inspector");
const angleInput = requiredElement<HTMLInputElement>("#angle-input");
const angleOutput = requiredElement<HTMLOutputElement>("#angle-output");
const materialInput =
  requiredElement<HTMLSelectElement>("#material-input");
const commandOutput =
  requiredElement<HTMLElement>("#command-output");

let scene = createDemoScene();
let trace: Trace = solve(scene);
let selection: TraceSelection | null = {
  type: "trace-event",
  id: trace.rays[0]?.events[0]?.id ?? "",
};

function selectedEvent(): TraceEvent | null {
  if (!selection) {
    return null;
  }

  for (const rayTrace of trace.rays) {
    const event = rayTrace.events.find(
      (candidate) => candidate.id === selection?.id,
    );

    if (event) {
      return event;
    }
  }

  return null;
}

function render(): void {
  trace = solve(scene);

  // Deterministic IDs mean the same interaction remains selected across edits.
  if (!selectedEvent()) {
    const first = trace.rays[0]?.events[0];
    selection = first
      ? { type: "trace-event", id: first.id }
      : null;
  }

  renderTrace(svg, scene, trace, {
    selection,
    onSelect(nextSelection) {
      selection = nextSelection;
      render();
    },
  });

  renderInspector(inspector, scene, selectedEvent());
}

function dispatch(input: unknown): void {
  // UI input crosses the same runtime validation boundary future Genie output
  // will use. The UI never edits Scene directly.
  const command: Command = parseCommand(input);
  scene = applyCommand(scene, command);
  commandOutput.textContent = JSON.stringify(command, null, 2);
  render();
}

angleInput.addEventListener("input", () => {
  const degrees = Number(angleInput.value);
  angleOutput.value = `${degrees}°`;

  dispatch({
    op: "setRayAngle",
    target: "ray-1",
    degrees,
  });
});

materialInput.addEventListener("change", () => {
  dispatch({
    op: "setSurfaceMaterial",
    target: "surface-1",
    side: "b",
    material: materialInput.value,
  });
});

render();
