---
title: Install
description: Install grantpin from the DMG, with Homebrew, or from source.
---

grantpin needs macOS 14 or later. The DMG is a universal build (Apple Silicon and Intel).

## Download the DMG

Get the latest DMG from the [releases page](https://github.com/jmeh-sindikata/grantpin/releases/latest). It is signed with a Developer ID and notarized by Apple.

1. Open the DMG and drag **grantpin** to **Applications**.
2. Open grantpin from Applications. The first time, macOS may say it was downloaded from the Internet. Choose **Open**.
3. grantpin lives in the menu bar. There is no Dock icon.

grantpin must run from the Applications folder. If it is somewhere else, the app offers **Move to Applications and Relaunch**.

## Homebrew

```sh
brew install --cask jmeh-sindikata/grantpin/grantpin
```

That one command is three parts: `jmeh-sindikata/grantpin` is the *tap* (the GitHub repository `jmeh-sindikata/homebrew-grantpin`; Homebrew leaves out the `homebrew-` prefix), and the last `grantpin` is the *cask* inside that tap. Homebrew adds the tap for you the first time. The cask installs the same signed app as the DMG and also links the `grantpin` command into your `PATH`.

This is a personal tap. grantpin is not in the official homebrew-cask yet.

Then open grantpin from Applications once to finish setup (below). Upgrades with Homebrew keep the background service. See [Updating](#updating) for the exception.

## First launch

On first launch the Welcome window walks you through the setup:

1. **Install Service.** grantpin needs a small background service (a per-user launchd job named `dev.grantpin.daemon`) so agents can reach it. macOS may tell you a background item was added. That is this (see [The background service](#the-background-service)).
2. **Create Vault.** This creates your encrypted vault and a key for it. On a Mac with a Secure Enclave the key lives there and cannot be copied off the machine. If your Mac cannot create a hardware key (a virtual machine, for example), the app offers **Use Weaker Protection**, which keeps the key in your Keychain instead. Read [Security model](/docs/security/) before choosing that.
3. **First secret.** Add one, or import a `.env` file.
4. **Connect Claude Code.** The window shows the command to run. See [Claude Code and MCP](/docs/claude-code/).

Your vault is stored in `~/Library/Application Support/grantpin`.

## The background service

grantpin keeps one small process running, the *daemon*. It shows the approval dialogs, checks policy, runs your commands and writes the audit log. Agents talk to it, so it has to be running whenever an agent asks for a secret.

The service is a per-user launchd job named `dev.grantpin.daemon`. It is never root. It starts when you log in to your Mac (not at boot, because the prompts need your desktop session), and launchd restarts it if it exits with an error. Its logs are in `~/Library/Logs/grantpin/`.

### The macOS "background item" notice

When the service is installed, macOS shows a notice that "S.A.P. SH.P.K." added a background item. That name is the developer name from grantpin's signing certificate, and the item is grantpin's service. You can switch it off any time in **System Settings > General > Login Items & Extensions**. Without it, agents cannot reach grantpin.

### The menu-bar icon

The menu-bar icon shows what the service is doing. Hover over it to see the same text as a tooltip.

| Icon | Meaning | Tooltip |
|---|---|---|
| Plain | grantpin is running and the vault is open. | `grantpin` |
| Dimmed, no dot | The vault is locked (the Secure Enclave key cannot be used while your Mac is locked), or grantpin is still checking. grantpin keeps trying. | `grantpin: vault locked`, `grantpin: checking` |
| Dimmed, **red** dot | The background service is not running. Open the popover and press **Start** (or **Restart**). | `grantpin: not running` |
| **Orange** dot | There is no vault yet, some grants failed verification, or grantpin was updated and the background service still runs the old version (v0.2.5 or newer, see [Restart after an update](#restart-after-an-update)). Nothing is down. | `grantpin: no vault yet`, `grantpin: grants failed verification`, `grantpin: updated, restart needed` |

A red dot means no agent can use grantpin until you act. See [Troubleshooting](/docs/troubleshooting/#the-background-service-and-the-app).

### Automatic restore

:::note[Needs v0.2.4 or newer]
Automatic restore and the `service.wanted` marker were added in v0.2.4.
:::

Sometimes the launchd job disappears without you removing it. A package manager can delete it when it upgrades an older grantpin (see [Updating](#updating)). grantpin can tell this apart from "never set up", because installing the service leaves a small marker file, `service.wanted`, in the data folder (`~/Library/Application Support/grantpin`).

- If the marker exists and the job is gone, the app brings the service back by itself after about 10 seconds, the same way **Start** does. It does this only when the vault exists, the app runs from the Applications folder, the Welcome window is finished and the app is not in development mode.
- It counts as restored only once the daemon answers, which it has up to 10 seconds to do after the service is started. From then on the popover shows "grantpin restored its background service." for ten minutes, or until the service stops again, and **Settings > General** shows when it was restored.
- It tries once per app launch. If that fails, if the daemon does not answer in time, if you never installed the service, or if the service is installed but stopped or not answering, grantpin opens a small window, **grantpin background service**, with **Start**, **Repair** or **Restart**.
- While the service is being changed some other way (**Start** in the popover, an action in Settings, **Install Service** in the Welcome window, or an open Uninstall sheet), the app decides nothing. It looks again when that action ends.
- Once that window has opened, grantpin does not restore the service silently until the daemon has been answering for a minute. If the service stops again right after a restore, even within that minute, the window asks.
- It never installs the service silently on a first run. First-run setup is the Welcome window, where you press **Install Service** yourself.
- If you remove the service on purpose, with **Settings > Uninstall**, by turning off **Keep grantpin running in the background** in **Settings > General**, or with `grantpin service uninstall`, the marker is removed too, so the service stays removed.

A service installed by an older version has no marker yet. After upgrading from such a version the app asks you to press **Start**, and that writes the marker.

### Restart after an update

:::note[Needs v0.2.5 or newer]
The automatic restart, the orange dot for it and the `runs:` line of `grantpin status` were added in v0.2.5.
:::

After `brew upgrade` or a replaced app, the background service that was already running keeps running the old version until it is restarted. The app notices that its version and the service's differ. The menu-bar icon gets an orange dot (tooltip `grantpin: updated, restart needed`), and the popover says "grantpin was updated. Restart the background service to finish." with **Restart**.

- If nothing is running through the service, the app restarts it by itself, the same way **Restart** does. `grantpin status` shows this as `runs: 0 in flight`. A run waiting on an approval dialog counts as running. Afterwards the popover shows "grantpin restarted its background service after the update." for ten minutes, or until the service stops again, and **Settings > General** shows when.
- If something is running, the app waits. After about 10 seconds it opens the small **grantpin background service** window with **Restart** and **Later**. Once nothing runs through the service any more, the app restarts it by itself, also after **Later**.
- If the service is too old to report its runs (a service older than v0.2.5, which is the case during the first update to v0.2.5), the app cannot know whether anything is running, so it does not restart by itself. It opens the same window and asks.
- It restarts by itself at most once per launch, only when the running service is an older release than the app, and not during first-run setup, in development mode, or when the app is not in the Applications folder. If the restart fails, or the old version still answers afterwards, the window asks.
- From a terminal, `grantpin service install` restarts the service any time.

## Using the command line

The `grantpin` command-line tool is inside the app bundle:

```text
/Applications/grantpin.app/Contents/Helpers/grantpin-daemon.app/Contents/MacOS/grantpin
```

With Homebrew it is already on your `PATH` as `grantpin`.

### Install the command from the app (DMG)

:::note[Needs v0.2.2 or newer]
The "Command line tool" section in Settings was added in v0.2.2. With v0.2.1, use the alias below.
:::

Open grantpin, go to **Settings**, then **General**, and find **Command line tool**. Click **Install**. It creates one symbolic link, `~/.local/bin/grantpin`, that points to the program inside the app. Nothing else is written: no `sudo`, no `/usr/local/bin`, and no edits to your shell's startup files.

- It never overwrites anything. If `~/.local/bin/grantpin` already exists as a file, or as a link to somewhere else, grantpin leaves it alone and tells you what is in the way.
- If `~/.local/bin` is not on your `PATH`, Settings shows the line to add. For zsh or bash, add it to your shell's startup file (for zsh, `~/.zshrc`) and open a new Terminal window:

  ```sh
  export PATH="$HOME/.local/bin:$PATH"
  ```

  For fish, run this once:

  ```sh
  fish_add_path ~/.local/bin
  ```

- The app has to be in the Applications folder, otherwise the link would point to a temporary location.
- The Uninstall sheet offers to remove the link again. See [Uninstall](/docs/uninstall/).

Homebrew users do not need this. The cask already links the command.

### Or use an alias

If you would rather not install the link (or you are on v0.2.1), call the program by its full path, or add an alias to your shell profile:

```sh
alias grantpin='/Applications/grantpin.app/Contents/Helpers/grantpin-daemon.app/Contents/MacOS/grantpin'
```

The rest of these docs write `grantpin` for this command.

## Updating

There is no auto-update yet.

```sh
brew upgrade --cask grantpin
```

Or download the new DMG and drag the app over the old one. Your vault is not touched.

The background service keeps running the old version until it is restarted. From v0.2.5 the app does that for you when it is safe. See [Restart after an update](#restart-after-an-update). With an older version, press **Restart** in the popover, or run `grantpin service install`.

:::note[Upgrading from v0.2.1, v0.2.2 or v0.2.3 with Homebrew]
The Homebrew cask of those older versions removed the background service on every upgrade. After upgrading *from* one of them, open grantpin and press **Start** once (the menu-bar icon shows a red dot until you do). Later upgrades keep the service.
:::

## Build from source

You need macOS 14 or later, Go 1.27 or newer, and Xcode. See [Build from source](https://github.com/jmeh-sindikata/grantpin#build-from-source) in the repository README for the exact `make` targets.

A build you made yourself is not signed with a provisioning profile, so it cannot use the Secure Enclave. Create the vault with the Keychain fallback:

```sh
grantpin init --keychain-fallback
```

## Uninstalling

See [Uninstall](/docs/uninstall/).
