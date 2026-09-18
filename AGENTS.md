# AGENTS.md

Gen13 is an experimental deterministic simulation and visualization environment. Read `README.md` before making substantive changes.

## Current phase

The repository is in **v0.0: headless LIGHT core**. The goal is to prove the state, command, solver, and trace contracts before adding rendering.

## Invariants

1. **All mutation goes through commands.** Do not let UI code, tests, or future Genie integrations create a second write path into Scene state.
2. **The solver is deterministic and DOM-free.** It must not import a renderer, browser API, UI framework, WebGPU, or LLM runtime.
3. **The renderer is a consumer.** When rendering arrives, it may visualize Scene + Trace but must not compute physical outcomes.
4. **Trace is evidence, not decoration.** Record the quantities that caused an outcome so an inspector or Genie can explain it without reconstructing physics from pixels.
5. **Trace referents are stable.** Events and source entities need deterministic IDs so selections and natural-language references can resolve to exact simulation facts.
6. **Genie does not own truth.** A future model may translate language into validated commands and narrate trace data, but it must not invent simulation values.
7. **Avoid premature engine abstractions.** LIGHT is concrete until a second physical system demonstrates a real shared abstraction.
8. **WebGPU and WebLLM are candidate layers, not prerequisites.** Introduce them only when an experiment creates a reason.
9. **Keep Gen13 separate from orielsy.com.** The portfolio site may publish research and demos; this repository owns the implementation.

## Testing discipline

Prefer analytic oracles over snapshot-only tests. When adding physical behavior, include a known result or invariant that can falsify the implementation.

For the current optics work, useful checks include Snell's law, total internal reflection critical angle, Fresnel coefficients, and deterministic replay.

## Future Genie evals

Seed natural-language-to-command examples in `evals/commands.jsonl` as interaction ideas emerge. Include selection/context when a phrase depends on referents such as “that ray” or “this surface.”
