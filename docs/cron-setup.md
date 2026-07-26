# Configuring Cron Jobs in Docker for Okgo POS

Okgo POS requires scheduled jobs to handle automated accounting processes, such as recognizing revenue for expired vouchers (Voucher Breakage Revenue). 

Instead of running a heavy Node.js background worker, Okgo POS exposes secure API routes that can be triggered by a standard cron scheduler.

## 1. Environment Variable Setup

Ensure that your Okgo POS environment (e.g. your `.env` file) has a `CRON_SECRET` defined. This prevents unauthorized users from triggering your cron endpoints.

```env
# .env
CRON_SECRET=super-secret-cron-key-123
```

## 2. Docker Compose Configuration

The easiest way to schedule these jobs in a Docker environment is to add a tiny Alpine-based container to your `docker-compose.yml` that uses `crond` to ping your API routes.

Below is an example of how you can add a `cron` service to your existing Docker Compose setup:

```yaml
version: '3.8'

services:
  # Your existing Okgo POS app container
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    # ...

  # New lightweight cron container
  cron:
    image: alpine:latest
    restart: unless-stopped
    depends_on:
      - app
    # Add curl to the alpine image and start the cron daemon in the foreground
    command: >
      /bin/sh -c "apk add --no-cache curl &&
      echo '0 0 * * * curl -sS -X GET \"http://app:3000/api/cron/expire-vouchers?secret=${CRON_SECRET}\" >> /var/log/cron.log 2>&1' > /etc/crontabs/root &&
      crond -f -d 8"
    environment:
      - CRON_SECRET=${CRON_SECRET:-super-secret-cron-key-123}
```

### Explanation of the Cron Command:
- `apk add --no-cache curl`: Installs `curl` into the lightweight Alpine container.
- `echo '0 0 * * * ...' > /etc/crontabs/root`: Sets up a cron schedule to run **every day at midnight** (`0 0 * * *`).
- `http://app:3000/api/cron/expire-vouchers?secret=${CRON_SECRET}`: Hits the internal Next.js app container (named `app` in docker-compose). Note that it goes through Docker's internal network, so you don't need to expose it to the public internet.
- `crond -f -d 8`: Starts the cron daemon in the foreground so the Docker container stays running.

## 3. Testing the Endpoint Manually

You can test if the endpoint is working by running this curl command from your host machine (assuming port 3000 is exposed to localhost):

```bash
curl -X GET "http://localhost:3000/api/cron/expire-vouchers?secret=super-secret-cron-key-123"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Processed 3 expired vouchers.",
  "recognizedValue": 60000
}
```
