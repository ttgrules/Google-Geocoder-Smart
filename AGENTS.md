# Copilot Instructions for `Google-Geocoder-Smart`

## Repository focus

- Perl module wrapping Google Geocoding API v3.
- Main implementation is Perl (`lib/`, `Makefile.PL`), with Node tooling only for release automation.

## Read first for this repo

1. `README.md`
2. `.gitea/workflows/ci.yml`
3. `package.json` (release-only tooling)

## CI-aligned validation commands

```bash
yamllint --format github .
find . -type f -name '*.json' -not -path './.git/*' -print0 | while IFS= read -r -d '' file; do jq empty "${file}"; done
npx --yes prettier --check "**/*.{json,md,mjs,yml,yaml}"
find . -type f \( -name '*.pl' -o -name '*.pm' -o -name '*.t' \) -not -path './.git/*' -print0 | while IFS= read -r -d '' file; do perl -Ilib -c "${file}"; done
perl Makefile.PL && make test
perl Makefile.PL && make readme
git --no-pager diff -- README.md
```

## Repo-specific notes

- Keep README generation in sync when changing module docs.
- Release workflow depends on semantic-release tooling in `package.json`.
