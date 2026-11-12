---
name: commit-push
description: Commit the current work straight to main and push it. Use whenever the user asks to commit, push, or "ship" changes in this repo — no branch, no PR, as long as the change has been tested first.
---

# Commit and push

Nico is comfortable committing directly to `main` in this repo. Do **not** create a
branch and do **not** open a pull request unless he asks for one by name.

The one gate is testing: nothing lands untested.

## 1. Check it's been tested

A change counts as tested when **either** of these is true:

- **You tested it.** `npm run check` passes *and* `npm run build` succeeds. That is
  the floor, not the ceiling — a change the gates can't see (a game rule, a layout,
  audio, a print sheet) also needs the `run` skill or a real look at the page before
  it counts.
- **Nico tested it.** He said it works, or he asked you to commit after trying it
  himself. Take him at his word and don't re-run anything.

If neither holds, run the gates now. If the change is one the gates can't judge and
he hasn't tried it, say so in one line and ask whether to test it or commit anyway —
his call, not yours.

## 2. Review what's going in

```bash
git status --short && git diff --stat HEAD
```

Make sure nothing unrelated is being swept in — no scratch files, no `dist/`, no
secrets. If something doesn't belong, stage selectively rather than `git add -A`.

## 3. Commit on main

Switch to `main` first if you're not on it (a leftover branch from an earlier turn
is the usual reason), and rebase onto the remote if it has moved:

```bash
git checkout main && git pull --rebase
```

Write the message in this repo's voice: a short subject line in the imperative,
then prose paragraphs explaining *why* — what the change buys and what it trades
away. No bullet-point changelogs. End with the attribution line the session's
instructions give.

## 4. Push

```bash
git push
```

Report what landed in one or two lines: the subject line, and what was verified
and how (gates, manual test, or Nico's own). If a gate failed, say so with the
output instead of pushing.
