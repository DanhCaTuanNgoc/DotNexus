---
name: auto-commit
description: Automatically stages changed files, verifies test/build integrity, and creates a concise Conventional Commit without pushing to remote.
---

# Auto Commit Workflow

Use this skill whenever completing a code modification, refactoring, styling, or bug fix task in DotNexus.

## Rules & Constraints
1. **Never Push**: Under NO circumstances should the agent execute `git push`. Pushing to remote repositories is exclusively reserved for the user.
2. **Pre-commit Integrity Verification**:
   - Backend changes: `python -m unittest tests/test_engine.py` must pass.
   - Frontend changes: `cd front-end && npm run build` must compile with 0 errors.
   - Do not commit if any tests or builds fail.
3. **Atomic Staging**:
   - Do NOT run blind `git add .` if unintended untracked files (e.g. `.pyc`, temporary test scripts, build caches) are present.
   - Stage only modified files and necessary newly created source files relevant to the completed task.
4. **Conventional Commits Standard**:
   Structure the commit message cleanly:
   ```
   <type>(<scope>): <concise imperative summary>

   [optional body explaining 'why' and key changes]
   ```
   - Types:
     - `feat`: A new feature or capability.
     - `fix`: A bug fix or error resolution.
     - `refactor`: Code restructure without changing external behavior.
     - `style`: UI styling, theme, palette, layout, spacing adjustments.
     - `perf`: Performance improvements.
     - `chore`: Maintenance, dependency pruning, skill cleanup, configuration.
     - `test`: Adding or updating test suites.
     - `docs`: Documentation updates.
   - Scope examples: `(ui)`, `(radar)`, `(shield)`, `(engine)`, `(skills)`, `(deps)`.

## Execution Steps
1. Run `git status` to review modified, deleted, and untracked files.
2. Stage relevant files using targeted `git add <paths>`.
3. Generate the commit message and run:
   ```bash
   git commit -m "<type>(<scope>): <summary>"
   ```
4. Output the resulting commit hash and brief description so the user knows they can push at any time.
