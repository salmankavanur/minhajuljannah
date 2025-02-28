
# Photo Frame Campaign

## Project Overview

The **Photo Frame Campaign** is a web application that allows users to generate personalized campaign posters by uploading a photo and entering their name. The application overlays the user's name and photo onto a predefined background image, creating a downloadable poster. An admin panel provides analytics and user management features, allowing administrators to view user data, track campaign metrics, and export data. The project uses a **Preact** frontend with **Vite** as the build tool, a **Node.js/Express** backend, and **MongoDB** for data storage.

### Features
- **Poster Generation:** Users can upload a photo, crop it, enter their name, and generate a personalized poster.
- **Download Option:** Users can download the generated poster as a JPEG image.
- **Admin Panel:** Admins can view all users, see analytics (e.g., total users, active users, social shares), and export data as CSV or JSON.
- **MongoDB Integration:** User data (name, email, device, etc.) and generated poster URLs are stored in MongoDB.

---

## Project Structure

The project is divided into a frontend and backend, with the following structure:

```
Photo-Frame-Campaign/
├── backend/                           # Backend (Node.js/Express)
│   ├── models/                        # MongoDB models
│   │   └── User.js                    # User schema
│   ├── .env                           # Environment variables (e.g., MONGO_URI, PORT)
│   ├── index.js                       # Main backend file (Express server)
│   ├── package.json                   # Backend dependencies
│   └── node_modules/                  # Backend dependencies (after npm install)
├── src/                               # Frontend (Preact/Vite)
│   ├── app.jsx                        # Main app component (poster generator)
│   ├── AdminPanel.jsx                 # Admin panel component
│   ├── main.jsx                       # Entry point for Preact app
│   ├── style.scss                     # Styles for the main app
│   ├── admin-styles.scss              # Styles for the admin panel
│   ├── bg.png                         # Background image for posters
│   └── index.css                      # Global styles
├── public/                            # Static assets
├── index.html                         # Main HTML file
├── package.json                       # Frontend dependencies
├── vite.config.js                     # Vite configuration
└── node_modules/                      # Frontend dependencies (after npm install)
```

---

## Installation and Running Instructions

### Prerequisites
- **Node.js**: Version 18.x or higher (includes npm).
- **MongoDB**: Install MongoDB Community Server locally ([Download](https://www.mongodb.com/try/download/community)) or use MongoDB Atlas.
- **Postman** (optional): For testing API endpoints.
- **MongoDB Compass** (optional): For visualizing MongoDB data.

### Step 1: Clone the Repository
Clone the project to your local machine:

```bash
git clone <repository-url>
cd Photo-Frame-Campaign
```

### Step 2: Set Up the Backend
1. **Navigate to the Backend Directory:**
   ```bash
   cd backend
   ```

2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**
   - Create a `.env` file in the `backend/` directory:
     ```bash
     touch .env
     ```
   - Add the following variables:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/photo_frame_campaign
     ```
   - If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string:
     ```
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/photo_frame_campaign?retryWrites=true&w=majority
     ```

4. **Start the Backend Server:**
   ```bash
   npm start
   ```
   - You should see:
     ```
     Connected to MongoDB
     Server running on port 5000
     ```
   - The backend will be running at `http://localhost:5000`.

### Step 3: Set Up the Frontend
1. **Navigate to the Project Root:**
   ```bash
   cd ..
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```
   - The frontend will be running at `http://localhost:5173`.

### Step 4: Access the Application
- **Main App:** Open `http://localhost:5173/` in your browser to access the poster generator.
- **Admin Panel:** Open `http://localhost:5173/admin` to access the admin panel.
  - Default credentials: Username: `admin`, Password: `password`.

---

## Step-by-Step Guide

### 1. Run MongoDB
- **Local MongoDB:** Start the MongoDB server:
  ```bash
  mongod
  ```
  - Ensure it’s running on `mongodb://localhost:27017`.
- **MongoDB Atlas:** If using Atlas, ensure your IP is whitelisted and you’ve updated the `MONGO_URI` in `backend/.env`.

### 2. Start the Backend
- Follow the backend setup instructions above (`cd backend && npm start`).
- Confirm the backend is running and connected to MongoDB.

### 3. Start the Frontend
- Follow the frontend setup instructions above (`npm run dev`).
- Verify the app loads at `http://localhost:5173/`.

### 4. Generate a Poster
1. **Enter Name:** Input your name (e.g., "Salman").
2. **Upload Photo:** Click "Upload Photo" to select an image.
3. **Crop Image:** Adjust and crop the image in the modal, then click "Apply".
4. **Generate Poster:** The app will overlay your name and photo on the background and display the result.
5. **Download:** Click "Download" to save the poster as a JPEG file.

### 5. View Admin Panel
1. **Access Admin Panel:** Go to `http://localhost:5173/admin`.
2. **Login:** Use `admin`/`password` to log in.
3. **Explore Tabs:**
   - **Dashboard:** View total users, active users, posters created, and social shares.
   - **Users:** See a list of users with details (name, email, device, etc.) and actions (view poster, send email).
   - **Analytics:** View metrics and user growth charts.
   - **Export:** Export user data as CSV or JSON.
   - **Settings:** Update campaign settings (currently client-side).

### 6. Test API with Postman (Optional)
- **POST Request:** Test the `/api/users` endpoint:
  - URL: `http://localhost:5000/api/users`
  - Method: POST
  - Headers: `Content-Type: application/json`
  - Body (raw JSON):
    ```json
    {
      "name": "Test User",
      "email": "test@example.com",
      "created": "2025-02-28T12:00:00Z",
      "location": "Test",
      "device": "Desktop",
      "shared": false,
      "posterUrl": "test-url"
    }
    ```
  - Send the request and confirm a `201 Created` response with the saved user data.

---

## Troubleshooting
- **Backend Doesn’t Start:**
  - Ensure MongoDB is running (`mongod`).
  - Check `MONGO_URI` in `backend/.env` is correct.
  - Run `npm install` in `backend/` if dependencies are missing.

- **Frontend Doesn’t Load:**
  - Run `npm install` in the project root.
  - Ensure `bg.png` is in `src/`.

- **Data Not Saved to MongoDB:**
  - Check console logs for errors like `413 Payload Too Large`.
  - Verify the backend accepts large payloads (`express.json({ limit: '10mb' })` in `backend/index.js`).
  - Confirm CORS is enabled (`app.use(cors({ origin: 'http://localhost:5173' }))`).

- **Admin Panel Shows 0 Users:**
  - Create a photo frame at `http://localhost:5173/` first.
  - Check MongoDB Compass for data in the `users` collection.
  - Verify the backend `/api/users` endpoint returns data (`curl http://localhost:5000/api/users`).

---

## Future Enhancements
- **Image Storage:** Replace base64 storage with file uploads (e.g., AWS S3) to reduce payload size.
- **Authentication:** Add JWT-based authentication for the admin panel.
- **Error Handling:** Show user-friendly error messages in the UI.
- **Advanced Analytics:** Add more charts (e.g., using Chart.js) for user engagement.
- **Deployment:** Deploy the frontend (Vite) to Vercel/Netlify and the backend (Express) to Heroku/Render.

---

## License
This project is for educational purposes and not licensed for commercial use.

---

## Contact
For issues or contributions, reach out to [hello@salmanmp.me].
