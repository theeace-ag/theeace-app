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

## File Structure

The project is organized into the following structure:

```
theeace-login-portal/
│
├── public/                # Static client-side files
│   ├── css/               # CSS stylesheets
│   ├── js/                # Client-side JavaScript
│   ├── views/             # HTML files
│   └── img/               # Images folder
│
├── server/                # Server-side code
│   ├── config/            # Configuration files
│   ├── data/              # Data storage (auto-created)
│   ├── routes/            # API routes in future
│   └── utils/             # Utility functions
│
├── docs/                  # Documentation
│
├── .dockerignore          # Docker ignore file
├── .gitignore             # Git ignore file
├── fly.toml               # Fly.io configuration
├── package.json           # NPM package config
├── package-lock.json      # NPM dependencies lockfile
├── README.md              # Project README
└── server.js              # Main server entry point
```

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
- **Glitch.com**: See [docs/GLITCH_INSTRUCTIONS.md](docs/GLITCH_INSTRUCTIONS.md) for detailed steps
- **Fly.io**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed steps

For more deployment options without requiring a credit card, see [docs/DEPLOYMENT_ALTERNATIVE.md](docs/DEPLOYMENT_ALTERNATIVE.md).

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
   node server/utils/debug-data-paths.js
   ```

2. Create a default admin user with sample data:
   ```
   node server/utils/create-user.js
   ```

3. Restart the server:
   ```
   npm start
   ```

## CSV Format

The bulk import feature accepts CSV files in the following format:
```csv
username,userId,passkey
user1,12345,password1
user2,67890,password2
``` 