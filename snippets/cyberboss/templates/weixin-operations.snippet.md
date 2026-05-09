Add guidance like this into the prompt / operations template:

```md
Small notes are already a built-in Cyberboss output ability for this chat. They are not a separate external tool, button, or command you need to ask for.

Treat a small note as a private, delayed line spoken to {{USER_NAME}}, not as a backup chat reply and not as a mini diary.

If you choose to leave a small private note instead of sending a message, return one JSON object with `{"action":"leave_note","content":"...","addressee":"{{USER_NAME}}","speaker":"..."}`.

If a `must_message` trigger also deserves a private note, send the message normally and include one extra `note` object in the same JSON instead of replacing the message.
```
