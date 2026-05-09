const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { normalizeBody } = require("./text-input");

class NoteService {
  constructor({ config }) {
    this.config = config;
  }

  async create({
    text = "",
    content = "",
    addressee = "",
    speaker = "",
    accountId = "",
    senderId = "",
    workspaceRoot = "",
    threadId = "",
    turnId = "",
    model = "",
    source = "",
    kind = "",
    createdAt = "",
  } = {}) {
    const body = normalizeBody(content || text);
    if (!body) {
      throw new Error("Note content cannot be empty.");
    }

    const noteCreatedAt = normalizeIsoTime(createdAt) || new Date().toISOString();
    const date = formatDate(noteCreatedAt);
    const filePath = path.join(this.config.notesDir, `${date}.json`);
    const speakerName = normalizeText(speaker) || normalizeText(this.config.noteSigner) || "Bot";
    const addresseeName = normalizeText(addressee) || normalizeText(this.config.noteAddressee) || normalizeText(this.config.userName) || "User";
    const notes = loadNotesFile(filePath);
    const record = {
      id: crypto.randomUUID(),
      createdAt: noteCreatedAt,
      addressee: addresseeName,
      speaker: speakerName,
      content: body,
      accountId: normalizeText(accountId),
      senderId: normalizeText(senderId),
      workspaceRoot: normalizeText(workspaceRoot),
      threadId: normalizeText(threadId),
      turnId: normalizeText(turnId),
      model: normalizeText(model),
      source: normalizeText(source) || "runtime_action",
      kind: normalizeText(kind) || "note",
      readAt: "",
    };

    notes.push(record);
    saveNotesFile(filePath, notes);
    return {
      filePath,
      note: { ...record },
    };
  }

  async getLatestUnread({ accountId = "", senderId = "" } = {}) {
    const notes = this.listMatchingNotes({
      accountId,
      senderId,
      unreadOnly: true,
      sort: "desc",
      limit: 1,
    });
    return notes[0] ? { ...notes[0] } : null;
  }

  async getLatest({ accountId = "", senderId = "" } = {}) {
    const notes = this.listMatchingNotes({
      accountId,
      senderId,
      sort: "desc",
      limit: 1,
    });
    return notes[0] ? { ...notes[0] } : null;
  }

  async summarize({ date = "", month = "", accountId = "", senderId = "" } = {}) {
    const scope = resolveScope({ date, month });
    const notes = this.listMatchingNotes({
      accountId,
      senderId,
      date: scope.date,
      month: scope.month,
      sort: "asc",
    });
    const unreadCount = notes.filter((entry) => !normalizeText(entry.readAt)).length;
    const uniqueDays = new Set(notes.map((entry) => formatDate(entry.createdAt)));
    return {
      scope,
      count: notes.length,
      unreadCount,
      days: uniqueDays.size,
      firstAt: notes[0]?.createdAt || "",
      lastAt: notes[notes.length - 1]?.createdAt || "",
      latest: notes[notes.length - 1] ? { ...notes[notes.length - 1] } : null,
    };
  }

  async markRead({ ids = [], readAt = "" } = {}) {
    const normalizedIds = Array.isArray(ids)
      ? ids.map((value) => normalizeText(value)).filter(Boolean)
      : [];
    if (!normalizedIds.length) {
      return { updated: 0 };
    }

    const readTimestamp = normalizeIsoTime(readAt) || new Date().toISOString();
    let updated = 0;
    for (const filePath of listNoteFiles(this.config.notesDir)) {
      const notes = loadNotesFile(filePath);
      let dirty = false;
      for (const note of notes) {
        if (!normalizedIds.includes(normalizeText(note.id)) || normalizeText(note.readAt)) {
          continue;
        }
        note.readAt = readTimestamp;
        updated += 1;
        dirty = true;
      }
      if (dirty) {
        saveNotesFile(filePath, notes);
      }
    }
    return { updated, readAt: readTimestamp };
  }

  async countUnread({ accountId = "", senderId = "" } = {}) {
    const notes = this.listMatchingNotes({
      accountId,
      senderId,
      unreadOnly: true,
      sort: "desc",
    });
    return {
      count: notes.length,
    };
  }

  async exportMarkdown({ date = "", month = "", accountId = "", senderId = "" } = {}) {
    const scope = resolveScope({ date, month });
    const notes = this.listMatchingNotes({
      accountId,
      senderId,
      date: scope.date,
      month: scope.month,
      sort: "asc",
    });
    if (!notes.length) {
      return {
        scope,
        count: 0,
        filePath: "",
      };
    }

    fs.mkdirSync(this.config.noteExportsDir, { recursive: true });
    const label = scope.date || scope.month || formatDate(new Date().toISOString());
    const filePath = path.join(this.config.noteExportsDir, `notes-${label}.md`);
    const lines = [
      `# Notes ${label}`,
      "",
      `Count: ${notes.length}`,
    ];
    for (const note of notes) {
      lines.push(
        "",
        `## ${formatNoteTimestamp(note.createdAt)}`,
        "",
        `${normalizeText(note.addressee) || normalizeText(this.config.noteAddressee) || "User"}：`,
        `${normalizeBody(note.content) || ""}`,
        `${normalizeText(note.speaker) || normalizeText(this.config.noteSigner) || "Bot"}`
      );
    }
    fs.writeFileSync(filePath, `${lines.join("\n").trim()}\n`, "utf8");
    return {
      scope,
      count: notes.length,
      filePath,
    };
  }

  listMatchingNotes({
    accountId = "",
    senderId = "",
    date = "",
    month = "",
    unreadOnly = false,
    sort = "desc",
    limit = undefined,
  } = {}) {
    const scope = resolveScope({ date, month });
    const account = normalizeText(accountId);
    const sender = normalizeText(senderId);
    const notes = [];
    for (const filePath of listNoteFiles(this.config.notesDir, scope)) {
      const fileNotes = loadNotesFile(filePath)
        .filter((entry) => matchesScope(entry, scope))
        .filter((entry) => !account || normalizeText(entry.accountId) === account)
        .filter((entry) => !sender || normalizeText(entry.senderId) === sender)
        .filter((entry) => !unreadOnly || !normalizeText(entry.readAt));
      notes.push(...fileNotes);
    }

    notes.sort((left, right) => {
      const leftAt = Date.parse(left.createdAt || "") || 0;
      const rightAt = Date.parse(right.createdAt || "") || 0;
      return sort === "asc" ? leftAt - rightAt : rightAt - leftAt;
    });

    const normalizedLimit = Number(limit);
    if (Number.isInteger(normalizedLimit) && normalizedLimit > 0) {
      return notes.slice(0, normalizedLimit).map((entry) => ({ ...entry }));
    }
    return notes.map((entry) => ({ ...entry }));
  }
}

function formatNoteForWeChat(note, config = {}) {
  const createdAt = normalizeIsoTime(note?.createdAt);
  const addressee = normalizeText(note?.addressee) || normalizeText(config.noteAddressee) || normalizeText(config.userName) || "User";
  const content = normalizeBody(note?.content || "");
  const speaker = normalizeText(note?.speaker) || normalizeText(config.noteSigner) || "Bot";
  return [
    formatNoteTimestamp(createdAt),
    `${addressee}：`,
    content,
    speaker,
  ].join("\n").trim();
}

function resolveScope({ date = "", month = "" } = {}) {
  const normalizedDate = normalizeText(date);
  const normalizedMonth = normalizeText(month);
  if (normalizedDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(normalizedDate)) {
      throw new Error("date must look like 2026-05-05.");
    }
    return { date: normalizedDate, month: normalizedDate.slice(0, 7) };
  }
  if (normalizedMonth) {
    if (!/^\d{4}-\d{2}$/u.test(normalizedMonth)) {
      throw new Error("month must look like 2026-05.");
    }
    return { date: "", month: normalizedMonth };
  }
  return { date: "", month: "" };
}

function listNoteFiles(notesDir, scope = {}) {
  fs.mkdirSync(notesDir, { recursive: true });
  const entries = fs.readdirSync(notesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{4}-\d{2}-\d{2}\.json$/u.test(entry.name))
    .map((entry) => entry.name)
    .filter((name) => {
      if (scope?.date) {
        return name === `${scope.date}.json`;
      }
      if (scope?.month) {
        return name.startsWith(`${scope.month}-`);
      }
      return true;
    })
    .sort((left, right) => right.localeCompare(left));
  return entries.map((name) => path.join(notesDir, name));
}

function loadNotesFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        id: normalizeText(entry.id),
        createdAt: normalizeIsoTime(entry.createdAt) || "",
        addressee: normalizeText(entry.addressee),
        speaker: normalizeText(entry.speaker),
        content: normalizeBody(entry.content || ""),
        accountId: normalizeText(entry.accountId),
        senderId: normalizeText(entry.senderId),
        workspaceRoot: normalizeText(entry.workspaceRoot),
        threadId: normalizeText(entry.threadId),
        turnId: normalizeText(entry.turnId),
        model: normalizeText(entry.model),
        source: normalizeText(entry.source),
        kind: normalizeText(entry.kind),
        readAt: normalizeIsoTime(entry.readAt) || "",
      }))
      .filter((entry) => entry.id && entry.createdAt && entry.content);
  } catch {
    return [];
  }
}

function saveNotesFile(filePath, notes) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(notes, null, 2)}\n`, "utf8");
}

function matchesScope(entry, scope) {
  const date = formatDate(entry?.createdAt || "");
  if (scope?.date) {
    return date === scope.date;
  }
  if (scope?.month) {
    return date.startsWith(`${scope.month}-`);
  }
  return true;
}

function formatNoteTimestamp(value) {
  const normalized = normalizeIsoTime(value);
  if (!normalized) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(normalized)).replace(",", "");
}

function formatDate(value) {
  const normalized = normalizeIsoTime(value);
  if (!normalized) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(normalized));
}

function normalizeIsoTime(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  NoteService,
  formatDate,
  formatNoteForWeChat,
  formatNoteTimestamp,
  resolveScope,
};
