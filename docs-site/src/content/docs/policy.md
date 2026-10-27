---
title: Policy files
description: The .grantpin.yml file that limits which secrets and commands a repository may request.
---

A policy is a `.grantpin.yml` file that you commit with your repository. It says which secrets and which commands that repository may ever ask for.

```yaml
version: 1
secrets:                       # names or globs this repo may request
  - aws/*
  - DB_URL
commands:                      # allowed argv prefixes
  - [php, artisan]
  - [aws]
  - [./deploy.sh]
max_grant_ttl: 4h              # optional; default 1h
max_standing_grant_ttl: 30d    # optional; no default
```

## Keys

| Key | Meaning |
|---|---|
| `version` | Must be `1`. Any other value refuses the request. |
| `secrets` | Secret names or globs this repo may request. An empty or missing list allows nothing. |
| `commands` | Allowed command prefixes, each written as a list of arguments. An empty or missing list allows nothing. |
| `max_grant_ttl` | How long the dialog's **Allow for N** button lasts. Go durations or whole days with `Nd` (`90m`, `4h`, `2d`). Default 1 hour, and never more than 24 hours. |
| `max_standing_grant_ttl` | Optional cap on standing grants made with `grantpin grants add`. Same syntax. It can only lower the 90-day ceiling, never raise it. |

Unknown keys are an error.

## How a policy is applied

- **A policy restricts. It never approves.** With a policy, a request outside it is refused (exit 78, `policy_refused`) before any prompt, and the message names the secret or command. A request inside it still needs your approval or a matching grant. Without a policy file, every request needs approval and the dialog says "(no policy)".
- **The nearest file wins.** grantpin starts at the folder the command runs in and walks up. The first `.grantpin.yml` it finds is the policy.
- **Policies are not merged.** A policy in a subfolder *replaces* one higher up, whether it is looser or stricter.
- **A broken policy means refused.** If the file exists but cannot be read, is not a regular file, is not owned by you, is world-writable, is over 1 MiB, has an unknown key, is not exactly one YAML document, or has a `version` other than 1, the request is refused. grantpin never skips past a broken file to a looser one. (Group-writable is allowed.)

### Secrets

A requested literal name must equal an entry or match a glob entry. Globs use doublestar syntax: `aws/*` matches one level, `aws/**` any depth. A requested **glob** (`--secrets 'aws/*'`) is allowed only if that exact text appears in the policy, even if the policy contains `aws/**`.

### Commands

The command must start, argument for argument, with one of the listed prefixes. Matching is on the text exactly as typed: `[./deploy.sh]` matches `./deploy.sh` but not `/home/me/app/deploy.sh`.

:::caution[Keep prefixes narrow]
A prefix like `[sh, -c]` or `[bash]` allows arbitrary shell code. So does an interpreter or a build tool that runs repository code. List the narrowest prefix you can. The same prefix also becomes the scope of any "Allow for N" grant, which is why it matters.
:::

### Grant scope follows the policy

When you press **Allow for N**, the grant's command prefix is the longest policy prefix that the request starts with (the whole command when there is no policy). With `commands: [[php, artisan]]`, approving `php artisan sync` for an hour permits every `php artisan ...` command in that folder for that hour. The dialog's **covers:** line shows that prefix before you accept.

### Time limits

`max_grant_ttl` is the N in "Allow for N". With `max_grant_ttl: 7d` the dialog offers 24 hours. It does *not* limit standing grants, which you create deliberately with `grants add`. Those have their own ceiling (90 days, or `max_standing_grant_ttl` if set). See [Grants and approvals](/docs/grants/).

## Review policy changes like code

A `.grantpin.yml` can be written by anyone who can write to the repository, including an agent. The dialog does not show the policy file, only whether one exists. A looser `commands` list, a wide `secrets` glob or a new `.grantpin.yml` in a subfolder changes what can be requested and what a grant covers. Treat changes to it as security-relevant in code review.
