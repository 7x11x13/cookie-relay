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

- Replace `<YOUR TAILNET NAME>` with your Tailnet name (see the [docs](https://github.com/hollie/tailscale-caddy-proxy?tab=readme-ov-file#parameters-and-storage)).
- Replace `<RANDOM API KEY>` with a random string of characters. This is the API key you will set the browser extension to use.

```yaml
name: cookie-relay
networks:
  tailscale_proxy:
    external: false

volumes:
  tailscale-whoami-state:
  redis_data:

services:
  proxy:
    image: hollie/tailscale-caddy-proxy:latest
    volumes:
      - tailscale-whoami-state:/var/lib/tailscale
    depends_on:
      - server
    restart: always
    init: true
    environment:
      - TS_HOSTNAME=cookie-relay
      - TS_TAILNET=<YOUR TAILNET NAME>
      - CADDY_TARGET=server:80
    networks:
      - tailscale_proxy
  redis:
    image: redis/redis-stack:latest
    restart: always
    environment:
      - REDIS_ARGS=--appendonly yes --save 60 1
    networks:
      - tailscale_proxy
    volumes:
      - redis_data:/data
  server:
    image: ghcr.io/7x11x13/cookie-relay-server:latest
    restart: always
    environment:
      - ENV=PRODUCTION
      - REDIS_URL=redis://redis:6379
      - APIKEY=<RANDOM API KEY>
    depends_on:
      - redis
    networks:
      - tailscale_proxy
```
