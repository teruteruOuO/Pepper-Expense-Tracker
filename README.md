# Project4375
Fullstack application for CIS 4375

# Warning
Ensure you're always making a Private Branch first before starting on a feature.

# Requirements to Run the Application
Must have the following: 
- VSCode
- MySQL Community Edition
- NodeJS
- Git Installed

# Installing dependencies
1. Must have NodeJS installed.
2. Open VSCode.
3. Press CTRL + SHIFT + ` and VSCode terminal should open beneath the screen.
4. Ensure you're in the root folder (Terminal must say something like " C:\Something\Something\Project4375> ").
5. Run the command "npm run backend-install" to install backend folder's dependencies.
6. Kill the terminal where you ran this command by clicking the trash button on the bottom right.
7. Redo Step 3.
8. Run the command "npm run frontend-install" to install frontend folder's dependencies.
9. Redo Step 6

# Running both Frontend (Development) and Backend
1. Press CTRL + SHIFT + ` and VSCode terminal should open beneath the screen.
2. Run the command "npm run backend" to begin the backend server's operation.
3. Redo Step 1.
4. Run the command "npm run frontend-dev" to begin the frontend server's operation. A link should be revealed in the VSCode terminal.

# Running both Frontend (Production Preview) and Backend
1. Press CTRL + SHIFT + ` and VSCode terminal should open beneath the screen.
2. Run the command "npm run backend" to begin the backend server's operation.
3. Redo Step 1.
4. Run the command "npm run frontend-build" to make a dist folder.
5. Run the command "npm run frontend-prod" to begin the frontend server's operation. A link should be revealed in the VSCode terminal.

# Testing changes 
- Ensure each file is saved (CTRL + S) before checking/testing them.
- Frontend: Simply refresh the webpage. If you still don't see the changes, kill the terminal associated with the frontend, then rerun frontend.
- Backend: Must kill the terminal associated with the backend, then rerun backend.

# Environmental Files
- Backend .env
    -   Create a ".env" file within the backend folder and copy these variables (Omit quotations)
    "# Backend Variables
    COOKIE_SECRET=56af22d41db2f7264a7b555c79caf340291ed69e549a8fb50472fa49a2451ee5
    JWT_SECRET=6c6073f9bc392245d7d6b45773ed4a7cfd436095023cf9716bfc0ad6dd3a4772
    APP_PORT=6056
    NODE_ENV=development
    SERVER_URL=http://localhost:

    DB_HOST=cis4375group8.cjywf3tcjcrp.us-east-1.rds.amazonaws.com
    DB_PORT=3306
    DB_USER=admin
    DB_PASSWORD=admingroup8
    DB_NAME=cis4375db

    FRONTEND_URL=http://localhost:4000

    NODEMAILER_EMAIL=project4375team8@gmail.com
    NODEMAILER_PASSWORD=bclp jlay hruz jcks"

- Frontend .env
    -   Create a ".env" file within the frontend folder and copy these variables (Omit quotations)
    "# Backend URL
    VITE_BACKEND_URL=http://localhost:6056
    VITE_NODE_ENV=development

    VITE_FRONTEND_PORT=4000"
