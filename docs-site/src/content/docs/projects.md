---
title: Organizing secrets per project
description: Use namespaces and a per-project policy to keep one repository from reaching another repository's secrets.
---

grantpin has **one vault**. Separation between projects comes from two things you set up yourself: how you *name* secrets, and a *policy file* in each repository. This page shows a convention that works well.

## Namespaces

A secret name may contain `/`, which you can use as a namespace. Names use the characters `A-Z a-z 0-9 _ / . -`.

For a shop, a blog and a Sentry project they share, you might store:

```sh
grantpin set shop/STRIPE_KEY
grantpin set shop/DATABASE_URL
grantpin set blog/DATABASE_URL
grantpin set shared/SENTRY_DSN
```

`shared/` is just a naming convention for secrets more than one project uses. It has no special meaning to grantpin. Neither does `shop/`. A namespace is only part of the name.

`grantpin list` shows them all. You can add tags (`--tags shop,prod`) and filter with `grantpin list --tag shop`. Tags are labels for you. They do not restrict anything.

## Environment variable names

Inside the command, each secret becomes an environment variable named after the **last path segment**, uppercased (`.` and `-` become `_`):

| Secret name | Environment variable |
|---|---|
| `shop/STRIPE_KEY` | `STRIPE_KEY` |
| `shop/DATABASE_URL` | `DATABASE_URL` |
| `shared/SENTRY_DSN` | `SENTRY_DSN` |

If two secrets in the same run would get the same variable name, **all** of the colliding secrets use their full name instead. Asking for `shop/DATABASE_URL` and `blog/DATABASE_URL` together gives `SHOP_DATABASE_URL` and `BLOG_DATABASE_URL`. Secrets that do not collide keep their short name.

`--env-prefix` puts a prefix in front of every name, verbatim:

```sh
grantpin run --secrets shop/STRIPE_KEY --env-prefix APP_ -- printenv APP_STRIPE_KEY
```

The result must still be a valid uppercase variable name, so `APP_` works and `app_` is an error.

## A policy per project

Put a `.grantpin.yml` at the root of `~/projects/shop` and commit it:

```yaml
version: 1
secrets:
  - shop/**
  - shared/SENTRY_DSN
commands:
  - [npm, run, migrate]
  - [./scripts/deploy.sh]
max_grant_ttl: 2h
```

Now a request from inside `~/projects/shop` (or any subfolder) can only name secrets under `shop/` or `shared/SENTRY_DSN`, and only run those two commands. A request for `blog/DATABASE_URL` is refused with `policy_refused` before any dialog appears. The same agent working in `~/projects/blog` is held to that project's own policy.

Two details worth knowing:

- A **literal** secret name matches a policy entry exactly or through a glob (`shop/**` covers `shop/STRIPE_KEY`). A requested **glob** such as `shop/*` is only allowed if that exact text is in the policy.
- The nearest `.grantpin.yml` wins and policies are never merged. In a monorepo, a policy in a subfolder replaces the one at the root. See [Policy files](/docs/policy/).

:::caution[A policy only restricts]
A policy never approves anything. Requests inside the policy still need your approval or a matching grant. And a policy file is just a file: whoever can write to the repository, including an agent, can create or change one. Review `.grantpin.yml` changes like code.
:::

## Grants follow the same lines

A grant (what "Allow for 1h" creates) is scoped by:

- the **directory** where the request runs, and everything beneath it,
- the **secrets** that were requested,
- the **command prefix** (taken from the policy when there is one),
- and the **caller** name the agent reported.

An hour-long grant made in `~/projects/shop` does not cover `~/projects/blog`. More in [Grants and approvals](/docs/grants/).

## Moving an existing .env file in

`grantpin import` reads `KEY=value` lines from a `.env` file and stores each key as a secret. With `--namespace`, each key is stored under that namespace:

```sh
grantpin import ~/projects/shop/.env --namespace shop --dry-run
grantpin import ~/projects/shop/.env --namespace shop
```

`STRIPE_KEY` in the file becomes the secret `shop/STRIPE_KEY`. `--dry-run` prints the final names without writing anything, and `--on-conflict` (`skip`, `overwrite` or `error`, the default) is checked against those final names, so importing the same file under two namespaces never conflicts. The namespace must be a valid secret name: only `A-Z a-z 0-9 _ / . -`, not starting or ending with `/`, with no `//`, no `..` and no `.` segment. An invalid namespace is refused before the file is read.

:::note[Needs v0.2.2 or newer]
`--namespace` was added in v0.2.2. With v0.2.1, `import` stores keys under their bare names (`STRIPE_KEY`), and you can store namespaced secrets one at a time with `grantpin set shop/STRIPE_KEY`.
:::

Without `--namespace`, keys keep their bare names. An import is not atomic: if the daemon fails midway, some keys may already be stored.

Delete the `.env` file once you have checked the import. That is the point.
