# JS project template

Greenfield plain-JS starter wired to [`jsg-pr-quality`](https://github.com/crimsonsunset/jsg-pr-quality).

`checkJs` is on by default here (greenfield can afford it). Retrofit an existing JS repo with `pr-quality-cli init` and pass `--js-typecheck` only when you want that migration.

```bash
cp -R templates/js-project my-app
cd my-app
npm install
```

PR-Agent: set `OPENROUTER__KEY` from `OPENROUTER_KEY_PR_AGENT` in `~/.cursor/secrets.env`
(`printf '%s' "$OPENROUTER_KEY_PR_AGENT" | gh secret set OPENROUTER__KEY`).
