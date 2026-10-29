# Telegram Notify – xyOps Action Plugin

Sends xyOps alert notifications (fired and cleared) and job notifications to a Telegram chat using a bot.
The message shown is the alert's own rendered message (e.g. "Root filesystem is 93% full.").

## Requirements
- xyOps
- Node.js 18+, `npx`
- `git` (the plugin is launched from GitHub via npx)
- Internet access to `api.telegram.org`

## Environment variables (use a Secret Vault)

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather (required) |

## Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `chat_id` | text | *(required)* | Telegram chat/group/channel ID |
| `thread_id` | text | — | Forum topic ID for supergroups |
| `notify_on_clear` | checkbox | ✅ | Send a message when alert clears |
| `include_link` | checkbox | ✅ | Include a link to xyOps |
| `silent` | checkbox | ☐ | Send without sound |
| `silent_on_clear` | checkbox | ✅ | Send clear notification without sound |
| `debug` | checkbox | ☐ | Log full input JSON to stderr |

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.
2. Add the bot to your chat/group and get the chat ID.
3. In xyOps, create a **Secret Vault** with key `TELEGRAM_BOT_TOKEN` and assign it to this plugin.
4. Add a **Plugin** action to an alert, group, or `alert_universal_actions`
   for conditions `alert_new` and `alert_cleared`.

## Example notification

```
🚨 ALERT: Disk Full
Root filesystem is 93% full.
Server: web-01.example.com
Open in xyOps Admin
```

## Data collection

This plugin collects no user data or metrics. Message content is sent only to the Telegram Bot API (a third-party service).

## License

MIT
