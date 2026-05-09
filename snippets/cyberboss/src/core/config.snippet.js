// Add into the config object built from stateDir.
notesDir: path.join(stateDir, "notes"),
noteExportsDir: path.join(stateDir, "notes", "exports"),
noteAddressee: readTextEnv("CYBERBOSS_NOTE_ADDRESSEE") || readTextEnv("CYBERBOSS_USER_NAME") || "User",
noteSigner: readTextEnv("CYBERBOSS_NOTE_SIGNER") || readTextEnv("CYBERBOSS_BOT_NAME") || "Bot",
