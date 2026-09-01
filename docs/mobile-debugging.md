# Mobile Debugging

Obsidian on Android runs in a WebView, so Chrome DevTools on the desktop can inspect it. This gives a full console, network tab, and element inspector for the plugin running on the phone.

## Prerequisites

- Android phone with Obsidian installed
- USB data cable (charge-only cables will not work)
- Desktop Chrome
- adb: `brew install android-platform-tools`

## Connect the phone

1. On the phone: Settings, About phone, tap Build number seven times to unlock Developer options.
2. Developer options, enable USB debugging.
3. Plug the phone into the desktop over USB.
4. Set the USB mode to File transfer (MTP), not charging only.
5. Unlock the phone, then accept the "Allow USB debugging?" prompt. Tick "Always allow from this computer".

Verify with `adb devices`. The serial must show as device, not unauthorized or offline.

## Inspect Obsidian

1. Open Obsidian on the phone and leave it in the foreground.
2. On the desktop, open Chrome at chrome://inspect/#devices.
3. Find the md.obsidian entry under the device, then click inspect.

DevTools opens against the Obsidian WebView. Console output from the plugin appears there.

## Troubleshooting

Device shows "Offline - Pending authentication"

- The phone has not authorised the desktop, so Chrome cannot list any target.
- Restart the adb server: `adb kill-server && adb devices`. This re-triggers the prompt.
- Accept the prompt on an unlocked screen.
- If it still fails, revoke USB debugging authorisations in Developer options, then replug.

No md.obsidian entry despite an authorised device

- Obsidian must be open and in the foreground. The WebView vanishes when the app backgrounds.
- Stay online the first time, as Chrome fetches DevTools over the network.
- Check that no other tool (Android Studio, scrcpy) is holding the adb server.

Nothing works over USB

- `adb logcat | grep -i obsidian` catches crashes that DevTools misses.
- Have the plugin append log lines to a note in the vault as a last resort.
