# 🔐 SecureCall OS — Interactive System Call Simulator

SecureCall OS is a browser-based simulation of a secure kernel system call interface, designed to mimic how modern operating systems manage syscalls, enforce access control, and maintain audit trails.

It combines a **terminal-driven execution engine**, **role-based security model (RBAC)**, and **real-time monitoring dashboard** to create an immersive, OS-like experience directly in the browser.

---

## 🚀 Key Features

### 🔑 Authentication & Access Control

* Multi-role login system:

  * **Administrator**
  * **Developer**
  * **Standard User**
  * **Auditor**
* Role-based access enforcement (RBAC)
* Simulated **Multi-Factor Authentication (MFA)** for privileged roles
* Session timer with auto-expiry

---

### 🖥️ Interactive System Call Terminal

* Execute simulated syscalls via terminal:

  ```bash
  read(3, 0x7fff, 1024)
  write(1, buffer, 512)
  getpid()
  ```
* Real-time execution flow:

  * Command echo
  * Execution phase
  * Result output with PID
* Permission enforcement before execution
* Controlled execution (no overlapping calls)
* Realistic delay simulation

---

### ⚙️ Syscall Simulation Engine

* Dynamic syscall handling with:

  * Context-aware arguments
  * Simulated return values
  * PID generation
* Different behaviors per syscall:

  * `read` → returns byte count
  * `write` → returns processed length
  * `getpid` → returns process ID
  * `exit` → returns 0
* Failure simulation (e.g., permission denied)

---

### 📊 Dashboard & Monitoring

* Real-time system metrics:

  * Total syscalls
  * Access denials
  * Active sessions
  * Security alerts
* Activity charts (last 8 hours)
* Live system feed

---

### 📜 Audit Logging System

* Immutable, timestamped logs for every syscall
* Tracks:

  * User
  * Syscall name
  * Arguments
  * PID
  * Status (success/denied)
  * Return value
* Search + filter functionality
* Export logs as **CSV**

---

### 👥 Users & Access Management

* Visual overview of:

  * Users
  * Roles
  * Status
  * Permissions
* Admin-only access control panel

---

### 🛡️ Security Center

* Simulated threat detection:

  * Privilege escalation attempts
  * Unauthorized access
  * Suspicious activity
* Security policies:

  * RBAC
  * MAC (conceptual)
  * Syscall filtering
  * Rate limiting
* Syscall permission matrix (role vs access)

---

### 🔔 UX Enhancements

* Toast notification system
* Terminal auto-scroll
* Execution state control
* Clean OS-style dark UI

---

## 🧪 Demo Credentials

| Role      | Username | Password |
| --------- | -------- | -------- |
| Admin     | root     | admin123 |
| Developer | dev1     | dev123   |
| User      | user1    | pass123  |
| Auditor   | audit    | audit123 |

🔐 MFA: Enter any 6 digits

---

## 🏗️ Project Structure

```
SecureCall-OS/
│
├── index.html     # Main UI structure
├── styles.css     # Styling (dark OS theme)
├── script.js      # Core logic (terminal, RBAC, logs, simulation)
└── README.md
```

---

## ⚡ Usage

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/SecureCall-OS.git
   ```

2. Open the project:

   * Simply open `index.html` in a browser

3. Login using demo credentials and start executing syscalls

---

## 🌐 Deployment (Vercel)

SecureCall OS is fully static and deploys instantly on Vercel:

1. Go to **Vercel Dashboard**
2. Click **Add New → Project**
3. Import your GitHub repo
4. Set framework to **Other**
5. Click **Deploy**

---

## 🎯 What This Project Demonstrates

* Operating System concepts (syscalls, processes)
* Role-Based Access Control (RBAC)
* Audit logging & observability
* Terminal simulation & UI state management
* Frontend system design with real-time behavior

---

## 🚀 Future Enhancements

* Simulated file system (`/etc/passwd`, `/var/log`)
* Advanced syscall chaining
* Intrusion detection simulation
* Real-time multi-user sessions
* Backend integration (Node.js + APIs)

---

## 📌 Author

Built as a hands-on project to simulate **low-level OS behavior in a high-level web environment**.

---

## ⭐ If you like this project

Give it a ⭐ on GitHub — it helps!
