# TheEace Login Portal

A Node.js application for managing user authentication and dashboard functionality.

## Features

- User authentication
- Dashboard with color scheme management
- Email functionality
- Meeting scheduling
- Website configuration

## Deployment Instructions

### Prerequisites
- Node.js >= 14.0.0
- npm (Node Package Manager)

### Local Development
1. Clone the repository
```bash
git clone https://github.com/theeace-ag/theeace-app.git
cd theeace-app
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
PORT=5000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
MONGODB_URI=your-mongodb-uri
```

4. Start the development server
```bash
npm run dev
```

### Deployment on Render.com
1. Create an account on [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service with these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add the same variables as in `.env`
4. Deploy!

## Technology Stack

- Node.js
- Express
- Vanilla JavaScript (Frontend)
- File-based data storage

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