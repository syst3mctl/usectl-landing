# Deploy with usectl

Deploy applications to [usectl](https://usectl.com) — a managed PaaS with
GitHub integration, PostgreSQL, and S3-compatible storage.

## Prerequisites

- A usectl account ([register](https://manager.usectl.com/register))
- The `usectl` CLI installed (`curl -fsSL https://get.usectl.com | sh`)
- A GitHub repository with a Dockerfile

## Quick Start

```bash
# Authenticate
usectl auth login

# Create a project with database and storage
usectl projects create \
  --repo github.com/you/your-app \
  --database \
  --storage

# Deploy
usectl deploy --project your-app
```

## What Gets Provisioned

| Resource            | Details                                    |
|---------------------|--------------------------------------------|
| Container runtime   | Kubernetes namespace with isolated compute  |
| PostgreSQL          | Managed by CloudNativePG, credentials auto-injected |
| S3 storage          | MinIO bucket with access keys              |
| Domain + TLS        | Automatic HTTPS via Traefik                |
| CI/CD               | Push-to-deploy from GitHub                 |

## API

The usectl API is available at `https://manager.usectl.com/api`.

### Authentication

```
POST /api/auth/login
Content-Type: application/json

{"email": "you@example.com", "password": "..."}
```

Returns a JWT Bearer token for subsequent API calls.

### Key Endpoints

- `POST /api/projects` — Create a new project
- `GET /api/projects` — List projects
- `POST /api/projects/{id}/deploy` — Trigger deployment
- `GET /api/projects/{id}/logs` — Stream build/runtime logs

## MCP Integration

usectl exposes an MCP server for AI agents at:

```
SSE endpoint: https://manager.usectl.com/api/mcp/sse?token=YOUR_JWT
```

Available tools: `list_projects`, `get_logs`

## Documentation

Full documentation: https://docs.usectl.com
