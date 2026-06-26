## Plan: ForgeOps Project Constitution

Create a single root-level project constitution file that acts as the authoritative AI onboarding guide for the monorepo. The document should codify the product vision, current stack, repository structure, database/domain model, coding standards, API conventions, roadmap limits, architecture decisions, and definition of done so future AI-assisted work stays focused on ForgeOps rather than inventing unrelated patterns. It should also describe the initial backend scaffold the user wants created: backend/src/{routes,controllers,middleware,services,lib,config,types}, backend/src/index.ts, backend/prisma, backend/.env, backend/package.json, and backend/tsconfig.json.

**Steps**
1. Define the constitution as a repo-wide source of truth at the workspace root, using `AI_CONTEXT.md` as the primary filename and keeping the scope explicitly applicable to `frontend/`, `backend/`, and `infrastructure/`.
2. Capture the ForgeOps vision and non-goals first, with a concise product statement, target users, core MVP features, and an explicit "do not build yet" list to prevent scope creep.
3. Record the current technical stack and architectural decisions, aligning the document with the already-declared backend stack in `backend/package.json` and `backend/tsconfig.json` so the constitution reflects existing reality rather than aspirational tooling.
4. Add a backend organization section that mirrors the intended folder structure the user described, including `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `src/lib`, `src/validators`, `src/types`, and `prisma/`, with clear ownership rules for each layer.
5. Define the initial domain model and relationships for `User`, `Organization`, `Membership`, `Project`, `Repository`, `Environment`, and `Deployment`, emphasizing that this is the source of truth for future Prisma modeling and related service boundaries.
6. Spell out coding standards and API rules, including strict TypeScript, no `any`, async/await, Zod validation, thin controllers, service-owned business logic, Prisma access through services, ES modules, named exports, and a consistent success/error response envelope.
7. Add the preferred AI workflow and definition of done sections so future agents must explain their plan, show folder changes, list files to create, wait for approval, and complete the feature only when schema, validation, service, controller, route, error handling, and API example expectations are met.
8. After the document exists, verify that it is concise, internally consistent, and aligned with the current repo state, then consider whether subproject-specific follow-up docs are needed later for frontend or infrastructure once those folders gain implementation detail.

**Relevant files**
- `d:\forgeops\AI_CONTEXT.md` — root constitution file to create and maintain as the single source of truth.
- `d:\forgeops\backend\package.json` — confirms the actual backend stack: Bun, Express, Prisma, Clerk, and Zod.
- `d:\forgeops\backend\tsconfig.json` — confirms strict TypeScript posture and compiler constraints to reflect in the constitution.
- `d:\forgeops\backend\README.md` — current minimal backend guidance that the constitution should supersede.

**Verification**
1. Review the final constitution text for coverage of all requested sections: vision, stack, folder structure, schema, coding standards, API rules, roadmap, architecture decisions, definition of done, and AI workflow.
2. Cross-check the technical stack wording against `backend/package.json` and `backend/tsconfig.json` so the constitution does not claim tools or conventions the repo does not actually use yet.
3. Confirm the root-file placement decision matches the repo shape and does not conflict with any existing AI instruction files.

**Decisions**
- Use a single root-level `AI_CONTEXT.md` rather than splitting instructions across multiple files, because the repo is small and a single source of truth is easier for AI agents to follow.
- Treat the document as repository-wide guidance, not just backend guidance, even though the backend is currently the only implemented area.
- Keep the constitution descriptive and normative, but avoid overcommitting to frontend or infrastructure implementation details that are not yet present.
- Add a short onboarding line for future chats: "Follow AI_CONTEXT.md as the source of truth." so the instruction is explicitly reusable.

**Further Considerations**
1. If frontend or infrastructure start to develop distinct conventions later, add small companion docs under those folders instead of expanding the root constitution indefinitely.
2. If you want enforcement, add a lightweight reminder in the root README or a contributor note pointing agents to `AI_CONTEXT.md` before coding.