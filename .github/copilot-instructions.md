# AI Assistant Instructions

## Running the Application

**IMPORTANT:** Do not automatically start the development server or any background processes.

Instead, instruct the user to run:

```bash
npm run dev
```

The user will manually start and manage the application server. Only start processes in the terminal if explicitly requested by the user.

## Available Commands

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run test suite
- `npm run lint` - Run linter

## Documentation & Planning Guidelines

**DO NOT create unless explicitly requested by the user:**
- Plans or task lists
- Summary documents
- Status reports
- Markdown documentation files

**When creating plans (if requested):**
- Be concise - user should read it quickly
- Focus on WHAT must be done (textual description, no code)
- Present as a sequence of tasks
- Show code snippets only when discussing specific implementation details
- Ask clarifying questions (max 3 at a time) until you have full clarity

## Implementation Step Format

**REQUIRED:** All implementation steps must be documented with:

1. **Quick Description** - One sentence explaining what this step accomplishes
2. **Tasks** - Bulleted list of concrete actions to take
3. **Acceptance Criteria** - Clear, testable conditions that define "done"

**Example:**
```markdown
### Step X: Create User Authentication
**Description:** Implement JWT-based authentication with login/logout functionality

**Tasks:**
- Create AuthService class with login/logout methods
- Add JWT token storage in localStorage
- Implement protected route wrapper component
- Add login form with validation

**Acceptance:**
- User can log in with valid credentials
- Invalid credentials show error message
- Protected routes redirect to login when unauthenticated
- Token persists across page refreshes
- All tests passing
```

## Logging

**CRITICAL:** Logging is an extremely important development tool.

1. **Use the logger utility** (`src/utils/logger.ts`):
   - Import: `import { logger } from '../utils/logger'`
   - Never use `console.log` directly in production code
   - Tests can use console for debugging

2. **Log levels and when to use them:**
   - **TRACE**: Very detailed diagnostic info (loop iterations, object states)
   - **DEBUG**: Detailed information useful for debugging (function entry/exit, parameter values)
   - **INFO**: Important business events (user actions, state changes, API calls)
   - **WARN**: Unexpected situations that don't break functionality
   - **ERROR**: Errors and exceptions

3. **During development:**
   - Set log level to TRACE to see everything
   - Log all significant steps: initialization, user actions, state changes, API calls
   - Include relevant context objects in log calls

4. **Best practices:**
   ```typescript
   // Good - structured with context
   logger.debug('Initializing scene', { width, height, mode })
   logger.info('User added light', { type: 'directional', position })
   logger.trace('Render loop iteration', { frame, deltaTime })

   // Bad - missing context
   logger.info('Added light')
   ```

5. **Access logs:**
   - Browser DevTools console (live)
   - Call `logger.getLogs()` for in-memory logs
   - Use logging server for persistent file output

## Test-Driven Development (TDD)

**MANDATORY:** All code changes must follow TDD principles:

1. **Before implementing any feature:**
   - Check if a test already exists that covers the requirement
   - If yes: use, fix, or extend the existing test
   - If no: create a new test first

2. **Write tests for everything:**
   - Business logic and algorithms
   - React components (using React Testing Library)
   - User interactions (clicks, inputs, keyboard events)
   - API calls and data transformations
   - Three.js scene setup and behavior

3. **TDD Workflow:**
   ```
   1. Write failing test
   2. Run test → verify it fails
   3. Write minimal code to make it pass
   4. Run test → verify it passes
   5. Refactor if needed
   6. Commit
   ```

4. **Testing User Interactions:**
   - Even UI-heavy features need automated tests
   - Use React Testing Library's `fireEvent`, `userEvent`, `waitFor`
   - Mock Three.js objects when needed, but don't overuse mocks (they can hide real issues)
   - **When you mock something, also create an integration test that tests it for real**
   - Test state changes, prop updates, callbacks
   - Example: Click button → verify object appears in scene

5. **Run tests frequently:**
   ```bash
   npm test        # Run all tests
   npm test --watch  # Watch mode during development
   ```

## General Guidelines

1. **Let the user control processes** - Don't start servers automatically
2. **Clean up properly** - If you do start a background process at user request, ensure it can be stopped
3. **Provide clear instructions** - Tell the user what command to run rather than running it for them
4. **Be direct** - Answer questions and implement changes without unnecessary preamble
