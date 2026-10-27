---
title: Security model
description: An honest summary of what grantpin protects against, what it does not, and where the real boundary is.
---

This page summarizes the [full threat model](https://github.com/jmeh-sindikata/grantpin/blob/main/docs/THREAT-MODEL.md). Read that one before you rely on grantpin for anything you care about.

grantpin keeps secret values out of an AI agent's context and makes every release visible to a human. It is **not a sandbox**.

## The one real boundary

The single real security boundary is **human presence at release time**: the dialog that shows the exact command, and the Touch ID prompt behind it. Everything else is defence in depth.

That boundary is enforced by the daemon's own logic, not by cryptography on the vault key. It holds against an agent that has a shell and can talk to the daemon. It does not hold against code that can act as the daemon or take over your account.

## What it protects against

- **Secrets landing in the agent's context, the chat history or the vendor's logs.** No MCP tool and no CLI command returns a value to the agent. The one exception is `grantpin show`, which needs approval each time and refuses to print unless stdout is a terminal.
- **`cat .env` and `printenv` exposure.** There is no plaintext secret on disk and none in your shell's environment. The value exists only in the environment of the one approved command.
- **Silent use.** Every release needs a fresh approval or a grant you created by approving. Every release is audited. Grants are integrity-protected, so a row someone inserts or edits in the vault file never matches.
- **"Fetch the key and send it to X" prompt injection.** There is nothing to fetch. An injected agent can only ask to run a command, and you see the command.
- **Secrets at rest.** Values are encrypted in the vault file. With a Secure Enclave key the vault key cannot be copied to another machine.

## What it does not protect against

- **An approved command that exfiltrates.** If you approve `./deploy.sh` and that script sends the key elsewhere, grantpin cannot tell. There is no sandbox and no network control. You are the control: read the command in the dialog.
- **Code that already runs as you with full control of your account.** Malware can delete the vault, replace the `grantpin` binary or the launchd job, write `.grantpin.yml` files, or replay an old copy of a grant. grantpin is a defence for the agent-with-a-shell case where you are watching the prompts, not for an attacker who owns your user account.
- **Redaction misses.** Redaction is an exact match of the value. Base64, hex, URL-encoding, substrings, hashes and reversed output pass through. `echo $KEY | base64` returns the key to the agent. Redaction catches accidents. It does not stop a command that wants the value out.
- **The weaker Keychain key store.** If the vault was created with the Keychain fallback (a build that cannot use the Secure Enclave), the key is readable by anything running as you, together with the vault file. Treat it as a convenience tier, not a security tier.
- **Changes the agent can make without a prompt.** Storing, overwriting, updating and deleting secrets, and revoking grants, are not behind Touch ID (only *lowering* a secret's protection level asks you). A process running as you can destroy or replace a secret. That is an integrity and availability risk, not a disclosure. These changes are audited.
- **A fooled you.** Prompt fatigue is real. An agent that asks twenty times gets twenty chances. A broad policy prefix such as `[sh, -c]`, or a careless "Allow for N", turns later requests into silent releases.
- **Plaintext metadata.** Secret names, tags, URLs, notes and expiry dates are not encrypted. Do not put anything sensitive in notes. `grantpin masked` returns the last four characters of values with 12 or more characters to any client, without a prompt.
- **A forged agent name.** The caller name is what the client says it is. Any process of yours can use any name, so a grant is really scoped by folder, secrets and command prefix.
- **Reading the audit log.** Any process of yours that can reach the daemon can read it, and it contains every command line.

## Practical advice

- Read the command and the **covers:** line in every dialog. Press Deny when you cannot account for something.
- Prefer **Allow once** for commands you have not seen before. Use **Allow for N** for narrow, repeated work in a repository you trust.
- Put a `.grantpin.yml` in every repository, with narrow command prefixes, and review changes to it like code. See [Policy files](/docs/policy/).
- Press Cancel on any "Create a standing grant?" dialog you did not start with `grantpin grants add`.
- Run `grantpin status` now and then. A `WARNING:` line means a grant failed its integrity check, which means the vault file was edited outside grantpin.
- Start the daemon from the background service rather than letting an agent's shell start it. A daemon started by the MCP shim inherits the agent's `PATH`.

## Early software

grantpin is v0.2 and macOS only. Known gaps and planned work are tracked in the repository's [BACKLOG](https://github.com/jmeh-sindikata/grantpin/blob/main/docs/BACKLOG.md).

For the complete analysis, including each attacker model and the specific design facts behind the claims above, read the [threat model on GitHub](https://github.com/jmeh-sindikata/grantpin/blob/main/docs/THREAT-MODEL.md).
