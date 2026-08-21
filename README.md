# 🛡️ ZeroBin — Modern Zero-Knowledge Ephemeral Paste Platform

> A high-performance, edge-ready, zero-knowledge platform built for sharing sensitive text online. Built as a contemporary interpretation of PrivateBin for Clone Fest 2.

---

### 🔑 Key Architectural Improvements Over PrivateBin

| Feature | Legacy PrivateBin (Reference) | **ZeroBin (Our Solution)** |
| :--- | :--- | :--- |
| **Backend Stack** | PHP (Stateful, heavy deployment) | **TypeScript + Next.js App Router** (Edge-native, serverless) |
| **Crypto Engine** | SJCL (Unmaintained library) | **Native Web Crypto API** (`crypto.subtle` AES-256-GCM) |
| **Storage Layer** | Local File System | **Upstash Redis** with atomic `GETDEL` operations |
| **Key Transport** | URL Fragment (`#`) | **URL Fragment (`#`) + Hardware Acceleration** |
| **Developer Experience**| Legacy PHP UI | **Tailwind CSS + TypeScript** |

---
### 🚀 Security Architecture & Threat Model

```text
[ Creator Client ]
        │
        ├── 1. Generate AES-GCM-256 Key (Local Memory)
        ├── 2. Encrypt Plaintext -> Ciphertext + IV
        │
        ├── 3. Send Payload (NO KEY) ────────────► [ Next.js API / Redis ]
        │                                                   │
        └── 4. Output Link: /v/{id}#{BASE64_KEY}            │ (Stores Ciphertext + TTL)
                                                            │
[ Recipient Client ]                                       │
        │                                                   │
        ├── 1. Fetch Ciphertext ◄───────────────────────────┘
        ├── 2. Read Key from window.location.hash
        └── 3. Decrypt Plaintext Locally in Browser
```

1. **Zero-Knowledge Principle:** The server never receives or logs the secret decryption key. Per RFC 3986, browsers strip everything after the `#` fragment before sending HTTP requests across the network.
2. **Atomic Single-View Destruction:** When "Burn After Reading" is enabled, fetching the ciphertext executes an atomic deletion in Redis, preventing concurrent race conditions.
3. **No-Store Caching Directives:** Implements `Cache-Control: no-store` headers across all API endpoints to guarantee browser single-view enforcement.
4. **No Unmaintained Dependencies:** Built using native browser primitives (`crypto.subtle`) for hardware-accelerated AES-GCM operations.

---

### 🛠️ Tech Stack

* **Framework:** Next.js 15 (React 19, TypeScript)
* **Styling:** Tailwind CSS
* **Database:** Upstash Redis (REST API)
* **Cryptography:** Native Web Crypto API (`AES-GCM`, `256-bit key length`, `12-byte IV`)
* **ID Generation:** NanoID

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