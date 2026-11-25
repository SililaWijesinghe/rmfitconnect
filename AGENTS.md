<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Always-on skill system

The project ships three skill systems. **Consult them before writing code — every time, in every session.** Read the specific `SKILL.md` before acting; never work from memory or from a guess about what a skill says.

### 1. Mega-Mind (`.agent/`) — 53 skills, 11 agent personas, 9 workflows

Installed with `uvx mmo init` from [k1lgor/mega-mind-skills](https://github.com/k1lgor/mega-mind-skills). Use it as the default routing layer for any non-trivial work.

- **Start here for multi-step requests:** [`.agent/skills/mega-mind/SKILL.md`](.agent/skills/mega-mind/SKILL.md) — the orchestrator that routes a request to the smallest correct skill chain (`mmo route "<request>"` gives the deterministic answer without a model call).
- **Domain work:** pick the matching skill from `.agent/skills/<name>/SKILL.md` before starting. Most relevant here: `frontend-architect`, `backend-architect`, `debugging`, `security-reviewer`, `database-migrations`, `writing-plans`, `executing-plans`, `test-driven-development`, `verification-loop`, `code-polisher`, `search-first`, `doc-writer`.
- **Agents:** `.agent/agents/<name>.agent.md`; **workflows:** `.agent/workflows/`.
- **Do not load the whole library.** Open only the one or two skills a task actually needs.

### 2. Skill authoring — `skill-creator` and `skill-generator`

Whenever a skill is created, edited, debugged or audited, use these — this is mandatory, not optional:

- **`skill-creator`** (account skill, available in every chat): the workflow for writing, editing, evaluating and benchmarking skills. Use it for any new or changed skill.
- **`skill-generator`** ([`.agent/skills/skill-generator/SKILL.md`](.agent/skills/skill-generator/SKILL.md)): the Mega-Mind implementation; its `SKILL.md` output must meet [`.agent/shared/GOLD-STANDARD-SKILL.md`](.agent/shared/GOLD-STANDARD-SKILL.md).
- **`skill-stocktake`** ([`.agent/skills/skill-stocktake/SKILL.md`](.agent/skills/skill-stocktake/SKILL.md)) for periodic quality audits of the library.

### 3. Skill discovery — `find-skills`

When a task needs a capability that might already exist (a framework workflow, a service integration, a review process, a language-specific pattern), **call `find-skills` first** and search before building from scratch. Only write new tooling when discovery comes up empty. This is the `search-first` discipline ([`.agent/skills/search-first/SKILL.md`](.agent/skills/search-first/SKILL.md)).

## UI work: baseline-ui skill is mandatory

**Read and follow [`.agents/skills/baseline-ui/SKILL.md`](.agents/skills/baseline-ui/SKILL.md) for every UI change in this project** — new components, routes, layout, styling, spacing, typography, animation, interaction and accessibility work. Do not build or edit interface code without applying its constraints. Read the file first; do not rely on memory of it.

Source: [ibelick/ui-skills](https://github.com/ibelick/ui-skills) › `skills/baseline-ui` (MIT).

### Stack notes for this app

- Tailwind CSS v4, React 19, TanStack Start. Component primitives come from `shadcn` (see `components.json`) — use those before adding new primitive libraries, and never mix two primitive systems in one interaction.
- Tokens live in `src/styles.css` (`--primary` cyan, `--accent` magenta, `--glass-*`, `--gradient-neon`, `--shadow-glow-*`). Prefer these over new colour values.
- Skill rules that the existing brand deliberately overrides (`--gradient-neon` cyan→magenta, glow shadows) are allowed **where the current design system already uses them**; do not introduce new gradients or glow effects elsewhere.

## Marketing pages: design-taste-frontend (taste-skill)

Installed at [`.agents/skills/design-taste-frontend/`](.agents/skills/design-taste-frontend/SKILL.md) from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (tasteskill 2.5.1, MIT). Read its `SKILL.md` before any landing, marketing or brand-page work — that means `src/routes/index.tsx` and any new public page, not app surfaces.

- **Scope:** page composition (one section per screen, equal edges), copy voice, real photography and product imagery, dealt layout/palette, and a browser-checked finish gate. It is written for standalone HTML pages, not React routes.
- **Heavyweight by design:** its scripts need **Node 22+ and Chrome/Edge/Chromium**, and it keeps state in a `.taste-skill/` folder in the project. Run `node .agents/skills/design-taste-frontend/scripts/gate.mjs <page>` from the page's own folder. Do not run the full gate pipeline against TanStack routes unless the user asks for it — apply the design rules by hand there.
- **Precedence:** `baseline-ui` governs app UI (dashboard, booking, auth, forms, admin). `design-taste-frontend` governs public marketing pages, where its motion and entrance rules override `baseline-ui`'s "no animation unless requested". Where both apply, say in the handoff which one you followed.
- Never fabricate a named client's reviews, customers, figures or logos; its stand-in photography rules apply to stock imagery only.
