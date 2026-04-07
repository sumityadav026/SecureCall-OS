# SecureCall OS

SecureCall OS is a web-based simulation of a secure kernel system call interface. It provides a highly visual dashboard for monitoring system calls, a terminal interface for executing simulated syscalls, detailed audit logs, and access management features with role-based access control (RBAC).

## Features

- **System Access Portal**: Authentication system supporting multiple roles (Admin, Developer, Standard User, Auditor) and simulated Two-Factor Authentication (MFA).
- **Dashboard Overview**: Real-time statistics tracking total syscalls, access denials, active sessions, and security alerts using interactive charts.
- **System Call Interface**: A built-in terminal simulating a kernel interface to execute system calls (e.g., `read`, `write`, `exec`) directly from the browser payload parameters.
- **Audit Logs**: An immutable, timestamped history of system call activities and their statuses.
- **Users & Access**: View system users, active statuses, roles, and privileges visually.
- **Security Control**: Comprehensive view of identified threat telemetry and configurable access control policies.

## Usage

1. Clone or download the repository to your local machine.
2. Open `index.html` in any modern web browser.
3. Access the portal using the demo credentials provided on the login screen:
   - Admin: `root` / `admin123`
   - Developer: `dev1` / `dev123`
   - User: `user1` / `pass123`
   - MFA Prompt: Enter any 6 digits

## Project Structure

- `index.html`: Core HTML structure rendering the application UI elements.
- `styles.css`: The custom styling layout to provide a sleek, dark-themed OS aesthetic.
- `script.js`: The underlying frontend logic powering the dashboards, terminal operations, state management, and simulated telemetry data.
