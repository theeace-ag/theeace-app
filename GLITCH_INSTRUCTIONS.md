# Deploying TheEace Login Portal to Glitch.com

Glitch.com is the easiest way to deploy your app without a credit card. This guide walks you through the process.

## Step 1: Create a Glitch Account

1. Go to [Glitch.com](https://glitch.com)
2. Sign up for an account (can use GitHub, Google, or email)

## Step 2: Create a New Project

1. Click the "New Project" button
2. Select "Import from GitHub" 
   (If you don't have the code on GitHub, select "glitch-hello-node" and you'll replace the files)

## Step 3: Add Your Files

If importing from GitHub:
1. Enter your repository URL
2. Glitch will import your code

If uploading manually:
1. In the Glitch editor, delete the default files
2. Click "Assets" → "Upload"
3. Upload a zip file containing all your project files
4. Or create and edit each file individually

## Step 4: Set Up Your Project

1. Make sure your `package.json` has the correct start script:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

2. Create a `.env` file for environment variables:
   ```
   PORT=3000
   # Add any other environment variables your app needs
   ```

3. Update volume paths in `server.js`:
   ```javascript
   // Change this:
   const dataDir = path.join(__dirname, 'data');
   
   // To this (for Glitch persistence):
   const dataDir = path.join(__dirname, '.data');
   ```

## Step 5: Run Your Application

1. Wait for Glitch to automatically install dependencies
2. Your app will automatically start running
3. Click "Show" → "Next to the code" or "In a new window" to see your app

## Step 6: Make Your App Persistent (Optional)

By default, Glitch projects sleep after 5 minutes of inactivity. To keep it awake:

1. Install the Uptimerobot service:
   - Create a free account at [Uptimerobot.com](https://uptimerobot.com)
   - Create a new monitor
   - Set type to "HTTP(S)"
   - Enter your Glitch app URL (e.g., https://your-project.glitch.me)
   - Set checking interval to 5 minutes
   - Save the monitor

## Step 7: Set Up Custom Domain (Optional)

1. In your Glitch project, click "Settings"
2. Scroll to "Custom Domain"
3. Follow the instructions to connect your domain

## Important Glitch Limitations

- **Sleep:** Projects go to sleep after 5 minutes of inactivity
- **Runtime:** 1000 hours/month (projects sleep when not in use)
- **Storage:** 200MB total storage
- **Memory:** 512MB RAM
- **CPU:** Limited CPU allocation

## Data Persistence Tips

Glitch provides persistent storage in the `.data` folder. Make sure your app uses this location:

```javascript
// In your server.js file
const dataStoragePath = path.join(__dirname, '.data');

// Ensure it exists
if (!fs.existsSync(dataStoragePath)) {
  fs.mkdirSync(dataStoragePath, { recursive: true });
}

// Use this path for all data files
const usersFilePath = path.join(dataStoragePath, 'users.json');
```

## Troubleshooting

- **App Crashes:** Check the logs in Glitch's console
- **Missing Dependencies:** Verify all dependencies are in package.json
- **App Sleeping:** Use Uptimerobot to ping your app regularly

## Refreshing Your App

If you need to restart your app:
1. Open the Glitch Terminal (Tools → Terminal)
2. Type `refresh` and press Enter 