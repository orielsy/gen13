# Gen13

**Gen13** is an experimental deterministic simulation and visualization environment. The first physical system is **LIGHT**.

The project is intentionally starting smaller than a game engine, renderer, or generalized physics framework. The first question is whether one physical phenomenon can be made correct, inspectable, manipulable, and eventually interrogable through language.

## Working model

The current core is deliberately simple:

```text
Scene + Command
      ↓
    Reducer
      ↓
   New Scene
      ↓
     solve
      ↓
     Trace
      ↓
      SVG
```

- **Scene** — what exists.
- **Command** — what should change. All state mutation goes through commands.
- **Trace** — what happened, including the physical quantities needed to explain why.
- **SVG** — one view of the Trace, not the source of physical truth.

**Genie** is the planned natural-language interface. It will eventually translate language into validated Gen13 commands and use trace data for grounded explanations. It is not part of the simulation's correctness path.

## v0.1

v0.0 established the deterministic headless core. v0.1 adds the first browser visualization without moving physics into the UI.

The current experiment has:

- one ray
- one flat optical boundary
- angle control dispatched as `setRayAngle`
- material control dispatched as `setSurfaceMaterial`
- SVG incident, reflected, transmitted, surface, and normal lines
- a selectable trace event
- an inspector whose physical values come directly from `Trace`
- the exact last command displayed so the state transition is visible

The renderer does not calculate Snell's law, Fresnel behavior, or total internal reflection. It consumes the directions and values produced by the solver.

## Physics and math sources

The solver implements established geometrical-optics and ray-intersection equations; it does not invent the underlying physics.

See [docs/physics-references.md](docs/physics-references.md) for the equations, derivations used by the implementation, and source references for:

- Snell's law
- total internal reflection and the critical angle
- law of reflection / reflection vectors
- Fresnel equations
- ray/interface intersection
- the Brewster-angle test oracle

The code in `src/solve.ts` points back to the relevant sections of that document so a numerical result can be followed from source equation → implementation → Trace → test.

## Development

Requires Node 22+.

```bash
npm install
npm run dev
```

Vite will print the local URL for the LIGHT experiment.

Verification:

```bash
npm run typecheck
npm test
npm run build
```

## Architectural constraints

1. Gen13 must remain useful without Genie.
2. The UI must not gain a second state-mutation path; it dispatches the same commands as every other client.
3. The solver does not know about DOM, Canvas, SVG, WebGPU, or an LLM.
4. The renderer does not compute physics.
5. The inspector formats Trace evidence rather than re-deriving physical values.
6. Trace events carry stable referents so an inspector or Genie can answer questions such as “why did that ray bend?”
7. Do not generalize LIGHT into a multi-system engine until a second physical system creates evidence for an abstraction.
8. WebGPU and WebLLM should earn their place through demonstrated need rather than being architectural prerequisites.
9. New physical equations should include a durable source in `docs/physics-references.md` and an analytic test where practical.

## Relationship to orielsy.com

The implementation lives here. Research notes, findings, and eventual demos may be presented on [orielsy.com](https://orielsy.com), but the portfolio site is not the Gen13 source repository.
