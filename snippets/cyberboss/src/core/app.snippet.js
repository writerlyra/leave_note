// Add a note capture stage after runtime output is available.
async captureAssistantNotes(event) {
  const threadId = normalizeText(event?.payload?.threadId);
  const turnId = normalizeText(event?.payload?.turnId);
  const replyText = normalizeText(event?.payload?.text);
  if (!threadId || !replyText || !this.projectServices?.note) {
    return;
  }

  const noteActions = extractAllNoteActions(replyText);
  if (!noteActions.length) {
    return;
  }

  const sessionStore = this.runtimeAdapter.getSessionStore();
  const linked = sessionStore.findBindingForThreadId(threadId);
  const binding = linked?.bindingKey ? sessionStore.getBinding(linked.bindingKey) || {} : {};
  const workspaceRoot = linked?.workspaceRoot || normalizeText(binding.activeWorkspaceRoot) || "";
  const runtimeParams = workspaceRoot
    ? sessionStore.getRuntimeParamsForWorkspace(linked?.bindingKey || "", workspaceRoot)
    : { model: "" };

  for (const noteAction of noteActions) {
    await this.projectServices.note.create({
      content: noteAction.content,
      addressee: noteAction.addressee || this.config.noteAddressee,
      speaker: noteAction.speaker || this.config.noteSigner,
      accountId: normalizeText(binding.accountId),
      senderId: normalizeText(binding.senderId),
      workspaceRoot,
      threadId,
      turnId,
      model: runtimeParams?.model || this.config.claudeModel || "",
      source: noteAction.source || "runtime_action",
      kind: noteAction.kind || "note",
      createdAt: new Date().toISOString(),
    });
  }
}

function extractAllNoteActions(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }
  const candidate = extractSystemActionJsonCandidate(normalized) || normalized;
  const parsed = tryParseJson(candidate);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return [];
  }
  const actions = [];
  const action = normalizeSystemActionName(parsed.action || parsed.cyberboss_action);
  if (action === "leave_note") {
    const content = sanitizeNoteContent(parsed.content || parsed.note || parsed.message || parsed.text || "");
    if (content) {
      actions.push({
        kind: normalizeText(parsed.kind) || "note",
        addressee: normalizeText(parsed.addressee),
        speaker: normalizeText(parsed.speaker),
        content,
        source: "runtime_action",
      });
    }
  }
  if (parsed.note && !Array.isArray(parsed.note) && typeof parsed.note === "object") {
    const embedded = parsed.note;
    const content = sanitizeNoteContent(embedded.content || embedded.note || embedded.message || embedded.text || "");
    if (content) {
      actions.push({
        kind: normalizeText(embedded.kind) || "note",
        addressee: normalizeText(embedded.addressee),
        speaker: normalizeText(embedded.speaker),
        content,
        source: "runtime_embedded_note",
      });
    }
  }
  return actions;
}
