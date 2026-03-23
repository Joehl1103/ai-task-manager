#!/bin/bash
# Send an iMessage notification via macOS Messages app.
# Usage: notify-sms.sh [recipient] [message]
# Falls back to NOTIFY_PHONE env var for recipient.

RECIPIENT="${1:-$NOTIFY_PHONE}"
MESSAGE="${2:-Task complete!}"

if [ -z "$RECIPIENT" ]; then
  echo "Error: No recipient. Set NOTIFY_PHONE or pass as first arg." >&2
  exit 1
fi

osascript <<EOF
tell application "Messages"
    set targetService to 1st account whose service type = iMessage
    set targetBuddy to participant "$RECIPIENT" of targetService
    send "$MESSAGE" to targetBuddy
end tell
EOF

if [ $? -eq 0 ]; then
  echo "Sent to $RECIPIENT: $MESSAGE"
else
  echo "Failed to send message." >&2
  exit 1
fi
