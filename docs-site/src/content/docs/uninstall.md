---
title: Uninstall
description: How to remove grantpin, what each method removes, and what it leaves behind.
---

Decide first whether you want to keep your secrets. **Deleting the vault, or the key that protects it, is permanent.** grantpin keeps no copy.

## From the app (recommended)

Open grantpin and go to **Settings**, then **Uninstall**. The sheet lists what it can remove:

| Option | What it does |
|---|---|
| Stop and remove the background service | Removes the launchd job (`dev.grantpin.daemon`) and the `service.wanted` marker, so grantpin does not bring the service back. On by default. |
| Delete my vault | Deletes all secrets, grants and the audit log. You must type `delete` to confirm. It always stops the service first. |
| Delete logs | Deletes the daemon logs. |
| Remove the grantpin command from `~/.local/bin` | Offered when `~/.local/bin/grantpin` is a link into this app (see [Install](/docs/install/#install-the-command-from-the-app-dmg)). Needs v0.2.2 or newer. Only the link is removed, never a file or a link that points elsewhere. |
| Delete the Keychain item / Delete the hardware key | Offered only for the matching vault type. Deleting the key makes the vault permanently unreadable, even if you keep the vault file. |

When it finishes, the sheet lists what stays. Then:

1. Disconnect Claude Code:

   ```sh
   claude mcp remove grantpin
   ```

2. Drag **grantpin** from Applications to the Trash.

If you turned on **Start grantpin when I log in**, the app's Uninstall turns it off. If you remove the app another way, turn it off in grantpin's Settings first.

## With Homebrew

Remove the background service first, with **Settings > Uninstall** in the app or:

```sh
grantpin service uninstall
```

Then:

```sh
brew uninstall --cask grantpin
```

Plain `brew uninstall` quits the app and removes `grantpin.app` and the linked `grantpin` command. It does **not** remove the background service, which is why you remove it first (the cask's own notes say the same). It also **keeps** your vault and everything else in your home folder.

To remove those too:

```sh
brew uninstall --zap --cask grantpin
```

`--zap` also removes the background service, and deletes:

- `~/Library/Application Support/grantpin` (**your vault, with all your secrets, grants and audit log**, and the `service.wanted` marker)
- `~/Library/LaunchAgents/dev.grantpin.daemon.plist`
- `~/Library/Logs/grantpin`
- `~/Library/Preferences/dev.grantpin.app.plist`

It does **not** remove the vault's key from the Keychain. That is removed only by the app's Uninstall (tick the key option) or by `grantpin keystore delete`. The key is useless without the vault file, but you may want it gone. Run the key step *before* you zap if you want it removed, because afterwards the app is gone.

## From the command line

For a from-source build, or to do it by hand:

```sh
grantpin service uninstall
```

That stops and removes the background service, and removes the `service.wanted` marker in the data folder (also when the job was already gone), so grantpin does not bring the service back. To delete the key material (the vault can never be opened again), pick the one that matches your vault:

```sh
grantpin keystore delete --hardware --yes
grantpin keystore delete --fallback --yes
```

Use `--hardware` for a Secure Enclave vault and `--fallback` for one created with `--keychain-fallback`. The command refuses while a daemon is still answering, so stop the service first. Then delete the data folder:

```sh
rm -r ~/Library/Application\ Support/grantpin
rm -r ~/Library/Logs/grantpin
```

Finally remove the app (`/Applications/grantpin.app`) and run `claude mcp remove grantpin`.

## What stays, and where

| Item | Removed by |
|---|---|
| The app, `/Applications/grantpin.app` | Trash, or `brew uninstall --cask grantpin`. |
| The `~/.local/bin/grantpin` link (DMG, v0.2.2 or newer) | App Uninstall (command line option), or `rm ~/.local/bin/grantpin`. |
| The background service and its `service.wanted` marker | App Uninstall or `grantpin service uninstall`. Plain `brew uninstall` leaves the service in place. `brew uninstall --zap` removes it (and the whole data folder). |
| The vault, `~/Library/Application Support/grantpin` | App Uninstall ("Delete my vault"), `brew uninstall --zap`, or deleting the folder. |
| Logs, `~/Library/Logs/grantpin` | App Uninstall ("Delete logs"), `--zap`, or deleting the folder. |
| The vault key (Secure Enclave key or Keychain item) | App Uninstall (key option) or `grantpin keystore delete`. Not removed by `brew --zap`. |
| The Claude Code connection | `claude mcp remove grantpin`. |
| `.grantpin.yml` files in your projects | You. They are ordinary files in your repositories. |
