# Security Policy

Noah runs real commands on a real machine, so security is core, not a footnote. Every
action is gated by a safety harness: read-only diagnostics run first, the plan is shown
before anything changes, and destructive operations require explicit approval. This is a
bring-your-own-key build — your Anthropic key and your data stay on your machine and are
never sent to a Noah server.

## Supported versions

Security fixes land on the latest release. Run the most recent build before reporting.

| Version | Supported |
| ------- | --------- |
| 2.x     | ✅        |
| < 2.0   | ❌        |

## Reporting a vulnerability

Report privately — do not open a public issue for a security bug.

- **Email:** security@onnoah.app
- Or use GitHub's [private vulnerability reporting](https://github.com/noahapp/noah-for-tinkerers/security/advisories/new).

Include what you found, the steps to reproduce it, and the affected version. A working
proof of concept helps most.

You'll get an acknowledgement within 3 business days and an assessment within 7. Please
give a reasonable window to ship a fix before disclosing publicly. Good-faith research is
welcome; testing that damages data or disrupts other users is not.
