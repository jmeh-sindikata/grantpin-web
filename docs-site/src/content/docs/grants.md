---
title: Grants and approvals
description: Allow once, Allow for N, standing grants, revoking, and presence tiers.
---

Every release of a secret needs either a fresh approval or a **grant**: a time-limited pre-approval that you created by approving. This page covers both.

## The approval dialog

When a request is inside the policy and no grant matches, grantpin asks you. The dialog has three buttons:

| Button | What happens |
|---|---|
| **Deny** | Nothing runs. This is the default button. Esc, closing the dialog, or 120 seconds of silence also mean Deny. |
| **Allow once** | This one run is released. Nothing is stored. |
| **Allow for N** | This run is released and a grant is stored, so the same kind of request runs without a prompt for the next N. |

After an Allow button, the macOS authentication sheet (Touch ID, or your account password) repeats the request. Only the button and a successful authentication together release the secret. Cancelling the sheet is a Deny.

N is the policy's `max_grant_ttl`, but never more than 24 hours. With no policy it is 1 hour. You cannot pick a different value in the dialog.

### The "covers:" line

The dialog ends with a line like this:

```text
Allow for 1h covers: printenv … in /Users/you/projects/shop and subfolders.
```

It tells you exactly what the third button would permit: the command prefix (the longest matching prefix from the policy, or the whole command when there is no policy), the folder and everything beneath it, for that long, for the same caller and the same secrets. Read the command and this line. They are the control.

## What a grant matches

A later request is released without a prompt only if **all** of these hold:

- the **caller** name is the same. It is normalised (lowercase, runs of other characters folded to one `-`), so `Claude Code`, `claude_code` and `claude-code` are the same caller. The name is supplied by the client and is not authenticated;
- the working directory is the grant's directory or inside it;
- every requested secret is covered. A literal name is covered by an equal entry or a matching glob. A requested glob is covered only by an identical glob entry. The grant stores the secrets *as requested*, so a glob grant also covers a matching secret you add later;
- the command starts with the grant's command prefix, argument for argument;
- the grant has not expired and, if it has a use limit, has uses left;
- the stored grant passes its integrity check.

:::caution[A grant binds to text and a folder, not to program contents]
If you grant `php artisan` in `~/projects/shop`, an agent that can edit files in that tree can change what `artisan` does and still use the grant. Approving "Allow for N" is approving that repository's code to run with those secrets for that long. Prefer **Allow once** for commands you have not seen before.
:::

## Standing grants

A standing grant is one that *you* create up front for a longer time (up to 90 days), instead of answering a prompt later.

```sh
grantpin grants add --caller claude-code --secrets DB_URL,aws/* --ttl 30d -- php artisan
```

```sh
grantpin grants add --caller claude-code --secrets API_KEY --ttl 12h --cwd ~/projects/shop --uses 20 -- ./deploy.sh
```

- `--caller` is required. It says who the grant is for.
- `--secrets` takes names and globs.
- Everything after `--` is the command prefix: `php artisan` also covers `php artisan migrate`, but not `php other`.
- `--cwd` defaults to the current directory and covers its subfolders.
- `--ttl` is required and may be at most 90 days, or less if the policy sets `max_standing_grant_ttl`. A longer value is refused, not shortened.
- `--uses N` ends the grant after N releases.

You approve it once, in a different dialog:

```text
Create a standing grant?

claude-code may run `php artisan …` with DB_URL, aws/* (aws/access_key) in /Users/you/projects/shop and subfolders for the next 30 days, without further prompts.

Only continue if you just asked for this yourself.

[ Cancel ]   [ Create standing grant ]
```

Cancel is the default. Touch ID follows. Nothing is stored until both succeed.

:::danger[Only approve a standing-grant dialog you started]
Anything that can reach the daemon can ask for this dialog, including an agent, and the caller name in it is whatever the sender claimed. If you did not just run `grants add`, press Cancel. Keep standing grants narrow: a specific command prefix, a specific folder, the shortest `--ttl` that works, and `--uses` where a count makes sense. Never use a shell or interpreter as the prefix.
:::

## Listing and revoking

```sh
grantpin grants
grantpin grants list
```

Both list active grants. The STANDING column says `standing` for grants made with `grants add`. EXPIRES is the time left. A row that fails its integrity check is shown as `TAMPERED` and never matches; revoke it.

```sh
grantpin grants revoke ID
grantpin grants revoke --all
```

Neither listing nor revoking needs approval. A revoke is written to the [audit log](/docs/audit/).

## Presence tiers

Every secret has a minimum protection level, `min_tier`: `none`, `dialog` or `hardware`. A run is refused (`tier_unmet`, exit 78) if either the key store or the approver provides less than the strictest `min_tier` among the requested secrets. Tiers are never downgraded.

| Backend (macOS) | Tier |
|---|---|
| Secure Enclave key | `hardware` |
| Keychain fallback key | `dialog` |
| Touch ID approver (password fallback) | `hardware` |

New secrets get the key store's tier by default. You can set one explicitly:

```sh
grantpin set API_KEY --min-tier hardware
grantpin update API_KEY --min-tier dialog
```

`none` means the vault default. *Lowering* a secret's tier with `update` asks you first (a dialog, then Touch ID). Raising it does not.
