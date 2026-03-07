# Development Guidelines for CNS Test Application

This document provides essential information for developers working on the CNS Test application.

## Build/Configuration Instructions

### Prerequisites
- Node.js (v16+)
- npm (v7+)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:5173

3. Build for production:
   ```bash
   npm run build
   ```
   This will create a production-ready build in the `dist` directory.

4. Preview the production build:
   ```bash
   npm run preview
   ```

### Configuration
- The base path for the application is configured in `vite.config.js` as `/vite-first/`
- Application settings are managed in `src/config/settings.ts`
- Localization strings are defined in `src/localization/localization.ts`

## Testing Information

### Testing Framework
The project uses Vitest for testing, which is compatible with Vite projects.

### Running Tests
To run all tests:
```bash
npm test
```


## Additional Development Information

### Development Principles
- Functional approach — prefer pure functions, avoid side effects, and compose functions where possible.
- Immutability — do not mutate inputs in place; use copies and spread operators instead of in-place mutations.
- Strong typing — leverage TypeScript’s strict typing (generics, exact types) and avoid `any`.

Additionally:
- Separate computation and presentation: keep complex calculations (e.g., statistics/metrics) in modules like `src/stats/`, and UI rendering in screens/components.

### Project Structure
- `src/components/` - Reusable UI components
- `src/config/` - Application configuration and domain types
- `src/db/` - Database operations using Dexie.js (IndexedDB wrapper)
- `src/localization/` - Internationalization support (EN/UA)
- `src/routing/` - Custom routing implementation
- `src/screens/` - Main application screens
- `src/stats/` - Statistical analysis functionality
- `src/util/` - Utility functions

### Key Technologies
- **TypeScript** - For type safety
- **Vite** - Build tool and development server
- **Dexie.js** - IndexedDB wrapper for client-side storage
- **Chart.js** - For data visualization
- **TailwindCSS** - For styling
- **DaisyUI** - UI component library based on TailwindCSS
- **simple-statistics** - For statistical calculations

### Code Style
- Use TypeScript for all new code
- Follow the existing pattern of class-based components for screens
- Use functional components for smaller, reusable UI elements
- Document complex functions with JSDoc comments
- Use strong typing and avoid `any` types when possible

### Database Operations
The application uses IndexedDB through Dexie.js for client-side storage:
- User profiles are stored in the `users` table
- Test results are stored in the `tests` table
- See `src/db/db.ts` for the database schema
- Use the functions in `src/db/operations.ts` for database operations

### Adding New Features
1. For new UI components, create a new file in the `src/components/` directory
2. For new screens, create a new file in the `src/screens/` directory and register the route in `src/main.ts`
3. For new test types, update the domain types in `src/config/domain.ts` and add the necessary UI in the appropriate screen files

## Core instruction for Junie

You are refactoring an existing TypeScript application to a stricter, more maintainable architecture inspired by Scala/Rust design principles.

Your goal is not to make the code “more idiomatic TypeScript” in a casual JavaScript sense.
Your goal is to make it feel like a strongly modeled, explicit, immutable, domain-driven system.

Apply these principles everywhere unless impossible:

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

### Refactor process

Do not rewrite everything blindly.
First:

1. Analyze the current architecture.
2. Identify the main domain concepts.
3. Identify places with mutation, null/undefined reliance, boolean flag abuse, hidden side effects, and mixed concerns.
4. Propose a target architecture.
5. Then refactor incrementally.

For each major change:

* explain the problem in the old design
* explain the new model
* show impacted files
* keep behavior preserved unless explicitly improving a bug

### Output expectations

When making changes:

* prefer incremental PR-sized refactors
* explain tradeoffs briefly
* avoid overengineering
* keep names precise and domain-oriented
* favor readability over cleverness
* produce code that is easy for a Scala/Rust-minded engineer to trust

---

## A shorter version for actual use

If you want something more compact, use this:

Refactor this TypeScript project into a stricter architecture inspired by Scala and Rust.

Constraints:

* immutable-first design
* discriminated unions instead of nullable/optional state blobs
* no `any`
* avoid `null`/`undefined` in domain logic
* explicit `Result`-style error handling for expected failures
* pure functions where possible
* side effects pushed to boundaries
* explicit state machines for lifecycle/workflow logic
* modular layers: domain, application, infrastructure, transport
* no stringly-typed business logic
* no boolean flag driven state when a union/state type should exist
* exhaustive handling of variants
* no hidden mutation
* no framework leakage into domain

Process:

1. analyze current architecture
2. identify anti-patterns
3. propose target module structure
4. refactor incrementally
5. explain each major change and why it improves correctness and maintainability

Prioritize:

* making invalid states unrepresentable
* replacing implicit behavior with explicit modeling
* keeping functions small and composable
* preserving behavior unless fixing clear bugs

When in doubt, prefer designs that would feel natural in Scala or Rust.

---

## Extra instructions that help a lot

You can add these depending on what your codebase suffers from.

### If the app has messy workflow logic

Focus especially on modeling the main workflow as a typed state machine.
Look for places where state is represented by:

* multiple booleans
* status strings
* optional timestamps
* optional payloads
* impossible combinations of fields

Replace these with discriminated unions and explicit transition functions.

### If the app has bad service layering

Do not keep “god services” that validate, fetch, transform, mutate state, log, and serialize responses in one place.
Split them into:

* domain policies
* use-case orchestration
* repository/adapter interfaces
* infrastructure implementations

### If the app has lots of `undefined`

Any use of `undefined` or optional fields in core business logic should be treated as a design smell unless it truly models absence at a boundary.
At boundaries, normalize input into explicit domain types immediately.

### If the app throws everywhere

Replace expected thrown errors with typed failures.
Keep throws only for programmer errors or impossible invariants.

### If the app has DTO/domain confusion

Separate:

* external DTOs
* persistence records
* domain models
* view models

Do not reuse one structure for everything.

---

## Good acceptance criteria to include

Tell Junie to consider the refactor successful only if:

* domain logic is framework-agnostic
* the main workflow is modeled explicitly
* most business functions are pure
* `null` / `undefined` are minimized and isolated to boundaries
* union types replace ambiguous object shapes
* error paths are explicit
* module boundaries are clear
* the code reads like a well-modeled system, not a bag of handlers/utilities

---

## A very practical “review lens” prompt

After the first refactor, run a second prompt like this:

Review the refactor as if you are a strict Scala/Rust engineer.

Find places that still violate these principles:

* hidden mutation
* nullable or ambiguous state
* weak domain modeling
* mixed IO and business logic
* non-total functions
* boolean/state flag abuse
* loose string-based branching
* exceptions used for expected failures
* modules with unclear responsibilities

Then propose concrete follow-up refactors in priority order.

Do not introduce abstraction for its own sake.
Prefer straightforward domain types, small functions, and explicit flows over clever functional infrastructure.

