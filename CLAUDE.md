# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The AFFiNE monorepo uses a custom CLI tool `affine` (via `yarn affine` or `yarn af`).

### Core Commands
- `yarn affine dev [package]` - Start development server for a specific package
  - Available packages: `@affine/web`, `@affine/server`, `@affine/electron`, `@affine/electron-renderer`, `@affine/mobile`, `@affine/ios`, `@affine/android`, `@affine/admin`
  - Example: `yarn affine dev @affine/web`
  - Add `--deps` to run with dependencies first
- `yarn affine build [package]` - Build a specific package (add `--deps` to build dependencies first)
- `yarn affine build` - Build all packages
- `yarn affine init` - Initialize workspace (generates TypeScript project references)
- `yarn affine clean` - Clean build artifacts (`--dist`, `--node-modules`, or `--all`)
- `yarn affine bundle` - Bundle packages
- `yarn affine cert` - Manage development certificates

### Running Package Scripts
- `yarn affine [package] [script]` - Run any script from a package's package.json
  - Example: `yarn affine web test` runs test script in @affine/web

## Environment Requirements
- **Node.js**: <23.0.0
- **Yarn**: 4.12.0 (see `packageManager` in root package.json)
  - Use `corepack enable && corepack prepare yarn@4.12.0 --activate` if wrong version
- **Build requires**: Rust toolchain (for native modules)

### Testing
- `yarn test` - Run Vitest tests
- `yarn test:ui` - Run tests with UI
- `yarn test:coverage` - Run tests with coverage
- `cd packages/backend/server && yarn test` - Run backend tests (using Ava)
- `cd tests/<e2e-test-suite>` - Run E2E tests in specific test suite

### Linting & Type Checking
- `yarn lint` - Run all linters (oxlint, eslint, prettier)
- `yarn lint:fix` - Auto-fix linting issues
- `yarn typecheck` - Run TypeScript type checking

### Database
- `cd packages/backend/server && yarn prisma migrate dev` - Run database migrations
- `cd packages/backend/server && yarn prisma migrate deploy` - Deploy migrations
- `cd packages/backend/server && yarn data-migration run` - Run data migrations

## Deployment (Self-Hosted)

This repository includes self-hosted deployment configuration in `deployment/` directory.

### Docker Deployment

**Build Docker Image:**
```bash
# Build all frontends and server
BUILD_TYPE=stable yarn affine @affine/web build
BUILD_TYPE=stable yarn affine @affine/admin build
yarn workspace @affine/server build

# Build production image
docker build -f .github/deployment/node/Dockerfile -t affine:self-hosted .
```

**Deployment Configuration:**
- `.env` - Database and basic configuration
- `config.json` - Storage provider configuration (S3/DigitalOcean Spaces/Google Drive)
- `docker-compose.yml` - Service orchestration

**Storage Providers:**
- `fs` - Local filesystem storage
- `s3` - AWS S3 or S3-compatible (DigitalOcean Spaces, MinIO, etc.)
- `r2` - Cloudflare R2
- `gdrive` - Google Drive

**Storage Config Structure** (`deployment/config.json`):
```json
{
  "storages": {
    "blob.storage": {
      "provider": "aws-s3",
      "bucket": "bucket-name",
      "config": {
        "endpoint": "https://region.digitaloceanspaces.com",
        "region": "sgp1",
        "forcePathStyle": true,
        "credentials": { "accessKeyId": "...", "secretAccessKey": "..." }
      }
    },
    "avatar.storage": { ... }
  }
}
```

**Deploy to Server:**
```bash
# From deployment directory
docker-compose up -d --force-recreate affine
```

**Server Deployment Locations:**
- Source: `/var/www/docker/workspace_coursesme_com/affine-src`
- Config: `/var/www/docker/workspace_coursesme_com/.affine/config.json`
- Storage: `/var/www/docker/workspace_coursesme_com/data/storage` (fallback, use S3 for production)
- Compose: `/var/www/docker/workspace_coursesme_com/docker-compose.yml`

## Module Resolution and Package Exports
AFFiNE uses standard package.json `exports` field for module resolution. The `@affine/core` package has a special path mapping in tsconfig.json: `@affine/core/*` maps to `./packages/frontend/core/src/*`.

## Architecture Overview

### Monorepo Structure
This is a Yarn workspaces monorepo with three main areas:

1. **`blocksuite/`** - Block-based editor framework
   - `affine/` - AFFiNE-specific blocks (paragraph, list, database, image, etc.)
   - `framework/` - Vanilla framework packages (global, std, store, sync)
   - `integration-test/` - BlockSuite integration tests
   - `playground/` - Development playground

2. **`packages/backend/`** - Backend services
   - `server/` - NestJS GraphQL server (PostgreSQL + Prisma)
   - `native/` - Rust native bindings (image processing, LLM utilities, doc loading)

3. **`packages/frontend/`** - Frontend applications
   - `core/` - Main application core (React + BlockSuite)
   - `apps/web/` - Web application
   - `apps/electron/` - Desktop application (main process)
   - `apps/electron-renderer/` - Desktop application (renderer)
   - `apps/mobile/` / `apps/android/` / `apps/android/` - Mobile applications
   - `component/` - Shared UI components
   - `i18n/` - Internationalization
   - `admin/` - Admin panel for server configuration

4. **`packages/common/`** - Shared packages
   - `graphql/` - GraphQL schema and types
   - `nbstore/` - Y.js-based storage and sync layer
   - `infra/` - Infrastructure utilities (storage, atoms, operators)
   - `s3-compat/` - S3-compatible storage abstraction

### Key Architectural Patterns

**BlockSuite Editor**: The editor is built on a block-based architecture where each content type (paragraph, list, database, etc.) is a separate block package. Blocks use Y.js for CRDT sync and Lit for web components.

**Storage & Sync**:
- `nbstore` provides the storage abstraction over IndexedDB (browser), SQLite (electron/mobile), and cloud sync
- Y.js enables real-time collaborative editing
- Snapshots + Updates pattern for server-side document persistence
- Storage providers in `packages/backend/server/src/base/storage/providers/`

**Backend**: NestJS-based with:
- GraphQL API (`schema.gql` defines the schema)
- Prisma ORM with PostgreSQL
- WebSocket support via Socket.IO
- Rust native modules for performance-critical operations
- Job queue for background tasks (doc processing, summaries)

**AI Integration**: Multi-model AI support with:
- Google AI / Vertex AI
- Custom prompts and sessions
- Vector embeddings (pgvector) for semantic search
- File processing and transcription

**Admin Panel**: (`packages/frontend/admin/`)
- Server configuration interface
- Storage provider configuration (S3, R2, GDrive)
- AI prompts management
- User and workspace management

### TypeScript Project References
The root `tsconfig.json` uses project references. Run `yarn affine init` after adding new packages to regenerate references. Each package has its own `tsconfig.json`.

### Testing Strategy
- Unit tests: Vitest for frontend/packages, Ava for backend
- E2E tests: Located in `tests/` directory (affine-local, affine-cloud, affine-desktop, etc.)
- Integration tests: BlockSuite has its own integration test suite

### Important Files
- `tools/cli/src/affine.ts` - CLI tool entry point
- `tsconfig.json` - Root TypeScript config with project references
- `vitest.config.ts` - Vitest configuration
- `packages/backend/server/schema.prisma` - Database schema
- `packages/backend/server/src/schema.gql` - GraphQL schema
- `.yarnrc.yml` - Yarn configuration
- `.github/deployment/node/Dockerfile` - Production Docker image
- `deployment/docker-compose.yml` - Self-hosted deployment

### Development Workflow
1. New packages should be added to appropriate workspace directory
2. Run `yarn affine init` to regenerate TypeScript project references
3. Use workspace protocol (`workspace:*`) for internal dependencies in `package.json`
4. Tests should be co-located with source code as `*.spec.ts` files
