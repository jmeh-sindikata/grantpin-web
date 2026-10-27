---
title: Audit log
description: What grantpin records, how to read it, and what its tamper-evidence does and does not give you.
---

Every decision grantpin makes is appended to an audit log in your vault database. You never have to turn it on.

## What is recorded

Each entry has the time, the caller, the working directory, the command (argv), the secret names that were requested (never values), the decision, the grant ID if any, the exit code, the duration and a reason.

A released run writes **two** entries:

1. The allow decision (`allowed_once`, `allowed_new_grant` or `allowed_grant`) with reason `released`. It is written *before* the command is started. If this entry cannot be written, nothing is started.
2. A `completed` entry with the exit code and duration, written when the command ends. Its reason is empty for a normal exit, or `timeout`, `canceled`, `command not found`, `cannot execute command`, or `not started: ...`.

A `released` entry with no `completed` entry after it means the daemon stopped mid-run.

Refusals, denials and early failures are one entry each (`denied_user`, `refused_policy`, `refused_tier`, `error`). `set`, `delete`, `update` and `show` are recorded too, and so is revoking a grant.

Any injected secret value that appears in a command line is scrubbed from the stored command.

## Reading it

```sh
grantpin audit
```

This is the same as `grantpin audit list`: newest first, a run shown as a `completed` row above its `released` row. When a glob was expanded, the SECRETS column shows `aws/* → aws/a, aws/b`.

| Flag | Meaning |
|---|---|
| `--limit N` | Maximum entries to show. Default 100, at most 1000. |
| `--before ID` | Only entries older than `ID`. Use it to page back, or when a reply was cut off. |

To export the whole log as CSV:

```sh
grantpin audit export > grantpin-audit.csv
```

The columns are `id, ts, caller, cwd, argv, secrets, expanded, decision, grant_id, reason, exit_code, duration_ms`. A text cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'` so a spreadsheet keeps it as text.

## Checking it

```sh
grantpin audit verify
```

Entries are chained: each one carries an HMAC (HMAC-SHA256, with a key derived from the vault key) that also covers the previous entry's HMAC. `verify` recomputes the whole chain and reports the first bad entry. The table also has database triggers that abort `UPDATE` and `DELETE`.

## What the tamper-evidence does not give you

This is tamper-evident, not tamper-proof.

- The triggers stop the application, not someone who can write to the file, who can drop them. Without the vault key that person cannot forge a valid chain, so edits, reordering and deletions from the *middle* are detected by `verify`.
- **Truncation is not detected.** Deleting the newest entries leaves a valid chain, because there is no external anchor (no signed head, no remote log). Someone who can write the vault file can erase their most recent activity.
- The audit log and the grants are separate. A replayed old grant would show up only as repeated `allowed_grant` entries for a grant you had revoked.
- The log contains every command line and folder grantpin has seen, and any process of yours that can reach the daemon can read it.

See [Security model](/docs/security/) for the wider picture.
