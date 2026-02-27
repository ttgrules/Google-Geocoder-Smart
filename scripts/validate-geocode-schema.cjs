const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const OPENAPI_SPEC_REF = process.env.GEOCODE_OPENAPI_REF || 'main';
const OPENAPI_SPEC_URL = `https://raw.githubusercontent.com/googlemaps/openapi-specification/${OPENAPI_SPEC_REF}/dist/google-maps-platform-openapi3.json`;

function mapOpenApiSchema(node) {
  if (Array.isArray(node)) {
    return node.map((item) => mapOpenApiSchema(item));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const mapped = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string' && value.startsWith('#/components/schemas/')) {
      mapped[key] = value.replace('#/components/schemas/', '#/definitions/');
      continue;
    }
    mapped[key] = mapOpenApiSchema(value);
  }

  if (mapped.nullable === true) {
    if (typeof mapped.type === 'string') {
      mapped.type = [mapped.type, 'null'];
    } else if (Array.isArray(mapped.type) && !mapped.type.includes('null')) {
      mapped.type = [...mapped.type, 'null'];
    }
    delete mapped.nullable;
  }

  return mapped;
}

async function fetchSpec(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch OpenAPI spec (${response.status} ${response.statusText})`);
  }
  return response.json();
}

async function main() {
  const outputPath = process.argv[2] || '/tmp/geocode-v3.schema.json';
  const outputAbsPath = path.resolve(outputPath);

  const spec = await fetchSpec(OPENAPI_SPEC_URL);
  const geocodeSchemaRef =
    spec.paths?.['/maps/api/geocode/json']?.get?.responses?.['200']?.content?.['application/json']?.schema
      ?.$ref;

  if (!geocodeSchemaRef || !geocodeSchemaRef.startsWith('#/components/schemas/')) {
    throw new Error('Could not locate geocode response schema ref in OpenAPI document');
  }

  const schemaName = geocodeSchemaRef.replace('#/components/schemas/', '');
  const geocodeSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `#/definitions/${schemaName}`,
    definitions: mapOpenApiSchema(spec.components?.schemas || {}),
  };

  fs.writeFileSync(outputAbsPath, `${JSON.stringify(geocodeSchema, null, 2)}\n`, 'utf8');
  console.log(`Generated schema at ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
