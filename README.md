# 📘 Team Collaboration Backend

A production‑grade backend for a team collaboration platform, featuring authentication, role‑based permissions, team management, invitations, activity logs, and customizable team settings.  
Built with **Node.js**, **Express**, and **MongoDB**.

---

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication  
- Protected routes  
- Role-based access control (Owner, Admin, Member)  
- Secure permission middleware  

### 👥 Team Management
- Create teams  
- Add/remove members  
- Transfer ownership  
- Promote/demote admins  
- Fetch teams for logged-in user  

### ✉️ Invite System
- Send team invites (owner/admin only)  
- Accept invites  
- Decline invites  
- Cancel invites  
- List pending invites  
- List invites for logged-in user  
- Activity logs for all invite actions  

### 📜 Activity Logs (Audit System)
- Logs every important action:
  - CREATE_TEAM  
  - ADD_MEMBER  
  - REMOVE_MEMBER  
  - TRANSFER_OWNERSHIP  
  - PROMOTE_ADMIN  
  - DEMOTE_ADMIN  
  - DELETE_TEAM  
  - SEND_INVITE  
  - ACCEPT_INVITE  
  - DECLINE_INVITE  
  - CANCEL_INVITE  
  - UPDATE_SETTINGS  
- Filter logs by:
  - action  
  - user  
  - date range  
- Pagination support  
- Owner/admin-only access  

### ⚙️ Team Settings
- Update team description  
- Set team avatar  
- Public/private visibility  
- Add tags  
- Fetch team settings  
- Activity logs for changes  

---

## 🗂️ Project Structure

