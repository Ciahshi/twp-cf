#!/bin/sh
set -eu

: "${UPSTREAM_MTPROXY_SECRET:?Set UPSTREAM_MTPROXY_SECRET in .env.upstream}"
: "${SPONSOR_PROXY_TAG:?Set SPONSOR_PROXY_TAG in .env.upstream}"

if [ "${#UPSTREAM_MTPROXY_SECRET}" -ne 32 ]; then
  echo "UPSTREAM_MTPROXY_SECRET must be exactly 32 hex characters" >&2
  exit 1
fi
case "$UPSTREAM_MTPROXY_SECRET" in
  *[!0-9a-fA-F]*)
    echo "UPSTREAM_MTPROXY_SECRET must contain only hexadecimal characters" >&2
    exit 1
    ;;
esac

if [ "${#SPONSOR_PROXY_TAG}" -ne 32 ]; then
  echo "SPONSOR_PROXY_TAG must be exactly 32 hex characters" >&2
  exit 1
fi
case "$SPONSOR_PROXY_TAG" in
  *[!0-9a-fA-F]*)
    echo "SPONSOR_PROXY_TAG must contain only hexadecimal characters" >&2
    exit 1
    ;;
esac

mkdir -p /data
curl --fail --silent --show-error --location --retry 3 \
  https://core.telegram.org/getProxySecret -o /data/proxy-secret
curl --fail --silent --show-error --location --retry 3 \
  https://core.telegram.org/getProxyConfig -o /data/proxy-multi.conf
chmod 0644 /data/proxy-secret /data/proxy-multi.conf

exec /usr/local/bin/mtproto-proxy \
  -u nobody \
  -p 8888 \
  -H 443 \
  -S "$UPSTREAM_MTPROXY_SECRET" \
  -P "$SPONSOR_PROXY_TAG" \
  --aes-pwd /data/proxy-secret \
  /data/proxy-multi.conf \
  -M 1
