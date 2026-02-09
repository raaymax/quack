# ADR 009: Client-Side End-to-End Encryption

## Status

Accepted

## Context

Quack is a privacy-focused chat application. Users hosting their own server still want assurance that messages are private — even from the server operator. End-to-end encryption (E2EE) ensures that only the sender and recipient can read message content.

## Decision

Implement **client-side E2E encryption** using the Web Crypto API. The server never sees plaintext message content.

### Algorithms

| Algorithm | Purpose | Parameters |
|-----------|---------|------------|
| **PBKDF2** | Derive encryption key from user's password | SHA-256, 100,000 iterations, 256-bit output |
| **AES-GCM** | Encrypt/decrypt message content | 256-bit key, 12-byte random IV |
| **ECDH (P-256)** | Derive shared secret between two users | Elliptic Curve Diffie-Hellman |
| **XOR split** | Split encryption key for backup/recovery | 2-of-2 secret sharing |

### Key Lifecycle

1. **Registration** — Password → PBKDF2 → encryption key. Generate EC key pair + AES user key. Encrypt secrets with password-derived key. Store encrypted secrets on server.
2. **Login** — Password → PBKDF2 → decrypt stored secrets → recover EC private key and user encryption key.
3. **Messaging** — Sender's EC private key + recipient's EC public key → ECDH → shared AES key → AES-GCM encrypt message.
4. **Recovery** — User encryption key XOR-split into two shares for backup.

### Implementation

All cryptographic operations are in `deno/encryption/mod.ts`, shared between frontend and backend. The module uses only the Web Crypto API (`crypto.subtle`), making it platform-agnostic.

## Consequences

- **Positive:** True E2EE — the server cannot read message content, even if compromised.
- **Positive:** Web Crypto API — browser-native, no external crypto library needed.
- **Positive:** Shared module — same encryption code runs in browser and Deno.
- **Positive:** PBKDF2 with 100k iterations provides reasonable resistance to brute-force attacks on passwords.
- **Negative:** Key management complexity — users must not lose their password, or they lose access to encrypted messages.
- **Negative:** No forward secrecy — compromised EC private key exposes all past messages with that user.
- **Positive:** Multi-device support — encrypted secrets are stored on the server and decrypted via the user's password, so any device can recover keys at login without key transfer.
- **Negative:** Server-side search over encrypted messages is not possible.
