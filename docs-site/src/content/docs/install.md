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

Then open grantpin from Applications once to finish setup (below).

## First launch

On first launch the Welcome window walks you through the setup:

1. **Install Service.** grantpin needs a small background service (a per-user launchd job named `dev.grantpin.daemon`) so agents can reach it. macOS may tell you a background item was added. That is this.
2. **Create Vault.** This creates your encrypted vault and a key for it. On a Mac with a Secure Enclave the key lives there and cannot be copied off the machine. If your Mac cannot create a hardware key (a virtual machine, for example), the app offers **Use Weaker Protection**, which keeps the key in your Keychain instead. Read [Security model](/docs/security/) before choosing that.
3. **First secret.** Add one, or import a `.env` file.
4. **Connect Claude Code.** The window shows the command to run. See [Claude Code and MCP](/docs/claude-code/).

Your vault is stored in `~/Library/Application Support/grantpin`.

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

## Build from source

You need macOS 14 or later, Go 1.27 or newer, and Xcode. See [Build from source](https://github.com/jmeh-sindikata/grantpin#build-from-source) in the repository README for the exact `make` targets.

A build you made yourself is not signed with a provisioning profile, so it cannot use the Secure Enclave. Create the vault with the Keychain fallback:

```sh
grantpin init --keychain-fallback
```

## Uninstalling

See [Uninstall](/docs/uninstall/).
