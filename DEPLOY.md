<div align="center">
  <img src="public/icon.png" alt="Stellaire" width="64" height="64">
  <h1>Deployment Guide</h1>
  <p>Self-host Stellaire on your own server</p>
</div>

---

## Prerequisites

- A Linux server (Raspberry Pi, NAS, VPS, or any machine)
- Docker and Docker Compose installed
- Git installed
- Your user must be in the `docker` group:

```bash
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect.

## Quick Start

```bash
git clone https://github.com/Teyk0o/stellaire.git
cd stellaire
mkdir -p data content
sudo chown -R 1001:1001 data content
docker compose up -d --build
```

Stellaire is now running at `http://your-server-ip:3000`.

## Directory Structure

After the first run, two directories are created:

```
stellaire/
  data/           # SQLite database, encryption key (auto-generated)
  content/        # Your course files (Markdown)
```

Both are mounted as Docker volumes and persist across container restarts.

## Adding Courses

Place your Markdown course files in the `content/` directory:

```
content/
  phase-1/
    math/
      01-operations.md
      02-fractions.md
    physics/
      01-units.md
  phase-2/
    ...
```

After adding or modifying courses, rebuild the container:

```bash
docker compose up -d --build
```

## Updating

```bash
git pull origin main
docker compose up -d --build
```

Data and courses are preserved across updates.

## Custom Port

By default, Stellaire runs on port 3000. If the port is already in use, set a custom port:

```bash
STELLAIRE_PORT=8080 docker compose up -d --build
```

## Backups

Back up the `data/` directory regularly. It contains:

- `stellaire.db` -- all user profiles, progress, exam results, and reports
- `.stellaire.key` -- the AES-256 encryption key for personal data

Without the key file, encrypted personal data cannot be recovered.

```bash
# Example backup
tar -czf stellaire-backup-$(date +%Y%m%d).tar.gz data/
```

## Exposing to the Internet (HTTPS)

> **Important:** If you want the report verification feature to work for third parties (e.g. a school scanning the QR code on your report), your instance must be accessible from outside your local network.

### Step 1: Find your public IP

Your public IP is the address your ISP assigns to your router. Find it by running on any machine in your network:

```bash
curl -s https://api.ipify.org
```

Or visit [whatismyip.com](https://whatismyip.com) from any device on the same network.

> **Note:** Most residential ISPs assign dynamic IPs that change periodically. If you need a stable IP, check if your ISP offers a static IP option, or use a dynamic DNS service like [DuckDNS](https://www.duckdns.org) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).

### Step 2: Port forwarding

Log into your router admin panel (usually `http://192.168.1.1`) and forward:

| External Port | Internal IP | Internal Port | Protocol |
|---------------|-------------|---------------|----------|
| 80 | 192.168.1.20 | 80 | TCP |
| 443 | 192.168.1.20 | 443 | TCP |

Replace `192.168.1.20` with your server's local IP. The steps vary by router brand -- search for your model + "port forwarding" if needed.

### Step 3: DNS

At your domain registrar (OVH, Cloudflare, Namecheap, etc.), create an A record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | stellaire | your public IP | 3600 |

This makes `stellaire.yourdomain.com` point to your server.

### Step 4: Firewall (UFW)

If you use UFW, open ports 80 and 443:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Verify with `sudo ufw status`.

### Step 5: Install Nginx and Certbot

On your server:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/stellaire
```

Paste (replace `stellaire.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name stellaire.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If you run Stellaire on a custom port (e.g. 3001), change `proxy_pass` accordingly.

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/stellaire /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

At this point, `http://stellaire.yourdomain.com` should work.

### Step 7: Enable HTTPS

```bash
sudo certbot --nginx -d stellaire.yourdomain.com
```

Certbot will automatically obtain a Let's Encrypt certificate and modify your Nginx config for SSL. It also sets up auto-renewal.

Your instance is now available at `https://stellaire.yourdomain.com`.

### Report verification

Once your instance is public, the QR code on generated reports will link to `https://stellaire.yourdomain.com/rapport/verify/<hash>`. Anyone can scan it to verify the report's authenticity against the live database.

### What verification proves

- The report was generated by an unmodified Stellaire instance
- The progress data matches the snapshot taken at generation time
- The source code is [publicly auditable](https://github.com/Teyk0o/stellaire)

It does not prove that exercises were completed by a specific person (no biometric verification). It proves that the data is internally consistent and has not been manually edited.

### Option B: Show it live

If you cannot expose the server publicly, open the verification page directly on your device and show it to the verifier in person.

## Security Notes

- Personal data (name, email, date of birth, address) is encrypted at rest with AES-256-GCM
- The encryption key is auto-generated on first run and stored in `data/.stellaire.key`
- There is no authentication system -- Stellaire is designed for trusted LAN environments
- If you expose the server publicly, add authentication via your reverse proxy (e.g. Authelia, HTTP basic auth)

## Troubleshooting

**Container fails to start:**
```bash
docker compose logs stellaire
```

**Database locked errors:**
Ensure only one container instance is running:
```bash
docker compose down && docker compose up -d
```

**Courses not appearing:**
Check that files are in the correct directory structure (`content/phase-{n}/{subject}/*.md`) and have valid YAML frontmatter.
