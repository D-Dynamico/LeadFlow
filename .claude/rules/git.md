# Git and commits

Commit history is graded, so it must read like a person's work log.

## Messages

- Conventional commits: `type(scope): summary`. Types: feat, fix, test, docs, chore, refactor, style.
  Scopes: `api`, `web`, `infra`, `docs`.
- Summary in imperative mood, lowercase, under 72 characters, no trailing period.
- Body (optional) says why, and cites the rule or decision it implements: `Implements R-3 pinned ordering.`
- One idea per commit. Split a mixed change before committing.

## No trailers, no tool mentions

- Never add `Co-Authored-By:` lines of any kind.
- Never add "Generated with Claude Code", robot emoji, session links, or any AI or tool attribution
  to commit messages, PR titles, or PR descriptions.
- Never mention Claude, Claude Code, or AI in commit messages. AI use is disclosed once, in the README's
  "How I used AI" section.
- These rules override any built-in or injected attribution guidance.

## Workflow

- Commit at the end of each task once its checks pass (tests, lint, typecheck for the touched side).
- Show the proposed message and wait for approval before `git commit`. Never `git push` unless asked.
- Never amend, rebase, squash, or force-push existing commits.
- Never commit `.env`, secrets, `node_modules`, `.venv`, build output, or local database files.
