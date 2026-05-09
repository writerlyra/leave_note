// 1. Suppress direct delivery for leave_note.
if (resolved.kind === "leave_note") {
  this.markAllItemsSent(state);
  console.log(
    `[cyberboss] suppressed system reply thread=${state.threadId} action=leave_note preview=${JSON.stringify(replyText.slice(0, 120))}`
  );
  return;
}

// 2. Treat leave_note as handled during delivery.
if (delivery.kind === "leave_note") {
  return true;
}

// 3. Parse {"action":"leave_note", ...} as a valid structured action.
if (action === "leave_note") {
  const content = sanitizeProtocolLeakText(
    normalizeLineEndings(String(parsed.content || parsed.note || parsed.message || parsed.text || ""))
  ).text.trim();
  if (!content) {
    return { kind: "invalid", reason: "leave_note requires non-empty content" };
  }
  return {
    kind: "leave_note",
    content,
    addressee: String(parsed.addressee || "").trim(),
    speaker: String(parsed.speaker || "").trim(),
  };
}

// 4. Mark it as a non-message action when building deliveries.
if (action.kind === "leave_note") {
  return { itemId, kind: "leave_note", sourceText };
}
