---
title: Troubleshooting
description: Errors and refusals you may see, what they mean, and how to fix them.
---

Most failures come with a short reason in the message. Find it below.

## Denials and refusals

A **denied** result (exit 77) means nobody approved it. A **refused** result (exit 78) means a hard rule said no, so no prompt was shown.

| You see | Meaning and fix |
|---|---|
| `denied: user_denied` (exit 77) | You pressed Deny, pressed Esc, closed the dialog, cancelled the authentication sheet, or left it for 120 seconds. Ask again and approve if you want it. |
| `denied (approver_unavailable)` (exit 77) | The prompt could not be shown: no desktop session (the daemon was started over SSH, for example), no device password set, or the dialog failed. It never turns into an allow. Start the daemon from the background service in your login session. |
| `refused (policy_refused)` (exit 78) | The project's `.grantpin.yml` does not allow the secret or the command, or the file is unreadable, invalid, not owned by you, or world-writable. The message names the item. See [Policy files](/docs/policy/). |
| `refused (tier_unmet)` (exit 78) | A secret needs a protection level your key store or approver does not provide. Levels are never downgraded. See [Presence tiers](/docs/grants/#presence-tiers). |
| `refused (secret_expired)` (exit 78) | A secret is past its expiry. `grantpin update` works on an expired secret: give it a new expiry with `grantpin update NAME --expires 30d`, or remove the expiry with `grantpin update NAME --clear-expires`. |
| `show` refuses (exit 78) | `grantpin show` only prints to a terminal. |

## Daemon and vault

| You see | Meaning and fix |
|---|---|
| `grantpin daemon is not running` (exit 69) | Nothing is listening on the socket. Open the grantpin app, or run `grantpin service install`, or run `grantpin daemon` in a spare terminal. |
| `vault not initialized; run grantpin init` | The daemon is up but there is no vault yet. Create it in the app, or run `grantpin init`. No restart is needed. |
| `vault_locked`, or `grantpin status` shows `vault: locked (retrying ...)` | The Secure Enclave key can only be used while your Mac is unlocked, and macOS refuses it on a locked screen or right after login. The daemon keeps retrying, so unlock the Mac and the next request works. Nothing needs restarting. For a moment after the daemon starts you may see `vault is being opened`. If it stays locked while you are logged in, read the last error in `grantpin status`. |
| `init` fails with a Secure Enclave error (`-34018`) | This build or Mac cannot create a Secure Enclave key (a from-source build, a virtual machine, a Mac without a Secure Enclave). Use `grantpin init --keychain-fallback`. No flag is needed afterwards. |
| `init` says a vault already exists | `init` never overwrites. Use the existing vault. |
| `grantpin status` prints `WARNING:` about grants | A grant failed its integrity check, which means the vault file was edited outside grantpin. `grantpin grants` shows it as `TAMPERED`. Revoke it. |
| `busy` | The daemon has too many open connections. Retry shortly. |

## Running commands

| You see | Meaning and fix |
|---|---|
| `command not found` (exit 127) | The command was not found on the **daemon's** `PATH`, not yours. The background service uses the `PATH` of the shell where `service install` ran. Run `grantpin service install` again from a shell with the right `PATH`, or pass `--path`. |
| Exit 126 | The command was found but could not be executed. Check the file's permissions. |
| Exit 124 | The command ran longer than `--timeout` (or the 1 hour cap) and was killed. |
| `secret_not_found` | There is no secret with that name. Check `grantpin list`. |
| `secret_exists` | `grantpin set` will not overwrite. Add `--overwrite` if you mean to. |
| `bad_request` on `grants add` | Usually `--ttl` is above the ceiling (90 days, or the policy's `max_standing_grant_ttl`). It is refused, not shortened. |
| A relative `cwd` is rejected | `secret_run` needs an absolute `cwd`. |
| Environment variable has an unexpected name | Names come from the last path segment, uppercased. When two secrets in one run collide, both use their full name. See [Organizing secrets per project](/docs/projects/). |

## Claude Code does not see grantpin

- Restart Claude Code or run `/mcp`. The server should list `secret_list`, `secret_exists`, `secret_masked` and `secret_run`.
- If you registered the short form (`grantpin mcp`), `grantpin` must be on the `PATH` that Claude Code sees. Use the absolute path from the app's Connect screen instead.
- Already connected with an older path? Run `claude mcp remove grantpin`, then add it again.
- See [Claude Code and MCP](/docs/claude-code/).

## The service

| You see | Meaning and fix |
|---|---|
| `service install` refuses the binary | It will not install a binary from a temporary directory. Put grantpin in a permanent location first. |
| `grantpin service status` exits 3 | The service is not installed. |
| Something changed after moving or updating the app | Run `grantpin service install` again. It is safe to repeat. |

Service logs are in `~/Library/Logs/grantpin/` (`daemon.out.log` and `daemon.err.log`).

If something here is wrong or missing, please [open an issue](https://github.com/jmeh-sindikata/grantpin/issues).
