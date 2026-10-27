---
title: CLI reference
description: Every grantpin command with its flags, plus exit codes, environment variables and file locations.
---

All commands that talk to the background daemon accept `--socket PATH` (default: `$GRANTPIN_SOCKET` or the platform default). It is left out of the tables below.

```text
grantpin [command]
```

Global flags: `-h, --help` and `-v, --version`. `grantpin completion` (bash, zsh, fish, powershell) is the standard shell-completion generator.

| Command | Purpose |
|---|---|
| [`init`](#grantpin-init) | Create the vault. |
| [`set`](#grantpin-set) | Store a secret. |
| [`list`](#grantpin-list) | List secret names and metadata. |
| [`masked`](#grantpin-masked) | Show the masked form of a secret. |
| [`update`](#grantpin-update) | Change a secret's metadata. |
| [`delete`](#grantpin-delete) | Delete a secret. |
| [`show`](#grantpin-show) | Print a secret to the terminal. |
| [`run`](#grantpin-run) | Run a command with secrets injected. |
| [`import`](#grantpin-import) | Import a `.env` file. |
| [`grants`](#grantpin-grants) | List, add and revoke grants. |
| [`audit`](#grantpin-audit) | Read, verify and export the audit log. |
| [`status`](#grantpin-status) | Show daemon, vault and backend status. |
| [`daemon`](#grantpin-daemon) | Run the daemon in the foreground. |
| [`service`](#grantpin-service) | Install or remove the background service. |
| [`mcp`](#grantpin-mcp) | Run the MCP server. |
| [`keystore delete`](#grantpin-keystore-delete) | Delete the vault's key material. |

## grantpin init

```sh
grantpin init [--keychain-fallback]
```

Creates the vault and wraps its key. It does not need the daemon. It refuses if a vault already exists.

| Flag | Meaning |
|---|---|
| `--keychain-fallback` | If the Secure Enclave is unavailable, protect the vault key with a Keychain item instead of failing (weaker, `dialog` tier). Recorded in the vault, so later commands need no flag. |

## grantpin set

```sh
grantpin set NAME [flags]
```

Stores a secret. The value is read from stdin when stdin is not a terminal (one trailing newline is stripped), otherwise from a hidden prompt. It is never accepted as an argument. Fails with `secret_exists` unless `--overwrite` is given. The value must not be empty and is limited to 1 MiB. Storing a secret is not behind Touch ID.

```sh
printf %s "sk_test_example" | grantpin set shop/STRIPE_KEY --tags shop,prod --expires 90d
```

| Flag | Meaning |
|---|---|
| `--expires DURATION` | Expiry, for example `30d`. Accepts Go durations plus `Nd` and `Nw`. |
| `--min-tier TIER` | Minimum presence tier: `none`, `dialog`, `hardware`. `none` means the vault default. |
| `--notes TEXT` | Free-form notes. Stored unencrypted. |
| `--overwrite` | Replace the secret if it exists. |
| `--tags a,b` | Comma-separated tags. |
| `--url URL` | A URL to associate with the secret. |

Names use `A-Z a-z 0-9 _ / . -`, with `/` for namespaces.

## grantpin list

```sh
grantpin list [--tag TAG] [--expiring DURATION]
```

Prints name, tier, expiry, tags and URL. Never values.

| Flag | Meaning |
|---|---|
| `--tag TAG` | Only secrets with this tag. |
| `--expiring DURATION` | Only secrets expiring within this time, for example `7d`. Includes already-expired secrets. |

## grantpin masked

```sh
grantpin masked NAME
```

Prints `****` plus the last four characters for values of 12 or more characters, otherwise `********`. No approval needed.

## grantpin update

```sh
grantpin update NAME [flags]
```

Changes a secret's metadata without reading or sending its value. Fields you leave out stay as they are.

```sh
grantpin update API_KEY --tags prod,billing --expires 90d
grantpin update API_KEY --url "" --clear-expires
```

| Flag | Meaning |
|---|---|
| `--tags a,b` | Replace the tags. Empty clears them. |
| `--url URL` | Replace the URL. Empty clears it. |
| `--notes TEXT` | Replace the notes. Empty clears them. |
| `--expires DURATION` | New expiry, counted from now. |
| `--clear-expires` | Remove the expiry. |
| `--min-tier TIER` | Set the minimum tier (`none`, `dialog`, `hardware`). Re-encrypts the value. Lowering it asks you first (dialog and Touch ID). |

Not behind Touch ID, except lowering `--min-tier`.

## grantpin delete

```sh
grantpin delete NAME
```

Deletes a secret. Not behind Touch ID.

## grantpin show

```sh
grantpin show NAME
```

The only command that returns a value. It needs approval every time (it never uses or creates grants) and refuses with exit 78 unless stdout is a terminal.

## grantpin run

```sh
grantpin run --secrets NAME[,NAME...] [flags] -- COMMAND [ARGS...]
```

Runs a command with secrets injected as environment variables, and streams the output back with every injected value replaced by `[REDACTED:NAME]`. Everything after `--` is the command. It runs directly, with no shell, and its stdin is `/dev/null`.

```sh
grantpin run --secrets shop/STRIPE_KEY,shared/SENTRY_DSN -- npm run deploy
```

| Flag | Meaning |
|---|---|
| `--secrets a,b` | Secret names or globs (`aws/*`, `aws/**`) to inject. Comma-separated or repeated. |
| `--env-prefix PREFIX` | Prefix put in front of every variable name, verbatim. The result must be a valid uppercase variable name. |
| `--timeout DURATION` | Kill the command after this long, for example `10m`. It does not include the time you take to answer the prompt. Without it the daemon's cap of 1 hour applies, and larger values are capped at 1 hour. |
| `--caller LABEL` | Caller label recorded in grants and the audit log. Informational. Defaults to `cli`. |

Variable names come from the last path segment of the secret, uppercased, with `.` and `-` turned into `_`. If two secrets would collide, all colliding secrets use their full name instead (`aws/api_key` becomes `AWS_API_KEY`).

## grantpin import

```sh
grantpin import FILE [flags]
```

Imports `KEY=value` lines from a `.env` file (`FILE` may be `-` for stdin). Handles an `export` prefix, quotes and `#` comments; there is no `${VAR}` expansion. Keys must match `[A-Za-z_][A-Za-z0-9_]*`. Empty values are skipped, and for duplicate keys the last wins. Names are checked before anything is written, but a daemon error midway can leave a partial import.

| Flag | Meaning |
|---|---|
| `--dry-run` | Show what would be imported without writing. |
| `--on-conflict MODE` | When a name already exists: `skip`, `overwrite` or `error` (default). |

## grantpin grants

```sh
grantpin grants              # same as: grantpin grants list
grantpin grants list
grantpin grants add --caller NAME --secrets A,b/* --ttl 30d [--cwd DIR] [--uses N] -- COMMAND [ARGS...]
grantpin grants revoke [ID] [--all]
```

See [Grants and approvals](/docs/grants/) for what these mean.

`grants list` needs no approval. The STANDING column marks grants made with `add`, EXPIRES is the time left, and a grant that fails its integrity check is shown as `TAMPERED`.

`grants add` flags:

| Flag | Meaning |
|---|---|
| `--caller NAME` | Who the grant is for. Required, no default. Stored lowercased with spaces and `_` folded to `-`. |
| `--secrets a,b` | Secret names or globs the grant covers. |
| `--ttl DURATION` | How long it lasts, for example `30d` or `12h`. Required, at most 90 days (or the policy's `max_standing_grant_ttl`). |
| `--cwd DIR` | Folder the grant covers, with its subfolders. Default: the current directory. |
| `--uses N` | End the grant after N releases. Default: unlimited within `--ttl`. |
| `--cmd` | The rest of the line is the command prefix (same as `--`). Must be the last flag. |

`grants add` always asks for approval (a dialog, then Touch ID). Exit 77 if you cancelled or the dialog could not be shown, 78 if the policy or the secret's tier refused it.

`grants revoke` takes a grant ID or `--all`. It needs no approval, and is audited.

## grantpin audit

```sh
grantpin audit [--limit N] [--before ID]     # same as: grantpin audit list
grantpin audit list [--limit N] [--before ID]
grantpin audit verify
grantpin audit export [--csv]
```

| Flag | Meaning |
|---|---|
| `--limit N` | Maximum entries to show. Default 100, at most 1000. |
| `--before ID` | Only entries with an ID below this one, to page back through the log. |

`audit verify` recomputes the HMAC chain and exits 1 if it is broken. `audit export` prints CSV (the only format). See [Audit log](/docs/audit/).

## grantpin status

```sh
grantpin status
```

Shows the daemon's PID, version, socket and uptime, whether a vault exists, the key store and approver tiers, and the number of secrets and active grants. It prints a `WARNING:` line if any grant failed its integrity check. It works without a vault, and exits 69 if the daemon is not running.

## grantpin daemon

```sh
grantpin daemon
```

Runs the daemon in the foreground until SIGINT or SIGTERM. You normally use the background service instead. It refuses to start if another daemon answers on the same socket.

## grantpin service

```sh
grantpin service install [--exe PATH] [--log-dir DIR] [--path PATH] [--socket PATH]
grantpin service status
grantpin service uninstall
```

macOS only. `install` writes `~/Library/LaunchAgents/dev.grantpin.daemon.plist` and starts the job in your login session. It is safe to run again after moving the binary or changing your `PATH`. `status` exits 3 if the service is not installed.

| Flag (`install`) | Meaning |
|---|---|
| `--exe PATH` | The grantpin binary or `.app` bundle the service runs. Default: this executable. |
| `--log-dir DIR` | Where daemon logs go. Default `~/Library/Logs/grantpin`. |
| `--path PATH` | The `PATH` the daemon, and the commands it runs, get. Default: the `PATH` of the shell you run `install` from. |
| `--socket PATH` | Socket path to record for the daemon as `GRANTPIN_SOCKET`. |

`install` refuses a binary in a temporary directory.

## grantpin mcp

```sh
grantpin mcp [--socket PATH]
```

Runs the stdio MCP server. See [Claude Code and MCP](/docs/claude-code/).

## grantpin keystore delete

```sh
grantpin keystore delete (--fallback | --hardware) --yes [--force]
```

Deletes the key material that protects the vault, for uninstalling. **Afterwards the vault can never be opened again and its secrets cannot be recovered.**

| Flag | Meaning |
|---|---|
| `--fallback` | Delete the Keychain item of a vault created with `init --keychain-fallback`. |
| `--hardware` | Delete the Secure Enclave key. |
| `--yes` | Required. There is no other prompt. |
| `--force` | Delete even if the daemon is running. Without it the command refuses while a daemon answers; stop the service first. |

Give exactly one of `--fallback` and `--hardware`. Exit: 0 deleted, 3 there was no such key material, 2 refused, 1 any other failure.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. For `run`: the command exited 0. |
| 1 | Any other failure: bad request, secret not found, internal error, `audit verify` found a broken chain, usage error. |
| 69 | The daemon is not running. |
| 77 | Denied: you pressed Deny, the approval could not be obtained, or no grant matched and the approver refused. |
| 78 | Refused by a hard rule: policy, presence tier, an expired secret, or `show` not on a terminal. |
| 124 | Timeout. The command exceeded `--timeout` (its process group is killed), or the request's overall deadline passed. |
| 128+N | `grantpin run` was interrupted by signal N (130 for Ctrl-C, 143 for SIGTERM). |
| 126, 127 | From `run`: the command could not be executed, or was not found. |
| other | `grantpin run` exits with the command's own status. A command that itself exits 69, 77 or 78 looks the same as the codes above; check stderr if it matters. |

`service status` and `keystore delete` use exit 3 as described above.

## Environment variables

| Name | Meaning |
|---|---|
| `GRANTPIN_HOME` | If set, the vault is `$GRANTPIN_HOME/vault.db`. It does not move the socket. |
| `GRANTPIN_SOCKET` | If set, the socket path used by the daemon and every client. `--socket` overrides it per command. |
| `XDG_DATA_HOME` | If set and absolute, the vault is `$XDG_DATA_HOME/grantpin/vault.db`. |
| `XDG_RUNTIME_DIR` | If set, the socket is `$XDG_RUNTIME_DIR/grantpin.sock`. |

## Files

| Path | What |
|---|---|
| `~/Library/Application Support/grantpin/vault.db` | The vault: secrets, grants and the audit log. Mode 0600. |
| `~/Library/Application Support/grantpin/grantpin.sock` | The daemon's socket. Mode 0600, same user only. |
| `~/Library/LaunchAgents/dev.grantpin.daemon.plist` | The background service definition. |
| `~/Library/Logs/grantpin/daemon.out.log`, `daemon.err.log` | Service logs. They hold operation names, callers, folders and outcomes, not command lines or values. |
| `<project>/.grantpin.yml` | A project's [policy](/docs/policy/). |
