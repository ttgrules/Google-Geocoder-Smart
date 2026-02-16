# Google::GeoCoder::Smart

Perl module for interacting with Google's Geocoding API v3 endpoint.

## What this module does

- Sends geocoding requests to:
  - `https://maps.googleapis.com/maps/api/geocode/json`
- Supports:
  - structured address parts (`address`, `city`, `state`, `zip`)
  - `place_id`
  - optional `language`, `region`, and `components`
- Returns decoded API payloads with `rawJSON` attached for debugging.

## Installation

```bash
perl Makefile.PL
make
make test
make install
```

## Dependencies

Runtime dependencies are declared in `Makefile.PL`:

- `HTTP::Tiny`
- `JSON::PP`
- `URI::Escape`

## Usage

```perl
use Google::GeoCoder::Smart;

my $geo = Google::GeoCoder::Smart->new(
  key => $ENV{GOOGLE_MAPS_API_KEY},
);

my $response = $geo->geocode_addr({
  address => '1600 Amphitheatre Parkway',
  city    => 'Mountain View',
  state   => 'CA',
  zip     => '94043',
});

die $response->{status} if $response->{status} ne 'OK';
```

## Updating the module

When changing request behavior:

1. Keep compatibility for `geocode()` (legacy wrapper).
2. Prefer `geocode_addr()` for new code.
3. Ensure request URLs stay aligned with Google Geocoding API v3 parameters.
4. Run tests before release.

## Testing

Run module tests with:

```bash
make test
```

The test suite does **not** require internet access. HTTP calls are mocked in tests.

## CI

Gitea CI workflow (`.gitea/workflows/ci.yml`) runs:

- YAML linting (`yamllint`)
- Perl syntax checks (`perl -c`)
- Module tests (`perl Makefile.PL && make test`)

CI uses the shared private generic container image and registry credentials.

## Releasing and Publishing

Release/publish automation is split into `.gitea/workflows/release.yml` and runs on:

- pushes to `master`
- manual dispatch (`workflow_dispatch`)

It runs module tests before release/publish, then:

- verifies tag/version are new
- creates git tag + Gitea release notes/release
- publishes distribution tarball to PAUSE (with duplicate-release guard)

### Versioning

1. Update `$VERSION` in `lib/Google/GeoCoder/Smart.pm`.
2. Update `Changes`.
3. Merge to `master`.

If the workflow sees an existing tag or existing PAUSE release for that version,
it fails with an explicit error (no re-release/re-upload).

### Prompting for version

The workflow also supports manual `workflow_dispatch` and prompts for
`release_version`; it must match the module `$VERSION`.

### Required repository secrets

- `REGISTRY_USERNAME`
- `REGISTRY_TOKEN`
- `API_TOKEN_GITEA` (tag push + Gitea release creation)
- `PAUSE_USERNAME`
- `PAUSE_PASSWORD`

## License

See [LICENSE](./LICENSE).
