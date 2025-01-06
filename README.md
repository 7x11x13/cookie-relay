# cookie-relay

This is a browser extension and server which I use to store and distribute up-to-date login cookies necessary for some of my projects.
Currently supports retrieving cookies and user IDs from YouTube, Bandcamp, and SoundCloud.

## Setup

1. Download the extension [here](https://github.com/7x11x13/cookie-relay/releases) and install it in your browser(s). Since the extension is unsigned (for now) you must follow some extra steps:
    1. For Firefox, you must be running Firefox Developer Edition or Nightly and set `xpinstall.signatures.required` to `false`.
    2. For Chrome, you must go to `chrome://extensions` and enable Developer mode.
2. Run the cookie-relay server so that it is accessible from your browser(s) which you installed the extension in. It must be accessible via HTTPS. See the example docker-compose file below for how I do this with Tailscale.
3. Configure the browser extension settings so that the API url points to the cookie-relay server, and the API key matches the API key used by the server.

## Example `docker-compose.yaml` for cookie-relay-server using Tailscale

See this guide: https://tailscale.com/blog/docker-tailscale-guide

- Replace `<RANDOM API KEY>` with a random string of characters. This is the API key you will set the browser extension to use.

```yaml
name: cookie-relay

volumes:
  tailscale-data-proxy:
  redis_data:

services:
  ts-proxy:
    image: tailscale/tailscale:latest
    hostname: cookie-relay
    environment:
      - TS_AUTHKEY=tskey-client-secretkeysdfsdfsdfds?ephemeral=false
      - TS_EXTRA_ARGS=--advertise-tags=tag:container
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_SERVE_CONFIG=/config/cookie-relay.json
    volumes:
      - tailscale-data-proxy:/var/lib/tailscale
      - ./cookie-relay/config:/config
    devices:
      - /dev/net/tun:/dev/net/tun
    cap_add:
      - net_admin
      - sys_module
    restart: unless-stopped
  redis:
    image: redis/redis-stack:latest
    restart: unless-stopped
    environment:
      - REDIS_ARGS=--appendonly yes --save 60 1
    volumes:
      - redis_data:/data
  server:
    image: ghcr.io/7x11x13/cookie-relay-server:latest
    restart: unless-stopped
    network_mode: service:ts-proxy
    environment:
      - ENV=PRODUCTION
      - REDIS_URL=redis://redis:6379
      - APIKEY=<RANDOM API KEY>
    depends_on:
      - redis
      - ts-proxy
```
`cookie-relay.json`:
```json
{
    "TCP": {
        "443": {
            "HTTPS": true
        }
    },
    "Web": {
        "${TS_CERT_DOMAIN}:443": {
            "Handlers": {
                "/": {
                    "Proxy": "http://127.0.0.1:80"
                }
            }
        }
    },
    "AllowFunnel": {
        "${TS_CERT_DOMAIN}:443": false
    }
}
```
