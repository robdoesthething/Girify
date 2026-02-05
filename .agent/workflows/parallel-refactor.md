---
description: Orchestrate a parallel refactoring of this codebase
---

Orchestrate a parallel refactoring of this codebase using sub-tasks. Analyze the dependency graph and identify 4-5 independent module boundaries that can be refactored without conflicts.

For each module, create a sub-task that:

1. Identifies code smells, outdated patterns, and inconsistencies with our TypeScript best practices
2. Refactors the module using modern patterns (barrel exports, discriminated unions, const assertions, satisfies operator where appropriate)
3. After every file change, runs the full test suite via bash and rolls back if any test fails
4. Only commits when all tests pass

Once all sub-tasks complete, run the full test suite one final time, generate a summary report of all changes made across all modules, and flag any cross-module improvements that couldn't be done in isolation.
