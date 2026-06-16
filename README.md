# Real-Time Fullstack Chat Application

This is a modern, real-time chat application built using **React (Vite)** on the frontend and **Node.js (Express) + MongoDB** on the backend. The project supports authenticated user profiles, room creation with short join codes, real-time messaging, typing indicators, file uploads, and admin controls.

---

## 🚀 What I Have Done

I have built the entire application from the ground up, implementing the following core features:

### 1. Secure Authentication Flow (JWT & Google OAuth)
* Implemented credential signup and login with password hashing using **bcrypt**.
* Integrated **Google OAuth 2.0** using Passport.js for seamless single sign-on.
* Implemented a robust **JWT Refresh Token rotation flow**:
  * The backend generates a short-lived Access Token (15 minutes) and a long-lived Refresh Token (7 days) saved in the database.
  * The refresh token is transmitted to the client in a secure, **httpOnly cookie** (`sameSite: 'lax'`) to guard against XSS and CSRF token thefts.
  * Created a custom **Axios interceptor** on the frontend that catches `401/403` token expiration errors, silently requests a new access token, and retries the original request seamlessly.

### 2. Real-Time Interactions (Socket.IO)
* Set up Socket.IO connections to sync chat feeds instantly across all active users.
* Implemented **live typing indicators** that let users see who is currently drafting a message.
* Built **online/offline statuses** that update immediately when users connect, disconnect, join, or leave chat rooms.
* Programmed real-time join/leave system notifications (e.g., `"Hemnath has joined the room"`).

### 3. Room Management & Moderation
* Created a room setup allowing users to create custom chats or join existing ones using 6-character unique alphanumeric codes (e.g., `5UUQ16`).
* Programmed **Admin Moderation Controls**:
  * The creator of a room gets a crown badge (`👑 Admin`) and exclusive access to member removal options (`✕`).
  * When an admin removes a member, a real-time socket event (`you_were_removed`) is emitted, instantly alerting the target user and redirecting them back to the Home page.

### 4. File Sharing & Download Proxy
* Built file/image sharing into the chat stream.
* Integrated **Multer** and **Cloudinary** on the backend to handle uploading files and raw documents.
* Set up a backend proxy route `/room/download` to securely redirect and stream file downloads from Cloudinary with proper attachments headers.

---

## 🧠 What I Have Learned

During this project, I gained deep experience in modern fullstack web development:

* **Secure JWT Storage Patterns**: Learned that access tokens are best stored in memory/localStorage, while refresh tokens should reside in secure, HTTP-only cookies to prevent unauthorized access via malicious client scripts.
* **Axios Request & Response Interceptors**: Learned how to construct wrappers that handle token headers and retry failed queries automatically.
* **WebSocket Lifecycle & Namespace Rooms**: Learned how to join sockets to specific rooms, handle events broadcast cleanly, and clean up socket listeners (`socket.off()`) to prevent browser memory leaks.
* **Mongoose Document Populating**: Learned how to design database schemas with references and use `.populate()` to fetch sender information on messages and rooms.
* **Cloud Storage & CDN Handling**: Integrated Cloudinary API to write files dynamically and unlink local storage files securely after uploading.
* **Clean Git Workflows**: Mastered root and subdirectory `.gitignore` patterns. Understood why build outputs (`dist/`) and credential configurations (`.env`) must be ignored, while package dependency manifests (`package.json`) must be checked in.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), React Router, Axios, Socket.IO Client, Bootstrap, CSS.
* **Backend**: Node.js, Express, Socket.IO, MongoDB Atlas (Mongoose), Passport.js, JSON Web Tokens, Multer, Cloudinary.
