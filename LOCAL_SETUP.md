# Local Environment Setup Guide - New Local AI Mobility Platform

This guide provides instructions on how to install dependencies, configure, and run the **New Local AI Mobility Platform** locally.

---

## 1. Requirements

- **Node.js**: `v25` or higher (verified with `v25.9.0`).
- **npm**: `v11` or higher (verified with `v11.12.1`).
- **MySQL**: Verified using WAMP's local MySQL service (`wampmysqld64`) running on port `3306`.

---

## 2. Installation

Install dependencies for both the frontend and backend:

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## 3. Database Initialization

Follow the instructions in [DATABASE_SETUP.md](file:///d:/New%20Pcs/Grace---Web-ApplicationAI/DATABASE_SETUP.md):
1. Make sure your local MySQL service is running.
2. Create the database `new_ai_cabs_db`.
3. Import the `db_init.sql` schema:
   ```bash
   mysql -u root new_ai_cabs_db < db_init.sql
   ```

---

## 4. Environment Variables

Create `.env` files in both backend and frontend directories as follows:

### Backend (`backend/.env`)
Create `backend/.env` containing:
```ini
API_PROTOCOL=http
API_HOST=localhost
API_PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=new_ai_cabs_db
DB_DIALECT=mysql

JWT_SECRET=new_local_ai_mobility_platform_jwt_secret_key_12345
ACCESS_TOKEN_EXPIRY=3h
```

### Frontend (`frontend/.env`)
Create `frontend/.env` containing:
```ini
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEB_URL=http://localhost:3000
```

---

## 5. Running the Application

Open two terminal windows to run both services:

### Backend
```bash
cd backend
npm run dev
```
The server will start and listen on [http://localhost:5000](http://localhost:5000).

### Frontend
```bash
cd frontend
npm start
```
The client application will start on [http://localhost:3000](http://localhost:3000).

---

## 6. Verification Steps

1. **Verify Backend**: Open [http://localhost:5000/api/config](http://localhost:5000/api/config) or check the terminal output for `Database connected and tables synced.` and `Server running on http://localhost:5000`.
2. **Verify Frontend**: Open [http://localhost:3000](http://localhost:3000) in your web browser.
3. **Verify Authentication**: Try logging in with the default admin credentials:
   - **Email**: `admin@local.platform`
   - **Password**: `admin123`
