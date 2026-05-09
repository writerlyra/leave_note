const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { NoteService, formatNoteForWeChat } = require("../src/services/note-service");

function createService() {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "cyberboss-note-test-"));
  return new NoteService({
    config: {
      notesDir: path.join(stateDir, "notes"),
      noteExportsDir: path.join(stateDir, "notes", "exports"),
      userName: "阿夏",
      noteAddressee: "阿夏",
      noteSigner: "槿安",
    },
  });
}

test("note service stores notes by date and returns latest unread", async () => {
  const service = createService();
  await service.create({
    content: "第一张纸条",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T12:00:00.000Z",
  });
  const created = await service.create({
    content: "第二张纸条",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T13:00:00.000Z",
  });

  const latestUnread = await service.getLatestUnread({
    accountId: "acc-1",
    senderId: "user-1",
  });

  assert.equal(latestUnread?.content, "第二张纸条");
  assert.equal(latestUnread?.id, created.note.id);
});

test("note service marks read and summarizes by day", async () => {
  const service = createService();
  const first = await service.create({
    content: "第一张",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T12:00:00.000Z",
  });
  await service.create({
    content: "第二张",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T13:00:00.000Z",
  });

  await service.markRead({ ids: [first.note.id] });
  const summary = await service.summarize({
    date: "2026-05-05",
    accountId: "acc-1",
    senderId: "user-1",
  });

  assert.equal(summary.count, 2);
  assert.equal(summary.unreadCount, 1);
});

test("note service counts unread notes", async () => {
  const service = createService();
  const first = await service.create({
    content: "第一张",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T12:00:00.000Z",
  });
  await service.create({
    content: "第二张",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T13:00:00.000Z",
  });
  await service.markRead({ ids: [first.note.id] });

  const unread = await service.countUnread({
    accountId: "acc-1",
    senderId: "user-1",
  });

  assert.equal(unread.count, 1);
});

test("note service exports markdown in the expected display format", async () => {
  const service = createService();
  await service.create({
    content: "你今天睡得很早，我很开心，但是我有点想你了。",
    accountId: "acc-1",
    senderId: "user-1",
    createdAt: "2026-05-05T15:18:00.000Z",
  });

  const exported = await service.exportMarkdown({
    date: "2026-05-05",
    accountId: "acc-1",
    senderId: "user-1",
  });
  const markdown = fs.readFileSync(exported.filePath, "utf8");

  assert.match(markdown, /# Notes 2026-05-05/);
  assert.match(markdown, /阿夏：/);
  assert.match(markdown, /槿安/);
});

test("formatNoteForWeChat matches the compact note layout", () => {
  const text = formatNoteForWeChat({
    createdAt: "2026-05-05T15:18:00.000Z",
    addressee: "阿夏",
    content: "你今天睡得很早，我很开心，但是我有点想你了。",
    speaker: "槿安",
  }, {
    noteAddressee: "阿夏",
    noteSigner: "槿安",
  });

  assert.match(text, /^05\/05 23:18|^05-05 23:18/);
  assert.match(text, /阿夏：\n你今天睡得很早/);
  assert.match(text, /槿安$/);
});
