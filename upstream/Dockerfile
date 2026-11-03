FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git build-essential libssl-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/TelegramMessenger/MTProxy.git /src/MTProxy \
    && make -C /src/MTProxy

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl libssl3 zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data

COPY --from=build /src/MTProxy/objs/bin/mtproto-proxy /usr/local/bin/mtproto-proxy
COPY entrypoint.sh /usr/local/bin/mtproxy-entrypoint
RUN chmod 0755 /usr/local/bin/mtproxy-entrypoint

EXPOSE 443/tcp 8888/tcp
ENTRYPOINT ["/usr/local/bin/mtproxy-entrypoint"]
