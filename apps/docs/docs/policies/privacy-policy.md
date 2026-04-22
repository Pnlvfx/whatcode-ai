---
sidebar_position: 1
---

# Privacy Policy

_Last updated: April 22, 2026_

WhatCode ("we", "our", or "us") is committed to protecting your privacy. This policy explains what data we collect, how we use it, your rights, and how to contact us with questions.

## 1. Overview

WhatCode is a local-first iOS companion for OpenCode. In practice this means:

- Your code, conversations, and project data are processed entirely by the OpenCode server running on your own Mac — they never pass through our servers.
- We do not operate user accounts or cloud databases.
- We do not use analytics, advertising SDKs, or cross-app tracking.
- We do not sell your personal information.
- The only data that reaches our relay server is what is necessary to deliver push notifications to your device.

## 2. Information We Collect

### 2.1 Push notification token

When you enable notifications, the iOS app registers an Apple Push Notification service (APNs) device token with the WhatCode daemon running on your Mac. The daemon sends that token to our relay server (`api.whatcode.app`) so it can forward push notifications to your device.

The token is stored locally on your Mac at `~/.whatcode/auth/` and on the relay for delivery purposes only. It is never shared with third parties for advertising or analytics.

### 2.2 Notification payload

When your OpenCode session becomes idle, encounters an error, or requires your attention, the daemon sends a push notification to our relay. The relay forwards it to APNs for delivery to your device. The notification payload contains:

- The project or session name (used as the notification title)
- A short snippet of the last model response or error message (used as the notification body)
- Event type (`session.idle`, `permission.asked`, or `session.error`)
- Session and project identifiers

This content passes through our relay in transit to reach your device. We do not store notification bodies after delivery. Our relay does not have access to your full conversation history — only the snippet included in each individual notification.

### 2.3 Machine identifier

A unique identifier for the machine running the WhatCode daemon is generated locally using standard system APIs. It is used to distinguish connections between your Mac and your iOS device. It is not linked to your personal identity and is not sent to our servers.

### 2.4 Information we do not collect

- We do not collect your name, email address, phone number, or any account credentials.
- We do not collect your code, project files, or full conversation history.
- We do not use analytics SDKs or behavioral tracking in the iOS app or daemon.
- We do not track you across other companies' apps or websites.

## 3. How We Use Information

We use the information described above only to operate WhatCode:

- Registering and storing your APNs token to enable push notification delivery
- Routing push notifications from your Mac to your iOS device
- Removing your token when you unregister or reset the daemon

We do not use your information for advertising, profiling, or resale.

### 3.1 Legal bases (GDPR)

If you are in the European Economic Area, we rely on the following legal bases:

- **Contract performance** — to provide the core notification delivery feature you have enabled
- **Legitimate interests** — to maintain relay infrastructure security, prevent abuse, and ensure service stability
- **Consent** — for iOS permissions such as notification access and local network access, which you grant through the standard iOS permission prompts

## 4. Third-Party Services

### 4.1 Apple Push Notification service (APNs)

We use APNs to deliver notifications to your device. Apple receives your device token and the notification payload as part of this delivery. Apple's privacy policy applies: [apple.com/privacy](https://www.apple.com/privacy/)

### 4.2 Apple (App Store and platform)

Apple provides App Store distribution, in-app purchase infrastructure, and iOS platform services. Apple's privacy policy applies: [apple.com/privacy](https://www.apple.com/privacy/)

### 4.3 Tailscale (optional)

If you launch the daemon with the `--tailscale` flag, your connection may route through Tailscale's network. Tailscale's privacy policy applies: [tailscale.com/privacy-policy](https://tailscale.com/privacy-policy/)

## 5. Data Storage and Security

### 5.1 On your Mac

- APNs token and device registration data are stored locally at `~/.whatcode/auth/`
- The daemon holds session metadata (machine ID, OpenCode URL, daemon URL) in memory only — it is not persisted to disk

### 5.2 On the relay server

- APNs tokens are stored to enable push delivery
- We do not store notification body content after it has been forwarded to APNs
- The relay processes IP address and connection metadata as part of normal HTTPS operation

### 5.3 On your iOS device

- The iOS app stores the pairing state and user identifier needed to register for notifications
- No conversation history or code is stored by the app itself — all session data lives on your Mac

### 5.4 In transit

- All communication between the daemon, relay, and APNs uses HTTPS/TLS
- Notification payloads are visible to the relay while in transit, before being forwarded to APNs

## 6. Data Retention

- **APNs tokens** — retained on the relay for as long as they are valid and in use. Tokens are automatically removed when the daemon receives an `Unregistered` response from APNs, or when you run `whatcode --reset` or call the unregister endpoint
- **Notification payloads** — not stored after forwarding to APNs
- **Local daemon data** — retained on your Mac until you delete the `~/.whatcode/` directory or reset the daemon

## 7. International Data Transfers

WhatCode operates relay infrastructure and uses Apple's APNs, which may process data outside your country of residence. Where required by applicable law (including GDPR), we rely on appropriate safeguards for such transfers, including standard contractual clauses or adequacy decisions. Contact us for more information.

## 8. Your Rights

Depending on your jurisdiction, you may have the right to access, correct, delete, restrict, or object to the processing of your personal information, and to request portability where applicable.

Because WhatCode is local-first, most of your data remains under your direct control on your own devices. For notification-related data processed by our relay, running `whatcode --reset` removes your APNs token. For any other privacy request, contact us at [support@whatcode.ai](mailto:support@whatcode.ai).

**EEA users:** You also have the right to lodge a complaint with your local data protection supervisory authority.

### 8.1 California (CCPA/CPRA)

We do not sell or share your personal information for cross-context behavioral advertising.

## 9. Children's Privacy

WhatCode is not directed to children under 13 (or the applicable minimum age in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, contact us and we will delete it promptly.

## 10. Changes to This Policy

We may update this policy from time to time. Changes will be posted on this page with an updated date. Continued use of the app after changes are posted constitutes acceptance of the revised policy.

## 11. Contact

Questions about this policy or requests to exercise your privacy rights? Email us at [support@whatcode.ai](mailto:support@whatcode.ai).
