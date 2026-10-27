---
title: Claude Code and MCP
description: Connect Claude Code to grantpin over MCP, what the four tools do, and what the agent sees.
---

`grantpin mcp` runs a stdio [Model Context Protocol](https://modelcontextprotocol.io) server. It is a thin shim: each tool call becomes one request to the background daemon, and policy, grants, prompts, redaction and audit all stay in the daemon.

## Register it with Claude Code

The app's Connect screen shows the exact command. For a normal install it is:

```sh
claude mcp add --scope user grantpin -- /Applications/grantpin.app/Contents/Helpers/grantpin-daemon.app/Contents/MacOS/grantpin mcp
```

`--scope user` makes it available in every project. For a single project, leave it out and run the command in that project's folder:

```sh
claude mcp add grantpin -- /Applications/grantpin.app/Contents/Helpers/grantpin-daemon.app/Contents/MacOS/grantpin mcp
```

If `grantpin` is on your `PATH` (Homebrew), you can write it short:

```sh
claude mcp add grantpin -- grantpin mcp
```

Already connected with an older path? Run `claude mcp remove grantpin` first, then the command above.

You can also put it in a project's MCP configuration, a `.mcp.json` in the project root. There is deliberately no password and no environment variable in it:

```json
{"mcpServers":{"grantpin":{"command":"grantpin","args":["mcp"]}}}
```

`command` must be findable on the `PATH` that Claude Code sees. Otherwise use the absolute path of the binary instead.

Restart Claude Code, or run `/mcp`. `grantpin` should list four tools.

## The four tools

| Tool | Arguments | Returns |
|---|---|---|
| `secret_list` | none | `{secrets: [{name, tags, url, expires_at, min_tier}]}`. No values, no notes. |
| `secret_exists` | `name` | `{exists}` |
| `secret_masked` | `name` | `{masked}`: the last four characters (`****WXYZ`) for values of 12 or more characters, otherwise `********`. |
| `secret_run` | `argv[]` and `secrets[]` (both required), `cwd` (optional, absolute), `timeout_s` (optional) | `{exit_code, stdout, stderr, grant_id}` |

There is deliberately no tool that returns a value, and no tool to set, delete, update or manage grants.

`argv` is the command and its arguments as a list. It is run directly, with no shell, and its stdin is `/dev/null`. `secrets` are secret names (or globs such as `shop/*` if your policy lists that exact glob).

## What the agent sees

- `stdout` and `stderr` come back with every injected value replaced by `[REDACTED:NAME]`, where NAME is the secret's name in the vault (`shop/STRIPE_KEY`), not the environment variable. Each is capped at 1 MiB with a truncation marker.
- A refusal or denial is an MCP tool error with text such as `denied: user_denied`, not a protocol error. The command did not run.
- `grant_id` is empty unless the run used or created a grant.

Redaction is an exact match of the value. A command that prints it base64-encoded gets through. That is why the approval, not the redaction, is the control. See [Security model](/docs/security/).

## Working directory

`cwd` defaults to the working directory of the `grantpin mcp` process. Claude Code normally starts MCP servers in the project directory, so policy lookup and grants apply to the right project. If your client does not, the agent must pass `cwd`. A relative `cwd` is rejected.

## Good to know

- **Blocking.** A `secret_run` call waits while a prompt is on screen. The daemon allows up to ten minutes to answer, on top of the command's own timeout.
- **Caller name.** The name sent with each request is the MCP client's name from its handshake, lowercased (`Claude Code` becomes `claude-code`). It is self-reported and not authenticated.
- **Daemon auto-start.** If nothing is listening, `grantpin mcp` tries once to start the daemon. Prefer the background service from the app (or `grantpin service install`), so it is always running with a sensible `PATH`.
- **Custom socket.** `grantpin mcp --socket PATH`, or `GRANTPIN_SOCKET` set in the shell that starts `claude`.
- **Logs.** The server logs to stderr only, with operation names and never tool arguments.

## Tell the agent how to use it

Agents tend to ask for a key, or look for a `.env` file. A few lines in your project's `CLAUDE.md` (or the equivalent file for your tool) point it at the tools instead:

```md
## Secrets

This project uses grantpin for credentials. Never ask me to paste a secret,
never read `.env` files or shell history for keys, and never try to print,
encode or log a secret value.

- Use the grantpin MCP tools. `secret_list` shows which secret names exist.
- To run something that needs a secret, call `secret_run` with the command
  as `argv` and the secret names in `secrets`. Do not use a shell wrapper
  such as `sh -c`.
- Expect an approval dialog on my Mac. Wait for it. If the result is
  `denied: user_denied`, do not retry the same request; ask me what to do.
- If the secret you need is not listed, tell me its exact name and I will add it.
```
