# Repository CI and Releasing

This repository ships one Gitea workflow:

- `.gitea/workflows/ci.yml`
  - YAML linting (`yamllint`)
  - Perl syntax checks (`perl -c`)
  - Module tests (`perl Makefile.PL && make test`)
  - semantic-release pipeline on pushes to `master` after CI jobs pass
  - PR-title-driven semver (`feat` => minor, breaking => major, `fix|perf|revert|chore(deps)` => patch)
  - updates and commits `$VERSION` in `lib/Google/GeoCoder/Smart.pm` on release
  - builds and uploads the release tarball as a Gitea release asset
  - uploads the release tarball to PAUSE with duplicate-release guard

## Releasing

1. Use Conventional Commit style PR titles (for example `fix: ...`, `feat: ...`,
   or `chore(deps): ...`).
2. Merge to `master`.
3. CI release job runs semantic-release, bumps `$VERSION` in
   `lib/Google/GeoCoder/Smart.pm`, commits the bump on `master`, tags, and
   creates the Gitea release.
4. CI builds `Google-GeoCoder-Smart-<version>.tar.gz`, attaches it to the
   release, and uploads it to PAUSE.

### Required repository secrets

- `REGISTRY_USERNAME`
- `REGISTRY_TOKEN`
- `API_TOKEN_GITEA`
- `PAUSE_USERNAME`
- `PAUSE_PASSWORD`

# README.md generation

Primary documentation should live in this module POD.

To regenerate `README.md` from POD:

```sh
make readme
```

or:

```sh
pod2markdown lib/Google/GeoCoder/Smart.pm > README.md
```

(Requires `pod2markdown`, typically from `Pod::Markdown`.)

Repository workflow/CI/release documentation lives in `RELEASING.md`.
