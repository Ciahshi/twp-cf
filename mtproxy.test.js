import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { acceptClientHandshake, createProxyHandshake, parseProxySecret } from "./mtproxy.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

test("upstream handshake re-keys both MTProto transport directions", async () => {
  const publicSecret = parseProxySecret("ed0964f9ddbf541d778cf09b169acd36").inner;
  const upstreamSecret = parseProxySecret("a1b2c3d4e5f60718293a4b5c6d7e8f90").inner;
  const tag = 0xefefefef;
  const dcId = 2;

  const userClient = await createProxyHandshake(publicSecret, tag, dcId);
  const workerInbound = await acceptClientHandshake(userClient.wire, publicSecret);

  const workerUpstream = await createProxyHandshake(upstreamSecret, tag, dcId);
  const upstreamServer = await acceptClientHandshake(workerUpstream.wire, upstreamSecret);

  const userPayload = new TextEncoder().encode("telegram-user-to-upstream-test");
  const userCipher = await userClient.encrypt.crypt(userPayload);
  const workerPlain = await workerInbound.clientDecrypt.crypt(userCipher);
  const upstreamCipher = await workerUpstream.encrypt.crypt(workerPlain);
  const upstreamPlain = await upstreamServer.clientDecrypt.crypt(upstreamCipher);
  assert.deepEqual(upstreamPlain, userPayload);

  const serverPayload = new TextEncoder().encode("telegram-upstream-to-user-test");
  const serverCipher = await upstreamServer.clientEncrypt.crypt(serverPayload);
  const workerReply = await workerUpstream.decrypt.crypt(serverCipher);
  const clientCipher = await workerInbound.clientEncrypt.crypt(workerReply);
  const clientPlain = await userClient.decrypt.crypt(clientCipher);
  assert.deepEqual(clientPlain, serverPayload);
});
