# TheEace Login Portal

A dashboard application with user management, statistics, and content management features.

## Features

- User authentication
- Dashboard with real-time statistics
- Email marketing tracking
- Logo preference management
- Website configuration tools
- Instagram marketing metrics
- Upcoming meetings management

## Technology Stack

- Node.js
- Express
- Vanilla JavaScript (Frontend)
- File-based data storage

## Deployment

This application can be deployed on Render or any Node.js hosting service.

## Getting Started

```
npm install
npm start
```

The application will run on port 5000 by default, or the port specified in the PORT environment variable.

## CSV Format

The bulk import feature accepts CSV files in the following format:
```csv
username,userId,passkey
user1,12345,password1
user2,67890,password2
```

## File Structure

- `server.js`: Main server file
- `admin.html`: Admin portal interface
- `admin.js`: Admin functionality
- `script.js`: Login functionality
- `styles.css`: Styling
- `users.json`: User database 