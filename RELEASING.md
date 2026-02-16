# Repository CI and Releasing

This repository ships two Gitea workflows:

- `.gitea/workflows/ci.yml`
  - YAML linting (`yamllint`)
  - Perl syntax checks (`perl -c`)
  - Module tests (`perl Makefile.PL && make test`)
- `.gitea/workflows/release.yml`
  - release/publish pipeline on pushes to `master` and manual dispatch
  - duplicate tag/release guard
  - duplicate PAUSE upload guard

## Releasing

1. Update `$VERSION` in `lib/Google/GeoCoder/Smart.pm`.
2. Update `Changes`.
3. Merge to `master` or run `workflow_dispatch`.

The workflow refuses to re-release an existing tag/version and refuses to
re-upload an existing PAUSE release.

### Prompting for version

Manual `workflow_dispatch` prompts for `release_version`; it must match module
`$VERSION`.

### Required repository secrets

- `REGISTRY_USERNAME`
- `REGISTRY_TOKEN`
- `API_TOKEN_GITEA`
- `PAUSE_USERNAME`
- `PAUSE_PASSWORD`
