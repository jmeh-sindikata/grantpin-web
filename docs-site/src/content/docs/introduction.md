---
title: Introduction
description: What grantpin is, the problem it solves, and how a single run works.
---

grantpin is a local secrets broker for AI coding agents on macOS. It lets an agent such as Claude Code run a command that needs a credential (an API key, a database URL) without the agent ever receiving the credential. Everything stays on your Mac: no cloud, no account.

:::note[Status]
v0.2, macOS only, early software. Linux and Windows backends are planned, not promised. There is no auto-update yet.
:::

## The problem

A coding agent needs to run `stripe`, `psql` or a deploy script, and those need secrets. The usual options are all bad:

- Put the key in a `.env` file. The agent can `cat` it, and then it is in the chat history and in the model provider's logs.
- Paste the key into the chat. Same result, and you did it yourself.
- Give the agent your whole shell environment. Same again.

grantpin gives the agent a third option: it can ask to *run a command with named secrets*. It never gets the values. There is no operation, in the CLI or over MCP, that returns a secret to the agent. The only way a human sees a value is `grantpin show`, which needs approval and prints to a terminal.

## How a run works

1. **The agent asks.** It calls the `secret_run` tool (or you run `grantpin run`) with a command and the names of the secrets it needs, for example `stripe listen` with `shop/STRIPE_KEY`.
2. **Policy check.** The background daemon looks for a `.grantpin.yml` in the project. If the policy does not allow those secrets or that command, the request is refused before you are bothered.
3. **You approve.** A dialog shows the exact command, the secret names and the folder. If you press an Allow button, a Touch ID prompt repeats the request. Only the button and a successful authentication together release anything. A grant you approved earlier can stand in for this prompt.
4. **The command runs, output is redacted.** The daemon starts the command with the secrets in its environment, and returns stdout and stderr with every injected value replaced by `[REDACTED:NAME]`.
5. **An audit entry is written.** One entry before the command starts and one when it ends. If the first cannot be written, nothing is started.

```text
 Agent (Claude Code)               grantpin daemon                    You
        |                                 |                            |
        |-- run `cmd` with NAME --------->|                            |
        |                                 |-- policy check             |
        |                                 |-- dialog + Touch ID ------>|
        |                                 |<-------- approve ----------|
        |                                 |-- audit entry (released)   |
        |                                 |-- start cmd, NAME in env   |
        |<-- output, NAME redacted -------|-- audit entry (completed)  |
```

## What the agent can see

- The names of your secrets, their tags, URL, expiry and minimum protection level (`secret_list`).
- Whether a name exists (`secret_exists`).
- A masked form: the last four characters for values of 12 or more characters, otherwise `********` (`secret_masked`).
- The redacted output of commands you approved (`secret_run`).

It never sees a value, and it cannot approve anything for you.

## What grantpin is not

grantpin narrows what an agent can do with your secrets. It is **not a sandbox**. If you approve a command that sends a key somewhere, grantpin cannot tell. You are the control: read the command in the dialog. The [Security model](/docs/security/) page explains this in full.

## Where to go next

- [Install](/docs/install/) and then the [Quick start](/docs/quick-start/).
- Several projects on one Mac: [Organizing secrets per project](/docs/projects/).
- Connect an agent: [Claude Code and MCP](/docs/claude-code/).
