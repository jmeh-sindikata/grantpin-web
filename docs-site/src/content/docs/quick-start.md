---
title: Quick start
description: From an empty vault to a first approved run through Claude Code.
---

This is the shortest path from a fresh install to a Touch ID-approved run. It assumes you have a project in `~/projects/shop`.

## 1. Create the vault

If you used the app, the Welcome window already did this (see [Install](/docs/install/)). Check that the background service and vault are ready:

```sh
grantpin status
```

It shows whether the daemon is running, whether a vault exists, how the vault key is protected and how many secrets and grants there are.

If you built from source and have no app, create the vault and start the service yourself:

```sh
grantpin init --keychain-fallback
grantpin service install
```

## 2. Store a secret

The value is read from a hidden prompt, or from stdin. It is never a command-line argument, so it does not end up in your shell history.

```sh
grantpin set API_KEY
```

Or from stdin:

```sh
printf %s "sk_test_example" | grantpin set API_KEY
```

List what you have. This shows names and metadata, never values:

```sh
grantpin list
```

```text
NAME     TIER      EXPIRES  TAGS  URL
API_KEY  dialog    -        -     -
```

The TIER column depends on how your vault key is protected (`hardware` with a Secure Enclave vault).

## 3. Connect Claude Code

Run this in a terminal. It is the command the app's Connect screen shows (the path is where the app is installed):

```sh
claude mcp add --scope user grantpin -- /Applications/grantpin.app/Contents/Helpers/grantpin-daemon.app/Contents/MacOS/grantpin mcp
```

That registers grantpin for every project. To connect a single project instead, leave out `--scope user` and run the command in that project's folder. If `grantpin` is on your `PATH` (Homebrew), this is enough:

```sh
claude mcp add grantpin -- grantpin mcp
```

Restart Claude Code, or run `/mcp`, and check that `grantpin` shows four tools: `secret_list`, `secret_exists`, `secret_masked` and `secret_run`. A first test that needs no approval:

> Use grantpin's secret_list tool and tell me the names of my secrets.

It sees names only. More detail in [Claude Code and MCP](/docs/claude-code/).

## 4. Add a policy (optional, recommended)

Create `~/projects/shop/.grantpin.yml` to limit what this project can ever request:

```yaml
version: 1
secrets:
  - API_KEY
commands:
  - [printenv]
max_grant_ttl: 1h
```

A policy only restricts. It never approves anything. Without one, any command may be requested and the approval dialog says "(no policy)". See [Policy files](/docs/policy/).

## 5. Your first approved run

In Claude Code, started in `~/projects/shop`, ask:

> Using grantpin, run `printenv API_KEY` with the API_KEY secret.

The agent calls `secret_run`. Two prompts appear, in this order.

First a dialog titled **grantpin**:

```text
An agent is asking grantpin to release secrets:

claude-code wants to run `printenv API_KEY` with API_KEY in /Users/you/projects/shop

Allow for 1h covers: printenv … in /Users/you/projects/shop and subfolders.

[ Deny ]   [ Allow once ]   [ Allow for 1h ]
```

- The first line names who is asking. The name is whatever the agent's MCP client reported about itself. It is informational, not proof.
- The second part is the exact command, the secrets and the folder it runs in. This is what you are approving.
- The **covers:** line states exactly what "Allow for 1h" would permit: that command prefix, in that folder and its subfolders, for that long, for the same caller and secrets. See [Grants and approvals](/docs/grants/).
- **Deny** is the default button. Esc, closing the dialog, or 120 seconds of silence also mean Deny.

If you press an Allow button, the macOS authentication sheet (Touch ID, or your account password if there is no sensor) repeats the request. Cancelling the sheet is a Deny.

The agent then gets this result:

```json
{"exit_code":0,"grant_id":"","stderr":"","stdout":"[REDACTED:API_KEY]\n"}
```

The command really ran with `API_KEY` set to your value. The daemon replaced the value in the output before it left the process. If you deny, the agent gets a tool error `denied: user_denied` and the command does not run.

The same thing without an agent:

```sh
cd ~/projects/shop
grantpin run --secrets API_KEY -- printenv API_KEY
```

## 6. Look at the record

```sh
grantpin audit
grantpin audit verify
grantpin grants
```

These show what was decided, check the audit chain, and list active grants. See [Audit log](/docs/audit/) and [Grants and approvals](/docs/grants/).

:::caution[The command's environment]
A command runs with the **daemon's** environment plus the injected secrets, not your shell's and not the agent's. Under the background service that is the environment launchd gives the job plus the `PATH` that was recorded when the service was installed. If a tool is not found, see [Troubleshooting](/docs/troubleshooting/).
:::
