# TheEace Login Portal

A login portal with dashboard and user management features.

## Features

- User login and authentication
- Interactive dashboard
- User content management
- Real-time data synchronization
- Email marketing tools
- Instagram marketing metrics
- Website configuration tools
- Logo preference management

## Real-Time Updates

This application now supports real-time data synchronization between different users and devices. When changes are made on one device, they're automatically reflected on all other connected devices without requiring a page refresh.

Real-time updates include:
- New user creation
- Email marketing stats updates
- Instagram marketing metrics changes
- Website configuration changes
- Logo preference updates

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
   
## Deployment

This application can be deployed to various platforms:

- **Local deployment**: Run `npm start` to start the server locally
- **Glitch.com**: See [GLITCH_INSTRUCTIONS.md](GLITCH_INSTRUCTIONS.md) for detailed steps
- **Fly.io**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed steps

For more deployment options without requiring a credit card, see [DEPLOYMENT_ALTERNATIVE.md](DEPLOYMENT_ALTERNATIVE.md).

## Default Login

After installation, you can use these credentials to log in:
- Username: admin
- User ID: admin1
- Passkey: admin123

Or create a new user through the registration page.

## Troubleshooting

If users or data aren't showing up properly:

1. Run the diagnostics script:
   ```
   node debug-data-paths.js
   ```

2. Create a default admin user with sample data:
   ```
   node create-user.js
   ```

3. Restart the server:
   ```
   node server.js
   ```

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