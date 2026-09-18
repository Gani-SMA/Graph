# AGENTS.md
## Project Rulebook for Antigravity Autopilot — Cascade-Aware Traffic Navigation System

This file is the standing rulebook for Antigravity's AI agents building this project end-to-end. It must be read before any code, plan, or model is generated. It also maps project tasks to the specific globally-installed skills available, so the autopilot selects the right skill for the right situation without being told each time.

### Non-Negotiable Rules
1. **Never use a random train/test split** for the cascade model — always time-based (earlier data = train, later = test).
2. **Never fabricate or claim live, crowdsourced traffic data.** The system uses live geolocation, live weather, a real open-source routing engine, and a historically-trained congestion prediction model. Any UI copy, documentation, or paper text implying real-time crowdsourced traffic data (like Google/Waze has) must be corrected before merge.
3. **Never use a paid API or paid cloud service.** Only free/open-source: OSRM or GraphHopper (routing), Open-Meteo (weather), Colab/Kaggle (compute), Vercel/Netlify/Render (hosting).
4. **Emergency Vehicle Mode is a recommendation feature only.** No code, copy, or documentation may imply control over traffic signals or physical infrastructure. The UI disclaimer defined in AppFlow Section 2 must always render when this mode is active.
5. **LSTM is baseline-only** — never presented as the core/final model. GAT+GRU is the core model.
6. **Geolocation requires HTTPS** in any deployed environment — do not deploy the frontend to a non-HTTPS host.
7. **Every architectural or modeling decision the agent makes must be documented with its reasoning** (in code comments, commit messages, or a decision log) — full AI-driven implementation does not exempt the project from being explainable by the student in a viva or reviewer Q&A. If an agent cannot articulate why it made a choice, it should flag it for human review rather than proceed silently.
8. **Do not fabricate dataset fields, API responses, or model results.** Check `05_Data_Dictionary.md` and `07_API_Specification.md` before referencing any field name.

### Skill-to-Task Mapping (for Antigravity autopilot)

| Project Phase / Task | Recommended Skill(s) | Notes |
|---|---|---|
| Initial planning, scoping a phase | `brainstorming`, `make-plan`, `writing-plans`, `pathfinder` | Use before starting any new phase (e.g., before starting the routing engine integration) |
| Executing a planned phase | `executing-plans`, `do`, `subagent-driven-development` | Use once a plan exists; subagent-driven-development for parallelizable work (e.g., frontend + backend simultaneously) |
| Exploring/understanding existing code before changes | `learn-codebase`, `smart-explore`, `what-the`, `graft` | Use whenever resuming work on a module not touched recently |
| Frontend / UI construction | `pick-ui-library`, `apple-design`, `design-is`, `emil-design-eng` | Apply alongside the Anti-Vibecode Ruleset (TRD Section 3) — do not default to generic AI-site patterns |
| In-app notifications / toasts (permission denied, route recalculated, data unavailable) | `ask-sonner` | Use for the transient status messages defined in AppFlow error handling (Section 5) — e.g., "Location access denied," "Weather unavailable," "Cascade data unavailable for this segment" |
| Animation / interaction polish | `animate`, `animate-expo`, `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`, `review-animations` | Use sparingly — per the design ruleset, one deliberate motion moment, not animation on every element |
| Prototyping a new UI feature before full build | `prototype` | Use for the map/routing UI before committing to final implementation |
| Writing model/training/backend code | `test-driven-development` | Write tests alongside model and API code, not after |
| Debugging any failure (model, API, frontend) | `systematic-debugging`, `babysit`, `bug-triage`, `oh-my-issues` | Use `bug-triage` first to classify severity/scope before deep debugging; `oh-my-issues` for tracking/triaging a backlog of open issues |
| Before marking any task complete | `verification-before-completion` | Mandatory — do not mark a feature "done" without running this check against `08_Test_Plan.md` |
| Code review (agent-to-agent or agent-to-human) | `requesting-code-review`, `receiving-code-review` | Use for any change touching the cascade model or routing re-ranking logic specifically |
| Keeping code minimal/clean | `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help` | Apply periodically, especially before Phase 3 (submission) to reduce unnecessary complexity; `ponytail-help` for reference on the system itself when uncertain |
| Git workflow, branching | `using-git-worktrees`, `finishing-a-development-branch`, `version-bump` | Standard workflow for isolating routing-engine work from cascade-model work |
| Status tracking / progress summaries | `standup`, `timeline-report`, `weekly-digests`, `how-it-works`, `wowerpoint` (claude-mem plugin) | Use for the student's own tracking, not required for the system itself; `how-it-works` explains a given subsystem's behavior on demand, `wowerpoint` for narrative/presentation-style summaries of progress |
| Long-running project memory across sessions | `cloud-sync`, `mem-search`, `knowledge-agent`, `mode-creator` (claude-mem plugin), `supermemory` plugin | Use so Antigravity retains context on architectural decisions between sessions; `mode-creator` for defining a custom claude-mem mode specific to this project if the defaults don't fit |
| Desktop-specific tooling (if ever needed) | `ao-desktop-dev`, `using-ao` | Not expected to be needed — this project targets browser/PWA only, not a native desktop app |
| Writing Swift (native iOS) | `write-swift` | **Not applicable** — this project explicitly avoids native mobile apps in favor of a responsive PWA (see PRD Section 5, Out of Scope) |
| Knowledge graph / semantic pipeline skills (`causal`, `change`, `decision`, `deduplicate`, `embed`, `explain`, `export`, `extract`, `ingest`, `ontology`, `policy`, `provenance`, `query`, `reason`, `semantica`, `temporal`, `validate`, `visualize`) | Optional, not required | These are general-purpose knowledge-graph tools; the road network graph in this project is a simple adjacency structure, not a full knowledge graph. Do not invoke this skill family unless a specific need arises — using it by default adds unnecessary complexity |
| Writing plans, executing plans | `writing-plans`, `executing-plans`, `writing-skills` | Use `writing-skills` if a gap is found and a new custom skill needs to be authored for this project specifically (e.g., a routing-engine-specific skill not covered by the existing 73) |
| Accessing broader meta-capabilities / skill library | `using-superpowers`, `superpowers` (plugin) | Use when a task doesn't cleanly map to any single skill above — `superpowers` is the umbrella plugin, `using-superpowers` is the skill for invoking it correctly |
| New/unfamiliar skill, slash-command, or Antigravity customization | `antigravity_guide`, `agy-customizations` | Consult `antigravity_guide` first for general IDE/CLI/SDK questions; `agy-customizations` specifically when configuring or extending Antigravity's own customization system for this project |
| GitHub interactions | `permissioned-github` | Use for any repository operations requiring authentication |

### Folder Structure (expected)
```
/data                     # raw and processed traffic/weather datasets
/graph                    # road adjacency + graph construction scripts
/routing                  # routing engine integration (OSRM/GraphHopper client, re-ranking logic)
/models
  /lstm_baseline
  /gat_gru
/explainability            # SHAP + attention-weight extraction
/backend                   # FastAPI app (routing, prediction, weather, explainability endpoints)
/frontend                  # React PWA (map, routing UI, responsive layout)
  /public                  # manifest.json, service worker, icons
/experiments                # model comparison logs
/notebooks                   # Colab/Kaggle training notebooks
docs/                         # this doc set
```

### Coding Conventions
- Python: PEP8, type hints, docstrings on model classes and data-processing functions.
- Model code: PyTorch + PyTorch Geometric (`GATConv`), native `nn.GRU`/`nn.LSTM`.
- Frontend: React functional components, Leaflet.js for map rendering, no inline styles duplicating the design system — centralize palette/type choices per the Anti-Vibecode Ruleset.
- Config values (routing engine URL, model hyperparameters, road subset definition) in a single config file, not hardcoded across modules.
- Random seeds fixed and logged for reproducibility.

### Definition of Done (per component)
A component is not "done" until: it runs end-to-end without manual intervention, its output matches the schema in `05_Data_Dictionary.md` or `07_API_Specification.md`, it passes the relevant checks in `08_Test_Plan.md`, `verification-before-completion` has been run, and the reasoning behind its design is documented somewhere retrievable (code comments, commit message, or decision log).
