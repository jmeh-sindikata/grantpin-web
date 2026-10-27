import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";

// Served at https://grantpin.dev/docs/ next to the landing page.
export default defineConfig({
  site: "https://grantpin.dev",
  base: "/docs",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "grantpin docs",
      description:
        "Documentation for grantpin, a local secrets broker for AI coding agents on macOS.",
      logo: {
        src: "./src/assets/grantpin-icon.svg",
        alt: "grantpin",
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/jmeh-sindikata/grantpin",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/jmeh-sindikata/grantpin-web/edit/main/docs-site/",
      },
      lastUpdated: false,
      customCss: ["./src/styles/fonts.css", "./src/styles/theme.css"],
      components: {
        // The landing page is dark only: no theme toggle, theme forced to dark.
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/Empty.astro",
        // Header links: Home (back to the landing page) and GitHub.
        SocialIcons: "./src/components/HeaderLinks.astro",
      },
      expressiveCode: {
        themes: ["github-dark"],
        useStarlightUiThemeColors: false,
        styleOverrides: {
          codeBackground: "#101e33",
          borderColor: "#26354a",
          codeFontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          uiFontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        },
      },
      plugins: [starlightLinksValidator()],
      sidebar: [
        { label: "Introduction", slug: "introduction" },
        { label: "Install", slug: "install" },
        { label: "Quick start", slug: "quick-start" },
        { label: "Organizing secrets per project", slug: "projects" },
        { label: "Policy files", slug: "policy" },
        { label: "Grants and approvals", slug: "grants" },
        { label: "Claude Code and MCP", slug: "claude-code" },
        { label: "Audit log", slug: "audit" },
        { label: "CLI reference", slug: "cli" },
        { label: "Security model", slug: "security" },
        { label: "Troubleshooting", slug: "troubleshooting" },
        { label: "Uninstall", slug: "uninstall" },
      ],
    }),
  ],
});
