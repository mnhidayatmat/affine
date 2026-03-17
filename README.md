# AFFiNE Self-Hosted Deployment

This directory contains the deployment configuration for AFFiNE self-hosted instance.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (external or dockerized)
- Redis server
- DigitalOcean Spaces or S3-compatible storage (optional)

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   - Set your database credentials
   - Configure storage paths if needed

3. Create the storage configuration for DigitalOcean Spaces:
   ```bash
   mkdir -p ~/.affine
   cp config.example ~/.affine/config
   # Edit ~/.affine/config with your DO Spaces credentials
   ```

4. Start the services:
   ```bash
   docker-compose up -d
   ```

## Services

- **AFFiNE**: http://localhost:3010
- **PostgreSQL**: Port 5432 (external)
- **Redis**: Local container

## Storage Configuration

The storage configuration supports:
- **Avatar Storage**: CDN-backed avatar storage
- **Blob Storage**: File and attachment storage

See `config.example` for DigitalOcean Spaces configuration.

## Maintenance

### View Logs
```bash
docker-compose logs -f affine
```

### Restart Services
```bash
docker-compose restart
```

### Update AFFiNE
```bash
docker-compose pull
docker-compose up -d
```

### Database Migrations
Migrations run automatically on startup.

## License

MIT

---

## Self-Hosted Deployment

Deployment configuration files are located in the `deployment/` directory.

### Quick Start

1. Copy the example environment file:
   ```bash
   cp deployment/.env.example deployment/.env
   ```

2. Edit `deployment/.env` with your configuration:
   - Database credentials
   - Storage paths
   - Port configuration

3. Create storage configuration for DigitalOcean Spaces:
   ```bash
   mkdir -p deployment/.affine
   cp deployment/config.example deployment/.affine/config
   # Edit deployment/.affine/config with your DO Spaces credentials
   ```

4. Start the services:
   ```bash
   cd deployment
   docker-compose up -d
   ```

### Services

- **AFFiNE**: http://localhost:3010
- **PostgreSQL**: External or dockerized
- **Redis**: Local container

### Storage Configuration

Supports DigitalOcean Spaces or S3-compatible storage for:
- Avatar storage with CDN
- Blob storage for files and attachments

See `deployment/config.example` for configuration details.

### Maintenance

- **View logs**: `docker-compose logs -f affine`
- **Restart**: `docker-compose restart`
- **Update**: `docker-compose pull && docker-compose up -d`
