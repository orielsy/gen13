# AGENTS.md

Gen13 is an experimental deterministic simulation and visualization environment. Read `README.md` before making substantive changes.

## Current phase

The repository is in **v0.1: first inspectable LIGHT visualization**.

The headless Scene → Command → Reducer → Solve → Trace core is established. The current browser experiment renders that Trace and lets a user manipulate the Scene through the same command path future Genie output will use.

## Invariants

1. **All mutation goes through commands.** Do not let UI code, tests, or future Genie integrations create a second write path into Scene state.
2. **The solver is deterministic and DOM-free.** It must not import a renderer, browser API, UI framework, WebGPU, or LLM runtime.
3. **The renderer is a consumer.** It may visualize Scene + Trace but must not compute physical outcomes.
4. **The inspector is a formatter.** Physical values shown to users should come from Trace rather than being re-derived in UI code.
5. **Trace is evidence, not decoration.** Record the quantities that caused an outcome so an inspector or Genie can explain it without reconstructing physics from pixels.
6. **Trace referents are stable.** Events and source entities need deterministic IDs so selections and natural-language references can resolve to exact simulation facts.
7. **Genie does not own truth.** A future model may translate language into validated commands and narrate trace data, but it must not invent simulation values.
8. **Avoid premature engine abstractions.** LIGHT is concrete until a second physical system demonstrates a real shared abstraction.
9. **WebGPU and WebLLM are candidate layers, not prerequisites.** Introduce them only when an experiment creates a reason.
10. **Keep Gen13 separate from orielsy.com.** The portfolio site may publish research and demos; this repository owns the implementation.

## Testing discipline

Prefer analytic oracles over snapshot-only tests. When adding physical behavior, include a known result or invariant that can falsify the implementation.

For the current optics work, useful checks include Snell's law, total internal reflection critical angle, Fresnel coefficients, deterministic replay, and end-to-end state changes that prove UI-style interactions still travel through Command → Reducer → Solve.

New physical equations should include a durable source in `docs/physics-references.md`.

## Browser experiment

The v0.1 app is intentionally plain TypeScript + SVG. Do not introduce a UI framework merely for convenience. Rendering may project coordinates, extend direction vectors for display, and format Trace values; it may not decide physical outcomes.

## Future Genie evals

Seed natural-language-to-command examples in `evals/commands.jsonl` as interaction ideas emerge. Include selection/context when a phrase depends on referents such as “that ray” or “this surface.”
