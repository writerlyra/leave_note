const fs = require("fs");
const path = require("path");

function listNoteFiles(config) {
  return listJsonFiles(config.notesDir, /^[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$/u, "desc");
}

function listNoteDates(config) {
  return listNoteFiles(config)
    .map((fileName) => fileName.replace(/\.json$/u, ""))
    .filter(Boolean);
}

function readNotesByDate(config, date) {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return [];
  }
  const filePath = resolveChildFile(config.notesDir, `${normalizedDate}.json`, /^[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$/u);
  const notes = readJsonArray(filePath)
    .map(normalizeNote)
    .filter(Boolean);
  notes.sort((left, right) => {
    const leftAt = Date.parse(left.createdAt || "") || 0;
    const rightAt = Date.parse(right.createdAt || "") || 0;
    return leftAt - rightAt;
  });
  return notes;
}

function readJsonArray(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeNote(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const createdAt = normalizeText(value.createdAt);
  const content = normalizeText(value.content);
  if (!createdAt || !content) {
    return null;
  }
  return {
    id: normalizeText(value.id) || `${createdAt}:${content.slice(0, 12)}`,
    createdAt,
    addressee: normalizeText(value.addressee),
    speaker: normalizeText(value.speaker),
    content,
    readAt: normalizeText(value.readAt),
    kind: normalizeText(value.kind) || "note",
    source: normalizeText(value.source),
  };
}

function listJsonFiles(dirPath, matcher, direction = "asc") {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  return direction === "desc" ? files.reverse() : files;
}

function resolveChildFile(dirPath, fileName, matcher) {
  const normalized = String(fileName || "").trim();
  if (!normalized || path.basename(normalized) !== normalized || !matcher.test(normalized)) {
    throw new Error(`invalid file name: ${fileName}`);
  }
  const filePath = path.join(dirPath, normalized);
  if (!fs.existsSync(filePath)) {
    throw new Error(`file not found: ${normalized}`);
  }
  return filePath;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value) {
  const normalized = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}$/u.test(normalized) ? normalized : "";
}

module.exports = {
  listNoteFiles,
  listNoteDates,
  readNotesByDate,
};
