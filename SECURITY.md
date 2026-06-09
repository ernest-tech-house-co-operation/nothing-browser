# Security Policy

## Supported Versions

| Version | Support |
|---------|---------|
| Latest stable (v0.1.x) | ✅ Full security updates |
| Previous minor version | ⚠️ Critical fixes only |
| Older releases | ❌ Unsupported |

We only patch security issues on the latest stable release. **Please update before reporting.**

---

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

### Contact

Email: **ernesttechhouse@gmail.com**

### What to Include

- **Description** — What is the vulnerability?
- **Steps to reproduce** — How can we verify it?
- **Impact** — What could an attacker do?
- **System info** — OS, version, architecture
- **Proof of concept** — Code or commands (if possible)

### Response Timeline

| Acknowledgment | Fix for critical | Fix for moderate/low |
|----------------|------------------|----------------------|
| Within 48 hours | Within 7 days | Next release cycle |

---

## Scope

### ✅ In Scope (We care about)

| Area | Description |
|------|-------------|
| **Remote code execution** | Via browser engine, bridge, or daemon |
| **Data exfiltration** | Through network capture layer |
| **Fingerprint bypass** | Leaking real identity despite spoofing |
| **Arbitrary file access** | Read/write from headless/headful daemon |
| **Session leakage** | Cross-tab or cross-session data exposure |
| **Dependency vulnerabilities** | In `newpipe-bridge` (Java) or Qt6 modules |

### ❌ Out of Scope

| Area | Reason |
|------|--------|
| **Qt6/Chromium vulnerabilities** | Report upstream to Qt or Chromium |
| **Unsupported OS versions** | Use at your own risk |
| **Self-inflicted issues** | Modifying the binary or building from source with changes |
| **Social engineering** | Not applicable |
| **Physical attacks** | Out of scope |
| **Browser extensions** | Not supported |

---

## Disclosure Policy

We follow **coordinated disclosure**:

1. **Report** — You email us the vulnerability
2. **Acknowledge** — We confirm receipt within 48 hours
3. **Investigate** — We verify and assess impact
4. **Fix** — We develop and test a patch
5. **Release** — We ship the fix in next stable release
6. **Public disclosure** — You may publish findings after fix is released

### Credit

We'll credit you in the release notes unless you request anonymity.

---

## Security Features (Current)

| Feature | Status | Protection |
|---------|--------|------------|
| Fingerprint spoofing | ✅ Active | Prevents identity tracking |
| WebRTC leak protection | ✅ Active | Blocks real IP exposure |
| Session wiping | ✅ Active | Clears data on close |
| Network capture isolation | ✅ Active | Captures stay in DEVTOOLS |
| Update verification | ⚠️ Planned | Checksum validation |

---

## Reporting Format Example

```markdown
**Title:** Short description

**Version:** v0.1.3

**OS:** Linux x86_64

**Description:**
Detailed explanation of the vulnerability.

**Steps to reproduce:**
1. Do this
2. Then this
3. Observe that

**Impact:**
What an attacker could do.

**Suggested fix (optional):**
Your idea for a fix.
```

---

## Security Best Practices for Users

| Practice | Why |
|----------|-----|
| **Always use latest version** | Old versions have known issues |
| **Download from official GitHub** | Avoid modified binaries |
| **Don't disable fingerprint spoofing** | It's your main protection |
| **Use Private Browser for sensitive browsing** | Zero session persistence |
| **Verify checksums** (planned) | Ensure binary integrity |

---

## Contact

**Email:** ernesttechhouse@gmail.com  
**Discord:** [Join server](https://discord.gg/TUxBVQ7y) (for non-sensitive discussions)  
**GitHub:** [BunElysiaReact/nothing-browser](https://github.com/BunElysiaReact/nothing-browser)

---

## Acknowledgments

Thank you to security researchers who report vulnerabilities responsibly. Your work makes Nothing Browser safer for everyone.

---

*Nothing Ecosystem · Ernest Tech House · Kenya · 2026*