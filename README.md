# grantpin landing page

Website: https://grantpin.dev/

Repository: https://github.com/jmeh-sindikata/grantpin-web

Buildless, responsive HTML/CSS/JavaScript using the selected grantpin icon and self-hosted IBM Plex Sans. IBM Plex Mono is used only for commands and small technical labels. Font licenses are in `dist/fonts/OFL.txt`.

## Preview locally

```sh
npm run dev
```

Open the printed local URL. No package installation or build is needed. The deployable page and all of its assets are in `dist/`.

## Set the download URL

Edit `dist/site-config.js`:

```js
window.GRANTPIN_CONFIG = {
  downloadUrl: 'https://github.com/jmeh-sindikata/grantpin/releases/latest',
  downloadNote: 'macOS 14+ · Latest release on GitHub'
};
```

Both download buttons point to the latest GitHub release page, including when JavaScript is unavailable. The runtime configuration can override both links. If clearing the configuration for a future placeholder, also update the HTML fallback links and notes. No app archive is included in the website.

The approval interaction is an explicitly labelled illustration: it does not run commands, read credentials, or request authentication. No analytics, remote scripts, external fonts, accounts, or data collection are included.

Product copy was based on a read-only inspection of the Secrets project's documentation and SwiftUI source. The source app project was not changed.

## GitHub Pages

The GitHub Actions workflow in `.github/workflows/pages.yml` checks the JavaScript and deploys only `dist/` on pushes to `main`. Configure the repository's Pages source as **GitHub Actions**. It can also be run manually from the Actions tab.

All asset paths are relative, so the page works under a repository path on GitHub Pages. No app binaries or application source code are bundled in the website.
