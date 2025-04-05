# Fly.io Deployment Guide for TheEace Login Portal

This guide walks you through deploying your TheEace Login Portal to Fly.io, which offers reliable free hosting with no cold starts.

## Prerequisites

1. A Fly.io account (create one at [fly.io](https://fly.io))
2. Fly CLI installed on your computer
3. Credit card for verification (won't be charged for free tier usage)

## Step 1: Install Fly CLI

### On Windows:
```
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### On Mac:
```
curl -L https://fly.io/install.sh | sh
```

### On Linux:
```
curl -L https://fly.io/install.sh | sh
```

## Step 2: Log in to Fly.io

```
fly auth login
```

This will open a browser window where you can log in or create an account.

## Step 3: Launch Your App

Navigate to your project directory and run:

```
fly launch
```

When prompted:
- Choose a unique app name or accept the generated one
- Select a region close to your users
- Say "yes" to setting up a Postgres database if you want one (optional)
- Say "yes" to setting up an Upstash Redis database if you want one (optional)
- Say "no" to deploying now - we need to create a volume first

## Step 4: Create a Volume for Data Persistence

Create a volume to store your application data:

```
fly volumes create theeace_data --size 1 --region <your-selected-region>
```

Replace `<your-selected-region>` with the region you selected during launch.

## Step 5: Deploy Your App

Now deploy your application:

```
fly deploy
```

This will build and deploy your application to Fly.io.

## Step 6: Open Your App

Once deployment is complete, open your app in a browser:

```
fly open
```

## Maintenance and Operations

### View application logs:
```
fly logs
```

### SSH into your app:
```
fly ssh console
```

### Scale your app (if needed):
```
fly scale count 2
```

### Update your app after changes:
```
fly deploy
```

## Setting Up Custom Domain (Optional)

1. Register your domain at a domain registrar
2. Run:
   ```
   fly certs create yourdomain.com
   ```
3. Follow the DNS instructions provided by Fly.io
4. Wait for certificate issuance (may take a few minutes)

## Free Tier Limitations

- 3 shared-cpu-1x 256MB VM instances
- 3GB persistent volume storage
- 160GB outbound data transfer

## Troubleshooting

- If deployment fails, check the logs with `fly logs`
- If your app crashes, you can see the crash logs with `fly logs`
- If you need to restart your app, use `fly apps restart`

For more detailed information, refer to the [Fly.io documentation](https://fly.io/docs/). 