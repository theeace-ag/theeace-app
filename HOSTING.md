# Self-Hosting Guide for TheEace Login Portal

This guide will help you set up your TheEace Login Portal on your own computer and connect it to your domain so it's accessible 24/7 on the internet.

## Prerequisites

1. A computer that can stay on 24/7
2. Your own domain (from any registrar like GoDaddy, Namecheap, etc.)
3. Access to your home router for port forwarding
4. Node.js installed on your computer

## Step 1: Set Up Dynamic DNS

Since most home internet connections have changing IP addresses, you need a Dynamic DNS service:

1. Create a free account with [No-IP](https://www.noip.com/), [DynDNS](https://account.dyn.com/), or [Duck DNS](https://www.duckdns.org/)
2. Set up a hostname (e.g., yourname.ddns.net)
3. Download and install their client application on your PC
4. Configure it to automatically update your IP address

## Step 2: Configure Port Forwarding

1. Find your router's IP address (usually 192.168.0.1 or 192.168.1.1)
2. Log in to your router's admin panel
3. Navigate to Port Forwarding settings
4. Create a new rule:
   - External Port: 80 (HTTP) and 443 (HTTPS)
   - Internal IP: Your PC's local IP address (from `ipconfig` command)
   - Internal Port: 5000 (or whatever port your server uses)
   - Protocol: TCP or Both

## Step 3: Connect Your Domain to Your Dynamic DNS

1. Log in to your domain registrar's website
2. Find DNS management or nameserver settings
3. Add a CNAME record:
   - Host: @ or www (for root domain or www subdomain)
   - Points to: Your dynamic DNS hostname (e.g., yourname.ddns.net)
   - TTL: 3600 (1 hour) or lower

## Step 4: Install as a Windows Service

To make your application run 24/7 and start automatically with Windows:

1. Install the required package:
   ```
   npm install
   ```

2. Run the service installer:
   ```
   npm run install-service
   ```

3. The service will install and start automatically

## Step 5: SSL Certificate (Optional but Recommended)

For HTTPS (secure connection):

1. Install [Certify The Web](https://certifytheweb.com/) (free for personal use)
2. Create a new certificate for your domain
3. Set the website path to your application folder
4. Configure it to use port 5000

## Troubleshooting

- **Can't access your site from the internet**: Check port forwarding, firewall settings, and make sure your dynamic DNS is updating correctly
- **Service crashes**: Check Windows Event Viewer for error logs
- **Domain not resolving**: DNS changes can take up to 24-48 hours to propagate

## Maintaining Your Server

1. Back up the `data` folder regularly
2. Install Windows updates during off-peak hours
3. Consider setting up UPS (Uninterruptible Power Supply) to protect against power outages 