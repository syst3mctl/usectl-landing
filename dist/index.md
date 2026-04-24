# usectl

> One flat price. No bandwidth bills.

usectl is a managed deployment platform. You configure a server on a slider (vCPU, RAM, storage), and we spin up a managed project with your full stack inside: app, database, cache, workers, PR previews. Everything runs on a flat monthly bill.

We run on our own bare metal at Hetzner, not on AWS or Google Cloud. That's why the pricing stays flat, and the only surprises are features we add for free.

## Pricing

The bill is computed from a transparent formula:

- **vCPU**: $10 per vCPU per month
- **RAM**: $5 per GB RAM per month
- **Object storage**: $0.01 per GB per month

Example configurations:

- 1 vCPU / 2 GB / 10 GB = **$20.10/month**
- 2 vCPU / 4 GB / 50 GB = **$40.50/month**
- 4 vCPU / 8 GB / 200 GB = **$82/month**
- 8 vCPU / 16 GB / 500 GB = **$165/month**

### What's included in every project

- Managed PostgreSQL with automatic backups and point-in-time recovery
- S3-compatible object storage (SeaweedFS)
- Redis, Mongo, SQL Server, NATS, Meilisearch
- Cron jobs, OAuth2 Proxy, Grafana
- PR preview environments (auto-torn-down on merge)
- Custom domains with automatic TLS
- Unlimited team seats (never per-seat billing)
- Unmetered bandwidth with soft caps (never billed per GB)
- Unmetered builds
- Push-to-deploy from GitHub
- One-click rollback to any previous deploy
- CLI, web dashboard, and MCP server

### Trial

First project free for 30 days on any configuration up to 4 vCPU / 8 GB RAM. No credit card required.

### Enterprise

Configurations above 16 vCPU / 64 GB RAM / 500 GB storage, dedicated hardware, SLAs, or compliance add-ons are available as custom deals. Contact support@usectl.com.

## How to deploy

The CLI is the primary interface. Every capability is a single-binary command with structured `--json` output, so any AI coding agent (Claude Code, Cursor, Windsurf, ChatGPT) can drive the platform by running commands.

```bash
# Install
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

# Rollback
usectl rollback --project your-app --to v3
```

The MCP server is available too for tighter integration (`https://manager.usectl.com/api/mcp/sse`), but the CLI alone is usually enough.

## Substrate

- **Kubernetes**: K3s HA cluster
- **Image builds**: Kaniko, daemonless, in-cluster
- **Managed PostgreSQL**: CloudNativePG operator
- **Object storage**: SeaweedFS, S3-compatible (migrated from MinIO for better multi-tenant performance)
- **Ingress and TLS**: Traefik with Let's Encrypt
- **Hardware**: Hetzner bare metal, owned by us, not rented from a hyperscaler

## Who usectl is for

- AI-assisted software engineers who ship inside Cursor, Claude Code, Windsurf, or ChatGPT
- Solo founders building production SaaS products
- Small teams that want the simplicity of a managed PaaS without metered pricing surprises
- Side-project engineers who don't want to think about their bill

## Who usectl is not for

- Vibecoders who have never used a CLI (Lovable, Replit, and v0 fit better)
- Teams that need dedicated enterprise features today (SAML SSO, SOC 2 Type II, HIPAA) — on the roadmap, not available in Q2 2026
- Latency-critical global workloads that need sub-80ms response from every continent
- Teams that want the full AWS service catalog

## Company

Built by systemctl LTD in Tbilisi, Georgia. Bootstrapped, profitable, revenue-positive. 100+ paying customers as of spring 2026.

## Links

- Website: https://usectl.com
- Documentation: https://docs.usectl.com
- Sign up: https://manager.usectl.com/register
- GitHub: https://github.com/syst3mctl
- X/Twitter: https://x.com/usectlcloud
- Support: support@usectl.com
