# Deploy with usectl

Deploy full-stack applications to [usectl](https://usectl.com), a flat-priced managed deployment platform. One flat monthly bill covers a configured project (vCPU + RAM + storage) with managed PostgreSQL, S3-compatible object storage, Redis, Mongo, SQL Server, NATS, Meilisearch, cron jobs, PR previews, custom domains, and unlimited team seats. No bandwidth metering. No per-build charges. No seat pricing.

## Pricing

Transparent linear formula:

- **vCPU:** $10 per vCPU per month
- **RAM:** $5 per GB RAM per month
- **Object storage:** $0.01 per GB per month

**Worked examples:**

- 1 vCPU / 2 GB RAM / 10 GB storage: **$20.10/month**
- 2 vCPU / 4 GB RAM / 50 GB storage: **$40.50/month**
- 4 vCPU / 8 GB RAM / 200 GB storage: **$82/month**
- 8 vCPU / 16 GB RAM / 500 GB storage: **$165/month**

**Trial:** First project free for 30 days on any configuration up to 4 vCPU / 8 GB RAM. No credit card required.

## Prerequisites

- A usectl account ([register](https://manager.usectl.com/register))
- The `usectl` CLI installed
- A GitHub repository (Dockerfile optional; usectl auto-detects Next.js, Node, Python, and static sites)

## Quick Start

```bash
# Install the CLI
curl -fsSL https://usectl.com/install.sh | bash

# Authenticate
usectl auth login

# Create a configured project
usectl projects create \
  --repo github.com/you/your-app \
  --vcpu 2 --ram 4 --storage 50 \
  --postgres --redis

# Deploy
usectl deploy --project your-app

# Tail logs
usectl logs --follow --project your-app

# Rollback to a previous deploy
usectl rollback --project your-app --to v3
```

## What Gets Provisioned

| Resource | Details |
|---|---|
| Container runtime | K3s Kubernetes namespace with isolated compute, built with Kaniko (no Docker daemon) |
| Managed PostgreSQL | CloudNativePG operator, automatic backups, point-in-time recovery, credentials auto-injected as `$DATABASE_URL` |
| S3-compatible storage | SeaweedFS bucket with credentials auto-injected as `$S3_ENDPOINT`, `$S3_ACCESS_KEY`, `$S3_SECRET_KEY`, `$S3_BUCKET`, `$AWS_ENDPOINT_URL` |
| Redis | Per-project Redis instance, `$REDIS_URL` auto-injected |
| Additional addons | Mongo, SQL Server, NATS, Meilisearch, cron jobs, OAuth2 Proxy, Grafana, all toggle-on, all included |
| Custom domain + TLS | Traefik + Let's Encrypt with automatic certificate renewal |
| CI/CD | Push-to-deploy from GitHub, PR previews auto-torn-down on merge |
| Rollback | One-click rollback to any of the last 5 successful deploys |
| Team seats | Unlimited, never per-seat billing |
| Bandwidth | Unmetered; soft caps scale with compute size, never per-GB charges |

All addons run inside the project's configured compute budget. No separate bills for databases, caches, storage egress, or builds.

## CLI Command Reference

| Command | Purpose |
|---|---|
| `usectl auth login` | Authenticate |
| `usectl projects list` | List projects |
| `usectl projects create --repo <url> --vcpu <n> --ram <gb> --storage <gb> [--postgres] [--redis] [--mongo] [--meilisearch]` | Create and configure a project |
| `usectl projects deploy <project>` | Trigger a deploy |
| `usectl projects logs <project> [--follow]` | View logs |
| `usectl projects status <project>` | Check status |
| `usectl projects rollback <project> --to <version>` | Rollback |
| `usectl projects resize <project> --vcpu <n> --ram <gb> --storage <gb>` | Resize compute |
| `usectl domains add --project <project> --domain <fqdn>` | Attach a custom domain |
| `usectl env set <project> KEY=VALUE` | Set an environment variable |

All commands support `--json` for structured output, making them scriptable and agent-friendly.

## API

The usectl API base URL is `https://manager.usectl.com/api`. OpenAPI spec at `https://docs.usectl.com/openapi.yaml`.

### Authentication

```
POST /api/auth/login
Content-Type: application/json

{"email": "you@example.com", "password": "..."}
```

Returns a JWT Bearer token for subsequent requests. OAuth discovery at `https://usectl.com/.well-known/oauth-authorization-server`.

### Key Endpoints

- `POST /api/projects`: Create a new configured project
- `GET /api/projects`: List projects
- `POST /api/projects/{id}/deploy`: Trigger deployment
- `GET /api/projects/{id}/logs`: Stream build and runtime logs
- `POST /api/projects/{id}/rollback`: Rollback to a previous deploy
- `POST /api/projects/{id}/resize`: Resize compute dimensions

## MCP Integration

usectl exposes an MCP server for AI agents at:

```
SSE endpoint: https://manager.usectl.com/api/mcp/sse?token=YOUR_JWT
```

Available tools include `list_projects`, `get_project`, `create_project`, `deploy_project`, `get_logs`, `rollback`, `resize_project`, and addon management.

The CLI alone covers most agent workflows; MCP is available for tighter integration with Claude Code and Cursor.

## Who usectl is for

- AI-assisted software engineers working in Cursor, Claude Code, Windsurf, or ChatGPT
- Solo founders shipping production SaaS
- Small engineering teams that want flat, predictable hosting bills

## Who usectl is not for

- Projects requiring a US region or sub-80ms global latency today (EU-only in Q2 2026, US region on roadmap)
- Teams requiring SAML SSO, SOC 2 Type II, or HIPAA today (on roadmap)
- Pure static sites with massive global anonymous traffic (use Cloudflare Pages or Vercel)

## Documentation

Full documentation: https://docs.usectl.com
