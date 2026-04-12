# Local CI Repro Steps

This file shows how to reproduce linting and validation CI jobs locally.

## Prerequisites

- `yamllint`
- `jq`
- `actionlint`

## Reproduce Individual Jobs

### YAML Lint

```bash
yamllint --format github .
```

### Actionlint (Gitea-compatible rules)

```bash
  actionlint \
  -ignore 'context "env" is not allowed here' \
  -ignore 'gitea-upload-artifact@v4' \
  -ignore 'property "permissions" is not defined' \
  -ignore 'gitea-download-artifact@v4' \
  -ignore 'SC2001:' \
  -ignore 'SC2129:' \
  .gitea/workflows/ci.yml
```

### JSON Validate

```bash
find . -type f -name '*.json' -not -path './.git/*' -not -path './node_modules/*' -print0 |
  while IFS= read -r -d '' file; do
    echo "Validating ${file}"
    jq empty "${file}"
  done
```

### Perl Tests

```bash
perl Makefile.PL
make test
```

### Perl Dist Tests

```bash
perl Makefile.PL
rm -f ./*.tar.gz
make dist
set -- ./*.tar.gz
[ -e "$1" ] || { echo "No dist tarball produced."; exit 1; }
TARBALL="$1"
DIST_DIR="${TARBALL%.tar.gz}"
[ -n "${DIST_DIR}" ] || { echo "Unable to determine extracted dist directory."; exit 1; }
tar -xzf "${TARBALL}"
cd "${DIST_DIR}"
perl Makefile.PL
make test
```
