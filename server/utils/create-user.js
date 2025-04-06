const fs = require('fs');
const path = require('path');

// Detect if running on Glitch
const isGlitch = process.env.PROJECT_DOMAIN !== undefined;
const dataDir = isGlitch ? path.join(__dirname, '.data') : path.join(__dirname, 'data');

// File paths
const usersFilePath = path.join(dataDir, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create a default user
const defaultUser = {
    username: "admin",
    userId: "admin1",
    passkey: "admin123",
    createdAt: new Date().toISOString(),
    lastLogin: null
};

// Read existing users or create empty array
let users = [];
try {
    if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(data);
        console.log(`Found ${users.length} existing users`);
    }
} catch (error) {
    console.error('Error reading users file:', error);
    // Continue with empty users array
}

// Check if admin user already exists
const adminExists = users.some(user => 
    user.username === defaultUser.username || 
    user.userId === defaultUser.userId
);

if (adminExists) {
    console.log('Admin user already exists, skipping creation');
} else {
    // Add admin user
    users.push(defaultUser);
    
    // Write updated users array
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error writing users file:', error);
        process.exit(1);
    }
}

// Create email stats for the default user
const emailStatsDir = path.join(dataDir, 'email-stats');
if (!fs.existsSync(emailStatsDir)) {
    fs.mkdirSync(emailStatsDir, { recursive: true });
}

const statsFilePath = path.join(emailStatsDir, `${defaultUser.userId}.json`);
const defaultStats = {
    sent: 100,
    total: 500,
    lastUpdated: new Date().toISOString()
};

if (!fs.existsSync(statsFilePath)) {
    try {
        fs.writeFileSync(statsFilePath, JSON.stringify(defaultStats, null, 2));
        console.log(`Created default email stats for user ${defaultUser.userId}`);
    } catch (error) {
        console.error('Error creating email stats:', error);
    }
}

// Create metrics for the default user
const metricsDir = path.join(dataDir, 'metrics');
if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
}

const metricsFilePath = path.join(metricsDir, `${defaultUser.userId}.json`);
const defaultMetrics = {
    leads: 50,
    revenue: 10000,
    customers: 25,
    lastUpdated: new Date().toISOString()
};

if (!fs.existsSync(metricsFilePath)) {
    try {
        fs.writeFileSync(metricsFilePath, JSON.stringify(defaultMetrics, null, 2));
        console.log(`Created default metrics for user ${defaultUser.userId}`);
    } catch (error) {
        console.error('Error creating metrics:', error);
    }
}

// Create instagram marketing data for the default user
const instagramDir = path.join(dataDir, 'instagram-marketing');
if (!fs.existsSync(instagramDir)) {
    fs.mkdirSync(instagramDir, { recursive: true });
}

const instagramFilePath = path.join(instagramDir, `${defaultUser.userId}.json`);
const defaultInstagram = {
    accountsReached: 2500,
    leadsConverted: 75,
    niche: "Technology",
    lastUpdated: new Date().toISOString()
};

if (!fs.existsSync(instagramFilePath)) {
    try {
        fs.writeFileSync(instagramFilePath, JSON.stringify(defaultInstagram, null, 2));
        console.log(`Created default Instagram marketing data for user ${defaultUser.userId}`);
    } catch (error) {
        console.error('Error creating Instagram marketing data:', error);
    }
}

console.log('User setup complete. You can now login with:');
console.log('Username: admin');
console.log('User ID: admin1');
console.log('Passkey: admin123'); 