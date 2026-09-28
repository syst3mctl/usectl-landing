# Document 1: Privacy Policy

**Effective Date:** September 19, 2026 **Host &amp; Service Provider:** `usectl.com` ("Platform", "we", "us", or "our")

---

### 1\. Information We Collect

We collect and process the following categories of data to provide, secure, and operate the managed hosting platform:

* **Account &amp; Authentication Data:** Email addresses, password hashes, OAuth account links (e.g., GitHub, Google), and session credentials[1][2]. Upon authentication, we issue stateless 24-hour JWT access tokens and database-backed 90-day refresh tokens[3]. Refresh tokens are stored strictly as SHA-256 hashes[3].
* **Scoped Agent API Keys:** When you generate long-lived API keys (`usectl_agt_*`) for automation or AI agents, only an 8-character prefix and a SHA-256 hash of the key are stored in our databases[4]. The full key is displayed once upon creation and cannot be retrieved by platform administrators[4].
* **Application Telemetry &amp; Container Logs:** We collect container execution logs (via Loki), performance metrics (via Mimir), and request traces (via Tempo) to render application dashboards and trigger alert mechanisms[5]. All tenant telemetry is strictly isolated through a namespace-locked observability gateway[6][7].
* **AI Model Invocation Data:** If you utilize our AI Addons or Copilot capabilities, prompt metadata and token consumption counts are metered per project to enforce budget caps[8][9].

---

### 2\. Encryption &amp; Security Architecture

`usectl` implements rigorous technical and organizational controls to protect customer data:

* **Envelope Encryption at Rest:** Secrets and environment variables are encrypted using self-hosted AES-256-GCM envelope encryption with fresh random nonces drawn on every cryptographic operation[10].
* **Protected &amp; Masked Variables:** Secret values marked as "protected" return `"value": null` across all API endpoints and are permanently prohibited from being revealed via the web UI or REST API[11][12]. Non-secret variables are masked in viewer roles[13].
* **Tamper-Evident Audit Logging:** All secret operations generate hash-chained audit log records where appends are serialized via database locks[14]. Audit logs record metadata, key names, and actors—never raw secret values[14].
* **Universal Tenant Network Isolation:** Every tenant machine namespace (`kdeploy-<name>`)
* is protected by automated NetworkPolicies enforced at the kernel/routing layer[15][16]. Lateral cross-tenant network traffic between isolated namespaces is strictly blocked[17].
* **Container Runtime Sandboxing:** High-risk workloads, browser instances, and sandboxed AI agents execute under gVisor (`runsc` runtime class) to ensure strict kernel-level container isolation[18][19].
### 3\. Data Storage, Backups &amp; Retention

* **Managed Services:** Managed Postgres databases are backed up centrally via daily logical dumps[20].
* **Dedicated Database Services:** Dedicated PostgreSQL instances run scheduled dumps streaming to tenant-scoped object storage buckets[20]. Retention periods are set to 7 days for hourly backups and 30 days for daily backups[21].
* **Un-Snapshotted Stateful Addons:** Redis, MongoDB, NATS, and unmanaged S3 bucket contents do **not** have automated volume snapshots enabled by default[20]. Tenants are responsible for managing application-level data retention for these stateful services[20].
* **Container Images:** The internal Harbor registry enforces a retention policy keeping the 5 most recent image tags per repository, with automated garbage collection to reclaim storage[22].

---

### 4\. Third-Party Data Processors &amp; Edge Routing

* **Edge Infrastructure:** Web traffic to customer applications and admin interfaces routes through Cloudflare for Edge TLS termination and DDoS mitigation[23][24]. Container image pushes bypass Cloudflare and connect directly to private registry nodes[23].
* **Transactional Email:** Account lifecycle, billing alerts, and system notifications are dispatched via Google Workspace SMTP relays[25].
* **Payment Processing:** Payment details, billing management, and invoices are handled by Stripe[26].





# Document 2: Terms of Service &amp; Use

**Effective Date:** September 19, 2026 **Platform:** `usectl.com`

---

### 1\. Machine Quotas &amp; Resource Allocation

* **Machine Definition:** A "Machine" on `usectl` represents a Kubernetes namespace (`kdeploy-<name>`)
* paired with a defined resource quota allocation (vCPU, RAM, block storage) and subscription billing plan[27]. A machine holds no application code directly[27].
* **Pod Workloads:** Workloads ("Pods") execute within a Machine's resource envelope[27]. Pod deployments that exceed the Machine's vCPU or RAM quota preflight checks will be rejected until idle resources are cleared or the Machine plan is upgraded[28].
* **Storage Limits:** Persistent block storage allocations across all volumes in a single project are hard-capped at an absolute ceiling of 250 GB[29].

---

### 2\. High Availability, Local Storage &amp; Service SLA

* **Single-Node Local Storage:** Default volume claims use `local-path` storage bound directly to a single physical node disk via node affinity[30]. Single-pod stateful workloads bound to local disks will experience temporary downtime if the underlying host node becomes unavailable[30].
* **High Availability Addons:** High availability and failover protection require multi-instance deployments[31]. Dedicated PostgreSQL instances deploy as 2-instance CloudNativePG clusters (primary + streaming replica) with automated failover[31][32]. Dedicated NATS instances deploy as a 3-node RAFT cluster[31][33]; clients must explicitly configure streams with `Replicas: 3` to enable stream failover across broker losses[34].

---

### 3\. Billing, Grace Periods &amp; Machine Archiving

* **Billing Cycles:** Subscriptions are billed on a recurring basis via Stripe[26].
* **Lapsed Billing &amp; Grace Period:** If an invoice payment fails or a subscription lapses, the Machine enters a **7-day grace period**[35]. Warning notifications are sent 3 days prior to grace period expiration[35].
* **Automated Archiving:** Upon expiration of the 7-day grace period, all active workloads inside the Machine and its sibling group namespaces are automatically scaled to 0 replicas, and the Machine is marked as archived[35].
* **Deployment Suspension:** Deployments targeting archived Machines are rejected with an `HTTP 409 Conflict` status until billing is reinstated[35].

---

### 4\. Account Security &amp; Session Revocation

* **Refresh Token Rotation:** Access tokens expire after 24 hours[3]. Refreshing tokens consumes the active refresh token and issues a new token pair[36]. Presenting a previously consumed refresh token indicates potential credential compromise and will result in the immediate revocation of the entire token family session[36].
* **Acceptable Use:** Users are prohibited from attempting lateral network probes across tenant namespaces, bypassing NetworkPolicies, or launching unauthorized compute tasks on unprivileged build nodes[17][37]. Violations result in immediate account termination.