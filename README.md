# 🛡️ ZeroBin — Modern Zero-Knowledge Ephemeral Paste Platform

> A high-performance, edge-ready, zero-knowledge platform built for sharing sensitive text, code snippets, and encrypted attachments online. Built as a contemporary interpretation of PrivateBin for Clone Fest 2.

---

### 🔑 Key Architectural Improvements Over PrivateBin

| Feature | Legacy PrivateBin (Reference) | **ZeroBin (Our Solution)** |
| :--- | :--- | :--- |
| **Backend Stack** | PHP (Stateful, heavy deployment) | **TypeScript + Next.js App Router** (Edge-native, serverless) |
| **Crypto Engine** | SJCL (Unmaintained library) | **Native Web Crypto API** (`crypto.subtle` AES-256-GCM, PBKDF2) |
| **Storage Layer** | Local File System | **Upstash Redis** with atomic single-view deletion |
| **Key Transport** | URL Fragment (`#`) | **URL Fragment (`#`) + Hardware Acceleration** |
| **Security Features**| Basic encrypted text | **Decoy Payloads, Zero-Trace Attachments & Optional Passphrases** |
| **Developer Experience**| Legacy PHP UI | **Tailwind CSS + TypeScript** |

---

### ✨ Key Features

* 🛡️ **Zero-Knowledge Architecture:** Payload encryption and decryption occur strictly in local browser memory.
* 🎭 **Plausible Deniability (Decoy Payload):** Set a secondary cover payload to protect secrets under coercion. Entering a decoy trigger reveals harmless cover text.
* 📎 **Zero-Trace Attachments:** Convert files or images (up to 1 MB) into Base64 memory buffers, encrypted alongside text payloads.
* 🔑 **Double-Layer Passphrase Protection:** Derived via PBKDF2 (100,000 iterations + SHA-256) for secondary user-defined secret keys.
* 🔥 **Atomic Destruction & TTL:** Single-view "Burn After Reading" purges records from Upstash Redis immediately on the first fetch.
* 📱 **Client-Side QR Sharing:** On-the-fly QR code generation powered by `qrcode.react` without sending payload data to third-party endpoints.

---

### 🚀 Security Architecture & Threat Model

text
[ Creator Client ]
        │
        ├── 1. Generate AES-GCM-256 Key (Local Memory)
        ├── 2. Encrypt Plaintext & Attachments -> Ciphertext + IV
        │
        ├── 3. Send Payload (NO KEY) ────────────► [ Next.js API / Redis ]
        │                                                  │
        └── 4. Output Link: /v/{id}#{BASE64_KEY}           │ (Stores Ciphertext + TTL)
                                                           │
[ Recipient Client ]                                       │
        │                                                  │
        ├── 1. Fetch Ciphertext ◄───────────────────────────┘
        ├── 2. Read Key from window.location.hash
        └── 3. Decrypt Plaintext Locally in Browser

1. **Zero-Knowledge Principle:** The server never receives or logs the secret decryption key. Per RFC 3986, browsers strip everything after the `#` fragment before sending HTTP requests across the network.
2. **Atomic Single-View Destruction:** When "Burn After Reading" is enabled, fetching the ciphertext executes an atomic deletion in Redis, preventing concurrent race conditions.
3. **No-Store Caching Directives:** Implements `Cache-Control: no-store` headers across API endpoints to guarantee browser single-view enforcement.
4. **No Unmaintained Dependencies:** Built using native browser primitives (`crypto.subtle`) for hardware-accelerated AES-GCM operations.

---

### 🛠️ Tech Stack

* **Framework:** Next.js 16 (React 19, TypeScript)
* **Styling:** Tailwind CSS, Lucide React Icons
* **Database:** Upstash Redis (REST API)
* **Cryptography:** Native Web Crypto API (`AES-GCM`, `256-bit key length`, `PBKDF2`, `12-byte IV`)
* **Sharing:** `qrcode.react`

---

### ⚡ Quick Start

```bash
# 1. Clone repo
git clone [https://github.com/sachinsshastri7-boop/zero-bin.git](https://github.com/sachinsshastri7-boop/zero-bin.git)
cd zero-bin

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env.local)
# UPSTASH_REDIS_REST_URL="[https://your-database.upstash.io](https://your-database.upstash.io)"
# UPSTASH_REDIS_REST_TOKEN="your-token"

# 4. Run local server
npm run dev

---

### Run these commands to push the fix to GitHub:

```powershell
cd zero-bin
npm run build
git add README.md
git commit -m "docs: fix formatting in README.md"
git push
