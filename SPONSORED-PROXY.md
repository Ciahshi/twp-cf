# Sponsored-channel upstream for TWP-CF

TWP-CF is a Cloudflare Worker Web Proxy, not a raw TCP MTProxy listener. Telegram's promoted-channel metadata is carried by the official MTProxy frontend when it forwards requests to Telegram's Middle Proxy network. The Worker therefore re-keys the client MTProto transport and sends it to an official MTProxy process.

## Required values

- Public/client secret: existing Worker PROXY_SECRET (unchanged).
- Upstream secret: a separate random 32-hex secret, stored in Cloudflare as UPSTREAM_MTPROXY_SECRET.
- Upstream host/port: the public host and TCP listener port of your official MTProxy server.
- Promotion tag: c22830b06c489dc584791d4637891a32, registered with @MTProxyBot for @CiaConfig.

Generate the upstream secret on the server:

```sh
openssl rand -hex 16
```

Download Telegram's Middle Proxy configuration and shared secret:

```sh
curl -fsSL https://core.telegram.org/getProxySecret -o proxy-secret
curl -fsSL https://core.telegram.org/getProxyConfig -o proxy-multi.conf
```

Build the official server:

```sh
git clone https://github.com/TelegramMessenger/MTProxy.git
cd MTProxy
make
```

Run it with the private upstream secret and registered promotion tag:

```sh
./objs/bin/mtproto-proxy -u nobody -p 8888 -H 443 \\
  -S <UPSTREAM_MTPROXY_SECRET> \\
  -P c22830b06c489dc584791d4637891a32 \\
  --aes-pwd proxy-secret proxy-multi.conf -M 1
```

Here -H 443 is the MTProxy client TCP listener; -p 8888 is the local statistics port. Restrict the statistics port to loopback.

In Cloudflare Worker settings, configure:

- UPSTREAM_MTPROXY_HOST: public IPv4 address or DNS name of the server.
- UPSTREAM_MTPROXY_PORT: 443 (or the listener port selected above).
- SPONSOR_PROXY_TAG: the exact tag above.
- UPSTREAM_MTPROXY_SECRET: the same 32-hex secret passed to the upstream server's -S argument. Store it as a Worker secret, not a plain variable.

Then deploy the Worker. GET /healthz reports relay: upstream-mtproxy when configured.

Do not run MTProxy with direct-to-DC mode: that mode is incompatible with promotion tags. The backend server must use the official Middle Proxy configuration (proxy-secret and proxy-multi.conf).
