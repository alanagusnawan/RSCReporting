# RSC Enterprise Reporting Platform

Production enterprise reporting engine inspired by Telerik Reporting built with Next.js App Router, NestJS, TypeScript, Takumi PDF, PostgreSQL (Prisma), and MinIO.

## Monorepo Architecture

```
RSCReporting/
├── apps/
│   ├── api/                      # NestJS REST API, Prisma ORM, MinIO storage & PDF pipeline
│   └── web/                      # Next.js 15 visual designer, properties inspector & live viewer
├── packages/
│   ├── report-schema/            # Zod schemas & AST for reports, sections, components
│   ├── expression-engine/        # Safe non-eval expression language (Lexer, Parser, Evaluator)
│   ├── reporting-engine/         # Data binding, sorting, filtering, layout & pagination
│   └── takumi-renderer/          # Takumi PDF vector renderer & 5 pre-seeded production templates
├── goals/                        # Plannotator goal package & verified facts
├── turbo.json                    # Turborepo build orchestration
├── pnpm-workspace.yaml           # pnpm workspace config
└── .env.example                  # Environment template
```

## Production Templates Pre-Seeded
1. **Commercial Invoice** (`invoice-v1`)
2. **Payment Receipt** (`receipt-v1`)
3. **Delivery Note** (`delivery-note-v1`)
4. **Purchase Order** (`purchase-order-v1`)
5. **General Report** (`general-report-v1`)

## API Endpoints

- `POST /api/v1/pdf/generate`: Execute reporting pipeline with JSON data and template ID, rendering Takumi PDF and returning URL or binary.
- `GET /api/v1/pdf/files/:artifactId`: Stream authenticated PDF file.
- `GET /api/v1/pdf/files/:artifactId/download`: Download PDF attachment.
- `GET /api/v1/templates`: List available built-in and saved templates.
- `GET /api/v1/templates/:templateId`: Retrieve template definition.
- `POST /api/v1/files`: Upload reusable assets to MinIO with metadata in Postgres.
- `GET /api/v1/printers`: List registered printers.
- `GET /api/v1/pdf/print-jobs`: Track print dispatch jobs.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Run test suites across all packages
pnpm test

# 3. Build monorepo
pnpm build

# 4. Start NestJS API (port 5488)
pnpm --filter @rsc/api dev

# 5. Start Next.js Web Designer (port 3000)
pnpm --filter @rsc/web dev
```
