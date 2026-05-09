const test = require("node:test");
const assert = require("node:assert/strict");

const { StreamDelivery } = require("../src/core/stream-delivery");

async function runCompletedTurn(streamDelivery, { threadId, turnId, itemId, text }) {
  await streamDelivery.handleRuntimeEvent({
    type: "runtime.turn.started",
    payload: { threadId, turnId },
  });
  await streamDelivery.handleRuntimeEvent({
    type: "runtime.reply.completed",
    payload: { threadId, turnId, itemId, text },
  });
  await streamDelivery.handleRuntimeEvent({
    type: "runtime.turn.completed",
    payload: { threadId, turnId },
  });
}

test("leave_note action is suppressed from direct delivery", async () => {
  const sent = [];
  const streamDelivery = new StreamDelivery({
    channelAdapter: {
      async sendText(payload) {
        sent.push(payload);
      },
      getKnownContextTokens() {
        return {};
      },
    },
    sessionStore: {
      findBindingForThreadId() {
        return null;
      },
    },
  });

  streamDelivery.queueReplyTargetForThread("thread-note", {
    userId: "user-1",
    contextToken: "ctx-1",
    provider: "system",
  });

  await runCompletedTurn(streamDelivery, {
    threadId: "thread-note",
    turnId: "turn-note",
    itemId: "item-note",
    text: "{\"action\":\"leave_note\",\"content\":\"给你留张纸条\",\"addressee\":\"阿夏\",\"speaker\":\"槿安\"}",
  });

  assert.deepEqual(sent, []);
});

test("send_message with embedded note still sends the message text", async () => {
  const sent = [];
  const streamDelivery = new StreamDelivery({
    channelAdapter: {
      async sendText(payload) {
        sent.push(payload);
      },
      getKnownContextTokens() {
        return {};
      },
    },
    sessionStore: {
      findBindingForThreadId() {
        return null;
      },
    },
  });

  streamDelivery.queueReplyTargetForThread("thread-note-2", {
    userId: "user-1",
    contextToken: "ctx-1",
    provider: "system",
  });

  await runCompletedTurn(streamDelivery, {
    threadId: "thread-note-2",
    turnId: "turn-note-2",
    itemId: "item-note-2",
    text: "{\"action\":\"send_message\",\"message\":\"在呢\",\"note\":{\"content\":\"给你留张纸条\",\"addressee\":\"阿夏\",\"speaker\":\"槿安\"}}",
  });

  assert.deepEqual(sent, [{
    userId: "user-1",
    text: "在呢",
    contextToken: "ctx-1",
  }]);
});
