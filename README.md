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
```

- **Scene** — what exists.
- **Command** — what should change. All state mutation goes through commands.
- **Trace** — what happened, including the physical quantities needed to explain why.

A renderer will consume Scene + Trace later. It must not compute physics.

**Genie** is the planned natural-language interface. It will eventually translate language into validated Gen13 commands and use trace data for grounded explanations. It is not part of the simulation's correctness path.

## v0.0

The first milestone is headless on purpose:

- TypeScript scene model
- typed/runtime-validated commands
- immutable reducer
- deterministic 2D ray/interface solver
- inspectable trace events with stable IDs
- analytic tests for Snell's law, total internal reflection, and Fresnel behavior
- seed eval cases for future Genie work

No renderer, UI framework, WebGPU solver, or LLM is required for v0.0.

## Development

Requires Node 22+.

```bash
npm install
npm test
npm run typecheck
```

## Architectural constraints

1. Gen13 must remain useful without Genie.
2. The UI must not gain a second state-mutation path; it will dispatch the same commands as every other client.
3. The solver does not know about DOM, Canvas, SVG, WebGPU, or an LLM.
4. The renderer does not compute physics.
5. Trace events carry stable referents so an inspector or Genie can answer questions such as “why did that ray bend?”
6. Do not generalize LIGHT into a multi-system engine until a second physical system creates evidence for an abstraction.
7. WebGPU and WebLLM should earn their place through demonstrated need rather than being architectural prerequisites.

## Relationship to orielsy.com

The implementation lives here. Research notes, findings, and eventual demos may be presented on [orielsy.com](https://orielsy.com), but the portfolio site is not the Gen13 source repository.
