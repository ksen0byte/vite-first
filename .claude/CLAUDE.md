### Architectural goals

* Prefer immutable data and pure functions.
* Model domain states explicitly.
* Replace ad-hoc booleans, nullable values, stringly-typed logic, and loose objects with proper domain types.
* Separate domain logic from IO, framework code, persistence, and transport code.
* Make invalid states unrepresentable where practical.
* Prefer explicit transitions via state machines over scattered conditional logic.
* Remove hidden coupling and side effects.
* Make behavior modular, testable, and composable.

### Type modeling rules

* Do not use `any`.
* Avoid `undefined` and `null` in domain code.
* Prefer explicit algebraic data types using discriminated unions.
* Replace optional fields that represent different states with tagged unions.
* Replace primitive obsession with branded or domain-specific types where useful.
* Introduce result types for fallible operations instead of throwing in normal control flow.
* Prefer readonly types and immutable collections/interfaces.
* Encode lifecycle/state transitions in types where possible.

### Functional style rules

* Prefer small pure functions over large stateful classes.
* Keep functions total where possible.
* Avoid mutation unless there is a clear performance or boundary reason.
* Push side effects to the edges.
* Separate parsing, validation, transformation, and execution.
* Prefer exhaustive matching on unions.
* Eliminate magical defaults and implicit fallback behavior.

### Error handling rules

* Do not use exceptions for expected failures.
* Use explicit `Result` / `Either` style return values for validation and domain errors.
* Distinguish clearly between:

    * domain errors
    * infrastructure errors
    * programmer bugs / invariants
* Do not silently swallow failures.
* Avoid partial behavior and ambiguous return contracts.

### Module boundaries

Organize code into clear layers such as:

* domain
* application/use-cases
* infrastructure/adapters
* transport/interface

Rules:

* Domain must not depend on framework or IO details.
* Application orchestrates use-cases and state transitions.
* Infrastructure implements ports.
* Transport maps external requests/responses into domain commands/results.

### State machine expectations

* Identify workflows that are currently represented implicitly.
* Convert them into explicit state machines with tagged states and explicit transitions.
* Each transition should validate preconditions.
* Illegal transitions should be impossible or return explicit errors.