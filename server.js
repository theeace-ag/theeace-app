const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');
const { parse } = require('csv-parse');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '.')));

// Update all file paths to work with both local and Glitch environments
const isGlitch = process.env.PROJECT_DOMAIN !== undefined;
const dataDir = isGlitch ? path.join(__dirname, '.data') : path.join(__dirname, 'data');

// Define file paths
const usersFilePath = path.join(dataDir, 'users.json');
const widgetsFilePath = path.join(dataDir, 'widgets.json');
const contentFilePath = path.join(dataDir, 'content.json');
const metricsFilePath = path.join(dataDir, 'metrics.json');
const historicalFilePath = path.join(dataDir, 'historical.json');

// Middleware
app.use(express.static(path.join(__dirname, '.')));

// Create necessary directories if they don't exist
const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(dataDir, 'email-stats'),
    path.join(dataDir, 'metrics'),
    path.join(dataDir, 'historical')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialize data files if they don't exist
const dataFiles = {
    'users.json': [],
    'widgets.json': {},
    'content.json': {},
    'metrics.json': {},
    'historical.json': {},
    'email-suggestions.json': []
};

Object.entries(dataFiles).forEach(([file, defaultContent]) => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
});

// Add error logging middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
});

// Global state
let users = [];
let metrics = {};
let historicalData = {};
let emailStats = {};
let suggestions = [];
let websiteConfigs = {};
let logoPreferences = {};
let logoNotes = {};
let websiteQueries = {};
let meetings = {}; // Storage for upcoming meetings data
let instagramData = {};

// Helper function to read users with better error handling
function readUsers() {
    try {
        console.log(`Reading users from: ${usersFilePath}`);
        if (!fs.existsSync(usersFilePath)) {
            console.log('Users file does not exist, creating empty file');
            writeUsers([]);
            return [];
        }
        
        const data = fs.readFileSync(usersFilePath, 'utf8');
        console.log(`Users data read: ${data}`);
        
        if (!data || data.trim() === '') {
            console.log('Users file is empty, returning empty array');
            return [];
        }
        
        const users = JSON.parse(data);
        console.log(`Parsed ${users.length} users`);
        return users;
    } catch (error) {
        console.error('Error reading users:', error);
        // If there's a JSON parse error, the file might be corrupted
        if (error instanceof SyntaxError) {
            console.log('Users file appears to be corrupted, creating a backup and new file');
            try {
                // Create a backup of the corrupted file
                if (fs.existsSync(usersFilePath)) {
                    const backupPath = `${usersFilePath}.bak.${Date.now()}`;
                    fs.copyFileSync(usersFilePath, backupPath);
                    console.log(`Backup created at ${backupPath}`);
                    
                    // Create a new empty users file
                    writeUsers([]);
                }
            } catch (backupError) {
                console.error('Error creating backup:', backupError);
            }
        }
        return [];
    }
}

// Helper function to write users with better error handling
function writeUsers(users) {
    try {
        console.log(`Writing ${users.length} users to ${usersFilePath}`);
        // Ensure the directory exists
        const dir = path.dirname(usersFilePath);
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const data = JSON.stringify(users, null, 2);
        fs.writeFileSync(usersFilePath, data, 'utf8');
        console.log('Users written successfully');
        
        // Verify the file was written correctly
        if (fs.existsSync(usersFilePath)) {
            const stat = fs.statSync(usersFilePath);
            console.log(`File size: ${stat.size} bytes`);
        }
        
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        throw error;
    }
}

// Helper functions for dashboard data
function readWidgets() {
    try {
        const data = fs.readFileSync(widgetsFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading widgets:', error);
        return {};
    }
}

function writeWidgets(widgets) {
    try {
        fs.writeFileSync(widgetsFilePath, JSON.stringify(widgets, null, 2));
    } catch (error) {
        console.error('Error writing widgets:', error);
        throw error;
    }
}

function readContent() {
    try {
        const data = fs.readFileSync(contentFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading content:', error);
        return {};
    }
}

function writeContent(content) {
    try {
        fs.writeFileSync(contentFilePath, JSON.stringify(content, null, 2));
    } catch (error) {
        console.error('Error writing content:', error);
        throw error;
    }
}

// Helper functions for metrics and historical data
function readMetrics() {
    try {
        const data = fs.readFileSync(metricsFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading metrics:', error);
        return {};
    }
}

function writeMetrics(metrics) {
    try {
        fs.writeFileSync(metricsFilePath, JSON.stringify(metrics, null, 2));
    } catch (error) {
        console.error('Error writing metrics:', error);
        throw error;
    }
}

function readHistorical() {
    try {
        const data = fs.readFileSync(historicalFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading historical data:', error);
        return {};
    }
}

function writeHistorical(historical) {
    try {
        fs.writeFileSync(historicalFilePath, JSON.stringify(historical, null, 2));
    } catch (error) {
        console.error('Error writing historical data:', error);
        throw error;
    }
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-specific-password'
    }
});

// Helper function to send email
async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to,
            subject,
            text
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Get all users
app.get('/api/users', (req, res) => {
    try {
        console.log('GET /api/users - Fetching all users');
        const users = readUsers();
        console.log('Users found:', users.length);
        console.log('User data:', JSON.stringify(users, null, 2));
        res.json(users);
    } catch (error) {
        console.error('Error in GET /api/users:', error);
        res.status(500).json({ 
            message: 'Error reading users',
            error: error.message 
        });
    }
});

// Add single user with enhanced debugging
app.post('/api/users', (req, res) => {
    try {
        console.log('Received user data:', JSON.stringify(req.body));
        const { username, userId, passkey } = req.body;
        
        // Validate input
        if (!username || !userId || !passkey) {
            console.log('Missing fields:', { username, userId, passkey });
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        console.log('Reading existing users');
        const users = readUsers();
        console.log(`Found ${users.length} existing users`);
        
        // Check if user already exists
        if (users.some(u => u.username === username || u.userId === userId)) {
            console.log('User already exists:', username);
            return res.status(400).json({ message: 'Username or User ID already exists' });
        }
        
        // Add new user
        const newUser = {
            username,
            userId,
            passkey,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        console.log('Adding new user:', newUser);
        users.push(newUser);
        
        console.log('Writing updated users list');
        writeUsers(users);
        console.log('User added successfully:', username);
        
        // Create default stats and metrics for the new user
        try {
            // Create email stats
            const emailStatsDir = path.join(dataDir, 'email-stats');
            const statsFilePath = path.join(emailStatsDir, `${userId}.json`);
            if (!fs.existsSync(emailStatsDir)) {
                fs.mkdirSync(emailStatsDir, { recursive: true });
            }
            if (!fs.existsSync(statsFilePath)) {
                const defaultStats = { sent: 0, total: 0, lastUpdated: new Date().toISOString() };
                fs.writeFileSync(statsFilePath, JSON.stringify(defaultStats, null, 2));
                console.log(`Created default email stats for user ${userId}`);
            }
            
            // Create metrics
            const metricsDir = path.join(dataDir, 'metrics');
            const metricsFilePath = path.join(metricsDir, `${userId}.json`);
            if (!fs.existsSync(metricsDir)) {
                fs.mkdirSync(metricsDir, { recursive: true });
            }
            if (!fs.existsSync(metricsFilePath)) {
                const defaultMetrics = { leads: 0, revenue: 0, customers: 0, lastUpdated: new Date().toISOString() };
                fs.writeFileSync(metricsFilePath, JSON.stringify(defaultMetrics, null, 2));
                console.log(`Created default metrics for user ${userId}`);
            }
        } catch (initError) {
            console.error('Error creating user data files:', initError);
            // We'll still return success since the user was created, but log the error
        }
        
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Error adding user', error: error.message });
    }
});

// Bulk import users via CSV
app.post('/api/users/bulk-import', upload.single('csv'), (req, res) => {
    console.log('Starting CSV import');
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log('File received:', req.file);
    const results = [];
    const users = readUsers();
    
    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (row) => {
            try {
                console.log('Processing row:', row);
                // Validate row data
                if (!row.username || !row.userId || !row.passkey) {
                    console.log('Missing fields in row:', row);
                    results.push({
                        success: false,
                        username: row.username,
                        error: 'Missing required fields'
                    });
                    return;
                }
                
                // Check for duplicates
                if (users.some(u => u.username === row.username || u.userId === row.userId)) {
                    console.log('Duplicate user found:', row.username);
                    results.push({
                        success: false,
                        username: row.username,
                        error: 'Username or User ID already exists'
                    });
                    return;
                }
                
                // Add new user
                const newUser = {
                    username: row.username,
                    userId: row.userId,
                    passkey: row.passkey,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                };
                
                users.push(newUser);
                console.log('User added from CSV:', row.username);
                results.push({
                    success: true,
                    username: row.username
                });
            } catch (error) {
                console.error('Error processing row:', error);
                results.push({
                    success: false,
                    username: row.username,
                    error: 'Invalid data format'
                });
            }
        })
        .on('end', () => {
            try {
                // Save all valid users
                writeUsers(users);
                console.log('CSV import completed. Results:', results);
                
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                
                res.json({
                    message: 'Import completed',
                    results
                });
            } catch (error) {
                console.error('Error finalizing import:', error);
                res.status(500).json({
                    message: 'Error saving imported users',
                    error: error.message
                });
            }
        })
        .on('error', (error) => {
            console.error('CSV parsing error:', error);
            res.status(500).json({
                message: 'Error processing CSV file',
                error: error.message
            });
        });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    try {
        const { username, userId, passkey } = req.body;
        const users = readUsers();
        
        const user = users.find(u => 
            u.username === username && 
            u.userId === userId && 
            u.passkey === passkey
        );
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        writeUsers(users);
        
        res.json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ message: 'Error during login' });
    }
});

// Logout and delete cookies endpoint
app.get('/deleteCookiesAndLogout', (req, res) => {
    // Clear cookies by setting them to expire
    res.clearCookie('loggedInUser');
    
    // Send response with script to clear local storage and redirect
    res.send(`
        <script>
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        </script>
    `);
});

// Get user's widgets
app.get('/api/dashboard/widgets/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const widgets = readWidgets();
        res.json(widgets[userId] || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching widgets' });
    }
});

// Add widget for user
app.post('/api/dashboard/widgets/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const widgets = readWidgets();
        if (!widgets[userId]) {
            widgets[userId] = [];
        }

        const newWidget = {
            id: Date.now().toString(),
            title,
            content,
            createdAt: new Date().toISOString()
        };

        widgets[userId].push(newWidget);
        writeWidgets(widgets);

        res.status(201).json(newWidget);
    } catch (error) {
        res.status(500).json({ message: 'Error adding widget' });
    }
});

// Delete widget
app.delete('/api/dashboard/widgets/:userId/:widgetId', (req, res) => {
    try {
        const { userId, widgetId } = req.params;
        const widgets = readWidgets();

        if (!widgets[userId]) {
            return res.status(404).json({ message: 'User not found' });
        }

        const widgetIndex = widgets[userId].findIndex(w => w.id === widgetId);
        if (widgetIndex === -1) {
            return res.status(404).json({ message: 'Widget not found' });
        }

        widgets[userId].splice(widgetIndex, 1);
        writeWidgets(widgets);

        res.json({ message: 'Widget deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting widget' });
    }
});

// Get user's custom content
app.get('/api/dashboard/content/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const content = readContent();
        res.json({ html: content[userId] || '' });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching content' });
    }
});

// Save user's custom content
app.post('/api/dashboard/content/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { html } = req.body;

        if (html === undefined) {
            return res.status(400).json({ message: 'HTML content is required' });
        }

        const content = readContent();
        content[userId] = html;
        writeContent(content);

        res.json({ message: 'Content saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving content' });
    }
});

// Get user metrics
app.get('/api/dashboard/metrics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const metricsPath = path.join(dataDir, 'metrics', `${userId}.json`);
        
        if (!fs.existsSync(metricsPath)) {
            // Initialize with default metrics if file doesn't exist
            const defaultMetrics = {
                sessions: { value: 0, change: 0, lastUpdated: new Date().toISOString() },
                total_sales: { value: 0, change: 0, lastUpdated: new Date().toISOString() },
                orders: { value: 0, change: 0, lastUpdated: new Date().toISOString() },
                conversion_rate: { value: 0, change: 0, lastUpdated: new Date().toISOString() }
            };
            fs.writeFileSync(metricsPath, JSON.stringify(defaultMetrics, null, 2));
            return res.json(defaultMetrics);
        }
        
        const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Update user metrics
app.post('/api/dashboard/metrics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { metric, value, change } = req.body;
        
        if (!metric || value === undefined || change === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const metricsPath = path.join(dataDir, 'metrics', `${userId}.json`);
        let metrics = {};
        
        if (fs.existsSync(metricsPath)) {
            metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        }
        
        metrics[metric] = {
            value: Number(value),
            change: Number(change),
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
        res.json({ success: true, metrics });
    } catch (error) {
        console.error('Error updating metrics:', error);
        res.status(500).json({ error: 'Failed to update metrics' });
    }
});

// Get historical data
app.get('/api/dashboard/historical/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const historicalDataPath = path.join(dataDir, 'historical', `${userId}.json`);
        
        if (!fs.existsSync(historicalDataPath)) {
            // If no historical data exists, return empty array
            return res.json([]);
        }
        
        const historicalData = JSON.parse(fs.readFileSync(historicalDataPath, 'utf8'));
        res.json(historicalData);
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// Save historical data
app.post('/api/dashboard/historical/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { date, sessions, sales, orders, conversion } = req.body;
        
        if (!date || sessions === undefined || sales === undefined || 
            orders === undefined || conversion === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const historicalPath = path.join(dataDir, 'historical', `${userId}.json`);
        let historical = [];
        
        if (fs.existsSync(historicalPath)) {
            historical = JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
        }
        
        // Remove existing entry for the same date if it exists
        historical = historical.filter(entry => entry.date !== date);
        
        // Add new entry
        historical.push({
            date,
            sessions: Number(sessions),
            sales: Number(sales),
            orders: Number(orders),
            conversion: Number(conversion)
        });
        
        // Sort by date
        historical.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        fs.writeFileSync(historicalPath, JSON.stringify(historical, null, 2));
        res.json({ success: true, historical });
    } catch (error) {
        console.error('Error saving historical data:', error);
        res.status(500).json({ error: 'Failed to save historical data' });
    }
});

// Delete historical data
app.delete('/api/dashboard/historical/:userId/:date', async (req, res) => {
    try {
        const { userId, date } = req.params;
        const historicalPath = path.join(dataDir, 'historical', `${userId}.json`);
        
        if (!fs.existsSync(historicalPath)) {
            return res.status(404).json({ error: 'No historical data found' });
        }
        
        let historical = JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
        
        // Remove entry for the specified date
        historical = historical.filter(entry => entry.date !== date);
        
        fs.writeFileSync(historicalPath, JSON.stringify(historical, null, 2));
        res.json({ success: true, historical });
    } catch (error) {
        console.error('Error deleting historical data:', error);
        res.status(500).json({ error: 'Failed to delete historical data' });
    }
});

// Get all email marketing suggestions
app.get('/api/email-marketing/suggestions', async (req, res) => {
    try {
        const userId = req.query.userId;
        const suggestionsPath = path.join(dataDir, 'email-suggestions.json');
        
        if (!fs.existsSync(suggestionsPath)) {
            return res.json([]);
        }
        
        const suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
        
        // Filter suggestions by userId if provided
        const filteredSuggestions = userId 
            ? suggestions.filter(s => s.userId === userId)
            : suggestions;
            
        res.json(filteredSuggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

// Submit a new email marketing suggestion
app.post('/api/email-marketing/suggest', async (req, res) => {
    try {
        const { userId, username, suggestion } = req.body;
        
        if (!userId || !username || !suggestion) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const suggestionsPath = path.join(dataDir, 'email-suggestions.json');
        let suggestions = [];
        
        if (fs.existsSync(suggestionsPath)) {
            suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
        }
        
        // Add new suggestion
        suggestions.push({
            userId,
            username,
            suggestion,
            timestamp: new Date().toISOString()
        });
        
        // Save to file
        fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
        
        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('Error saving suggestion:', error);
        res.status(500).json({ error: 'Failed to save suggestion' });
    }
});

// Get email marketing stats for a user
app.get('/api/email-marketing/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Fetching email stats for user:', userId);
        
        // Ensure the email-stats directory exists
        const emailStatsDir = path.join(dataDir, 'email-stats');
        if (!fs.existsSync(emailStatsDir)) {
            fs.mkdirSync(emailStatsDir, { recursive: true });
        }
        
        const statsPath = path.join(emailStatsDir, `${userId}.json`);
        console.log('Stats path:', statsPath);
        
        // Create default stats if file doesn't exist
        if (!fs.existsSync(statsPath)) {
            const defaultStats = {
                sent: 0,
                total: 0,
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(statsPath, JSON.stringify(defaultStats, null, 2));
            console.log('Created default stats:', defaultStats);
            return res.json(defaultStats);
        }
        
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        console.log('Loaded existing stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching email stats:', error);
        res.status(500).json({ error: 'Failed to fetch email stats' });
    }
});

// Update email marketing stats
app.post('/api/email-marketing/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { sent, total } = req.body;
        
        console.log('Updating email stats for user:', userId, 'with data:', { sent, total });
        
        if (!userId) {
            console.error('No userId provided');
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        if (sent === undefined || total === undefined) {
            console.error('Missing sent or total values');
            return res.status(400).json({ error: 'Both sent and total values are required' });
        }
        
        const sentNum = Number(sent);
        const totalNum = Number(total);
        
        if (isNaN(sentNum) || isNaN(totalNum)) {
            console.error('Invalid number format:', { sent, total });
            return res.status(400).json({ error: 'Invalid number format' });
        }
        
        if (sentNum > totalNum) {
            console.error('Invalid values:', { sent, total });
            return res.status(400).json({ error: 'Sent emails cannot be greater than total emails' });
        }
        
        // Ensure the email-stats directory exists
        const emailStatsDir = path.join(dataDir, 'email-stats');
        if (!fs.existsSync(emailStatsDir)) {
            fs.mkdirSync(emailStatsDir, { recursive: true });
        }
        
        const statsPath = path.join(emailStatsDir, `${userId}.json`);
        const stats = {
            sent: sentNum,
            total: totalNum,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('Writing stats to file:', stats);
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        
        // Also update the user's metrics file to keep dashboard in sync
        const metricsDir = path.join(dataDir, 'metrics');
        if (!fs.existsSync(metricsDir)) {
            fs.mkdirSync(metricsDir, { recursive: true });
        }
        
        const metricsPath = path.join(metricsDir, `${userId}.json`);
        let metrics = {};
        
        if (fs.existsSync(metricsPath)) {
            metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        }
        
        metrics.email_stats = stats;
        console.log('Updating metrics file with email stats:', metrics);
        fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
        
        // Send email notification
        const users = readUsers();
        const user = users.find(u => u.userId === userId);
        if (user) {
            try {
                await sendEmail(
                    'team@theeace-ag.com',  // Send to team email
                    'Email Marketing Stats Updated',
                    `Email marketing stats have been updated for user ${user.username}:\n\n` +
                    `Sent Emails: ${sentNum}\n` +
                    `Total Emails: ${totalNum}\n` +
                    `Last Updated: ${stats.lastUpdated}`
                );
            } catch (error) {
                console.error('Error sending email notification:', error);
                // Don't fail the request if email fails
            }
        }
        
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error updating email stats:', error);
        res.status(500).json({ error: 'Failed to update email stats: ' + error.message });
    }
});

// Helper functions for website configurations
const WEBSITE_CONFIGS_FILE = path.join(dataDir, 'website-configs.json');

function readWebsiteConfigs() {
    try {
        // Create directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Create configs file if it doesn't exist
        if (!fs.existsSync(WEBSITE_CONFIGS_FILE)) {
            fs.writeFileSync(WEBSITE_CONFIGS_FILE, '{}', 'utf8');
            return {};
        }

        const data = fs.readFileSync(WEBSITE_CONFIGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading website configs:', error);
        return {};
    }
}

function writeWebsiteConfigs(configs) {
    try {
        // Create directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(WEBSITE_CONFIGS_FILE, JSON.stringify(configs, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing website configs:', error);
        throw error;
    }
}

// Get website configuration
app.get('/api/website-config/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const configs = readWebsiteConfigs();
        
        // Return default configuration if none exists
        const defaultConfig = {
            userId,
            state: 1,
            websiteUrl: '',
            previewImageUrl: '',
            brandName: '',
            websiteType: '',
            colors: {
                primary: '#000000',
                secondary: '#ffffff',
                tertiary: '#cccccc'
            },
            referenceWebsite: '',
            submissions: [],
            lastUpdated: new Date().toISOString()
        };
        
        if (!configs[userId]) {
            configs[userId] = defaultConfig;
            writeWebsiteConfigs(configs);
        }
        
        res.json(configs[userId]);
    } catch (error) {
        console.error('Error fetching website config:', error);
        res.status(500).json({ error: 'Failed to fetch website configuration' });
    }
});

// Update website configuration
app.post('/api/website-config/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        const configs = readWebsiteConfigs();
        
        console.log('Updating website config for user:', userId);
        console.log('Update data:', updates);
        
        // Initialize config if it doesn't exist
        if (!configs[userId]) {
            configs[userId] = {
                userId,
                state: 1,
                websiteUrl: '',
                previewImageUrl: '',
                brandName: '',
                websiteType: '',
                colors: {
                    primary: '#000000',
                    secondary: '#ffffff',
                    tertiary: '#cccccc'
                },
                referenceWebsite: '',
                submissions: [],
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Update the configuration
        configs[userId] = {
            ...configs[userId],
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        // Ensure submissions array exists
        if (!configs[userId].submissions) {
            configs[userId].submissions = [];
        }

        // Add the new submission if it's a form submission for state 1
        if (updates.state === 1 && updates.brandName && updates.websiteType && updates.colors) {
            const submission = {
                timestamp: updates.timestamp || new Date().toISOString(),
                brandName: updates.brandName,
                websiteType: updates.websiteType,
                colors: updates.colors,
                referenceWebsite: updates.referenceWebsite
            };
            configs[userId].submissions.push(submission);
        }
        
        // If it's a state 2 update, ensure we capture websiteUrl and previewImageUrl
        if (updates.state === 2) {
            console.log('State 2 update with website URL:', updates.websiteUrl);
            console.log('Preview image URL:', updates.previewImageUrl);
            
            // Make sure these properties exist even if they weren't included in the update
            if (!configs[userId].websiteUrl) configs[userId].websiteUrl = '';
            if (!configs[userId].previewImageUrl) configs[userId].previewImageUrl = '';
        }
        
        writeWebsiteConfigs(configs);
        
        // Send a notification email
        try {
            const emailContent = updates.state === 1
                ? `Website configuration has been updated for user ${userId}:\n\n` +
                  `Brand Name: ${updates.brandName || configs[userId].brandName}\n` +
                  `Website Type: ${updates.websiteType || configs[userId].websiteType}\n` +
                  `Last Updated: ${configs[userId].lastUpdated}`
                : `Website preview has been updated for user ${userId}:\n\n` +
                  `Website URL: ${updates.websiteUrl || configs[userId].websiteUrl}\n` +
                  `Preview Image URL: ${updates.previewImageUrl || configs[userId].previewImageUrl}\n` +
                  `Last Updated: ${configs[userId].lastUpdated}`;
            
            sendEmail(
                'team@theeace-ag.com',
                'Website Configuration Updated',
                emailContent
            ).catch(error => {
                // Log but don't fail the request if email sending fails
                console.error('Error sending website config update notification email:', error);
            });
        } catch (emailError) {
            console.error('Error preparing website config update email:', emailError);
        }
        
        res.json(configs[userId]);
    } catch (error) {
        console.error('Error updating website config:', error);
        res.status(500).json({ error: 'Failed to update website configuration' });
    }
});

// Submit website query (changes request)
app.post('/api/website-config/:userId/query', (req, res) => {
    try {
        const { userId } = req.params;
        const { changes } = req.body;
        
        console.log('Received website query for user:', userId);
        console.log('Changes requested:', changes);
        
        if (!changes) {
            return res.status(400).json({ error: 'Changes description is required' });
        }
        
        const configs = readWebsiteConfigs();
        
        // Initialize config if it doesn't exist
        if (!configs[userId]) {
            configs[userId] = {
                userId,
                state: 1,
                websiteUrl: '',
                previewImageUrl: '',
                brandName: '',
                websiteType: '',
                colors: {
                    primary: '#000000',
                    secondary: '#ffffff',
                    tertiary: '#cccccc'
                },
                referenceWebsite: '',
                submissions: [],
                queries: [],
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Ensure queries array exists
        if (!configs[userId].queries) {
            configs[userId].queries = [];
        }
        
        // Add the new query
        const query = {
            timestamp: new Date().toISOString(),
            changes: changes,
            status: 'Pending'
        };
        
        configs[userId].queries.push(query);
        configs[userId].lastUpdated = new Date().toISOString();
        
        writeWebsiteConfigs(configs);
        
        // Send a notification email
        try {
            sendEmail(
                'team@theeace-ag.com',
                'Website Change Request Received',
                `A new website change request has been submitted by user ${userId}:\n\n` +
                `Changes Requested: ${changes}\n` +
                `Timestamp: ${query.timestamp}`
            ).catch(error => {
                // Log but don't fail the request if email sending fails
                console.error('Error sending website query notification email:', error);
            });
        } catch (emailError) {
            console.error('Error preparing website query email:', emailError);
        }
        
        res.status(201).json(query);
    } catch (error) {
        console.error('Error submitting website query:', error);
        res.status(500).json({ error: 'Failed to submit website query' });
    }
});

// Get website queries
app.get('/api/website-config/:userId/queries', (req, res) => {
    try {
        const { userId } = req.params;
        const configs = readWebsiteConfigs();
        
        if (!configs[userId] || !configs[userId].queries) {
            return res.json([]);
        }
        
        res.json(configs[userId].queries);
    } catch (error) {
        console.error('Error fetching website queries:', error);
        res.status(500).json({ error: 'Failed to fetch website queries' });
    }
});

// Update website URL
app.post('/api/update-website-url/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const configs = readWebsiteConfigs();
        if (!configs[userId]) {
            configs[userId] = {
                state: 2,
                websiteUrl: url,
                lastUpdated: new Date().toISOString()
            };
        } else {
            configs[userId].websiteUrl = url;
            configs[userId].state = 2;
            configs[userId].lastUpdated = new Date().toISOString();
        }
        
        writeWebsiteConfigs(configs);
        res.json(configs[userId]);
    } catch (error) {
        console.error('Error updating website URL:', error);
        res.status(500).json({ error: 'Failed to update website URL' });
    }
});

// Update website state
app.post('/api/website-config/:userId/state', (req, res) => {
    try {
        const { userId } = req.params;
        const { state } = req.body;
        
        if (state === undefined) {
            return res.status(400).json({ error: 'State is required' });
        }

        const configs = readWebsiteConfigs();
        if (!configs[userId]) {
            configs[userId] = {
                state,
                lastUpdated: new Date().toISOString()
            };
        } else {
            configs[userId].state = state;
            configs[userId].lastUpdated = new Date().toISOString();
        }
        
        writeWebsiteConfigs(configs);
        res.json(configs[userId]);
    } catch (error) {
        console.error('Error updating website state:', error);
        res.status(500).json({ error: 'Failed to update website state' });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads/previews directory if it doesn't exist
        const dir = path.join(__dirname, 'uploads', 'previews');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
    }
});

const uploadPreview = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        // Accept only image files
        if (!file.mimetype.match(/^image\/(jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload preview image
app.post('/api/upload-preview/:userId', uploadPreview.single('preview'), (req, res) => {
    try {
        const { userId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const configs = readWebsiteConfigs();
        const imageUrl = `/uploads/previews/${req.file.filename}`;

        // Remove old preview if it exists
        if (configs[userId]?.previewImageUrl) {
            const oldPath = path.join(__dirname, configs[userId].previewImageUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Initialize or update config
        if (!configs[userId]) {
            configs[userId] = {
                userId,
                state: 2,
                previewImageUrl: imageUrl,
                lastUpdated: new Date().toISOString()
            };
        } else {
            configs[userId].previewImageUrl = imageUrl;
            configs[userId].state = 2;
            configs[userId].lastUpdated = new Date().toISOString();
        }

        writeWebsiteConfigs(configs);
        res.json({ 
            url: imageUrl,
            config: configs[userId]
        });
    } catch (error) {
        console.error('Error uploading preview:', error);
        res.status(500).json({ error: 'Failed to upload preview' });
    }
});

// Remove preview image
app.delete('/api/preview/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const configs = readWebsiteConfigs();
        
        if (!configs[userId] || !configs[userId].previewImageUrl) {
            return res.status(404).json({ error: 'No preview image found' });
        }

        const imagePath = path.join(__dirname, configs[userId].previewImageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        configs[userId].previewImageUrl = null;
        configs[userId].lastUpdated = new Date().toISOString();
        writeWebsiteConfigs(configs);

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing preview:', error);
        res.status(500).json({ error: 'Failed to remove preview' });
    }
});

// Function to read logo preferences
function readLogoPreferences() {
    const filePath = path.join(dataDir, 'logo-preferences.json');
    if (!fs.existsSync(filePath)) {
        // Create directory if it doesn't exist
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        // Initialize empty data
        fs.writeFileSync(filePath, JSON.stringify({}));
        return {};
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parsing logo preferences:', error);
        return {};
    }
}

// Function to write logo preferences
function writeLogoPreferences(preferences) {
    const filePath = path.join(dataDir, 'logo-preferences.json');
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(preferences, null, 2));
}

// Get logo preferences
app.get('/api/logo-preference/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const preferences = readLogoPreferences();
        
        // Return default configuration if none exists
        const defaultPreference = {
            userId,
            state: 1,
            logoUrl: null,
            logoType: '',
            notes: [],
            lastUpdated: new Date().toISOString()
        };
        
        if (!preferences[userId]) {
            preferences[userId] = defaultPreference;
            writeLogoPreferences(preferences);
        }
        
        res.json(preferences[userId]);
    } catch (error) {
        console.error('Error fetching logo preferences:', error);
        res.status(500).json({ error: 'Failed to fetch logo preferences' });
    }
});

// Update logo preferences
app.post('/api/logo-preference/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        const preferences = readLogoPreferences();
        
        // Initialize preference if it doesn't exist
        if (!preferences[userId]) {
            preferences[userId] = {
                userId,
                state: 1,
                logoUrl: null,
                logoType: '',
                notes: [],
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Update the preferences
        preferences[userId] = {
            ...preferences[userId],
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        // Ensure notes array exists
        if (!preferences[userId].notes) {
            preferences[userId].notes = [];
        }

        // Add the new note if it's a form submission
        if (updates.noteText) {
            const note = {
                timestamp: new Date().toISOString(),
                text: updates.noteText
            };
            preferences[userId].notes.push(note);
        }
        
        writeLogoPreferences(preferences);
        res.json(preferences[userId]);
    } catch (error) {
        console.error('Error updating logo preferences:', error);
        res.status(500).json({ error: 'Failed to update logo preferences' });
    }
});

// Update logo state
app.post('/api/logo-preference/:userId/state', (req, res) => {
    try {
        const { userId } = req.params;
        const { state } = req.body;
        
        if (state === undefined) {
            return res.status(400).json({ error: 'State is required' });
        }

        const preferences = readLogoPreferences();
        if (!preferences[userId]) {
            preferences[userId] = {
                state,
                lastUpdated: new Date().toISOString()
            };
        } else {
            preferences[userId].state = state;
            preferences[userId].lastUpdated = new Date().toISOString();
        }
        
        writeLogoPreferences(preferences);
        res.json(preferences[userId]);
    } catch (error) {
        console.error('Error updating logo state:', error);
        res.status(500).json({ error: 'Failed to update logo state' });
    }
});

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads/logos directory if it doesn't exist
        const dir = path.join(__dirname, 'uploads', 'logos');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
    }
});

const uploadLogo = multer({ 
    storage: logoStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        // Accept only image files
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|svg\+xml)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Upload logo
app.post('/api/upload-logo/:userId', uploadLogo.single('logo'), (req, res) => {
    try {
        const { userId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const preferences = readLogoPreferences();
        const logoUrl = `/uploads/logos/${req.file.filename}`;

        // Remove old logo if it exists
        if (preferences[userId]?.logoUrl) {
            const oldPath = path.join(__dirname, preferences[userId].logoUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Initialize or update preference
        if (!preferences[userId]) {
            preferences[userId] = {
                userId,
                state: 2,
                logoUrl: logoUrl,
                lastUpdated: new Date().toISOString()
            };
        } else {
            preferences[userId].logoUrl = logoUrl;
            preferences[userId].state = 2;
            preferences[userId].lastUpdated = new Date().toISOString();
        }

        writeLogoPreferences(preferences);
        res.json({ 
            url: logoUrl,
            preference: preferences[userId]
        });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

// Remove logo
app.delete('/api/logo/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const preferences = readLogoPreferences();
        
        if (!preferences[userId] || !preferences[userId].logoUrl) {
            return res.status(404).json({ error: 'No logo found' });
        }

        const logoPath = path.join(__dirname, preferences[userId].logoUrl);
        if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
        }

        preferences[userId].logoUrl = null;
        preferences[userId].lastUpdated = new Date().toISOString();
        writeLogoPreferences(preferences);

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing logo:', error);
        res.status(500).json({ error: 'Failed to remove logo' });
    }
});

// ====================== Instagram Marketing API ======================
// Create directory for Instagram marketing data if it doesn't exist
if (!fs.existsSync(path.join(dataDir, 'instagram-marketing'))) {
    fs.mkdirSync(path.join(dataDir, 'instagram-marketing'), { recursive: true });
}

// Get Instagram marketing data
app.get('/api/instagram-marketing/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const filePath = path.join(dataDir, 'instagram-marketing', `${userId}.json`);
        
        if (!fs.existsSync(filePath)) {
            // Return default data if file doesn't exist
            return res.json({
                accountsReached: 0,
                leadsConverted: 0,
                preferences: [],
                lastUpdated: new Date().toISOString()
            });
        }
        
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error getting Instagram marketing data:', error);
        res.status(500).json({ error: 'Failed to get Instagram marketing data' });
    }
});

// Update Instagram marketing data (admin only)
app.post('/api/instagram-marketing/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const { accountsReached, leadsConverted } = req.body;
        const filePath = path.join(dataDir, 'instagram-marketing', `${userId}.json`);
        
        // Read existing data or create default
        let data = {};
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            data = {
                accountsReached: 0,
                leadsConverted: 0,
                preferences: [],
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Update metrics
        if (accountsReached !== undefined) data.accountsReached = accountsReached;
        if (leadsConverted !== undefined) data.leadsConverted = leadsConverted;
        data.lastUpdated = new Date().toISOString();
        
        // Save data
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        console.error('Error updating Instagram marketing data:', error);
        res.status(500).json({ error: 'Failed to update Instagram marketing data' });
    }
});

// Add Instagram marketing preference (user)
app.post('/api/instagram-marketing/:userId/preference', (req, res) => {
    try {
        const userId = req.params.userId;
        const { niche } = req.body;
        const filePath = path.join(dataDir, 'instagram-marketing', `${userId}.json`);
        
        if (!niche) {
            return res.status(400).json({ error: 'Niche is required' });
        }
        
        // Read existing data or create default
        let data = {};
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            data = {
                accountsReached: 0,
                leadsConverted: 0,
                preferences: [],
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Add preference
        data.preferences.push({
            niche,
            timestamp: new Date().toISOString()
        });
        
        // Save data
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        console.error('Error adding Instagram marketing preference:', error);
        res.status(500).json({ error: 'Failed to add Instagram marketing preference' });
    }
});

// Upcoming Meetings Endpoints
app.get('/api/upcoming-meetings/:userId', (req, res) => {
    const userId = req.params.userId;
    const userMeetings = meetings[userId];
    
    if (!userMeetings) {
        return res.status(404).json({ error: 'Meetings not found for this user' });
    }
    
    res.json(userMeetings);
});

app.post('/api/upcoming-meetings/:userId', (req, res) => {
    const userId = req.params.userId;
    const meetingData = req.body;
    
    // Validate required fields
    if (!meetingData.heading || !meetingData.description || !meetingData.dateTime) {
        return res.status(400).json({ error: 'Missing required meeting fields' });
    }
    
    // Store or update meeting data
    meetings[userId] = {
        heading: meetingData.heading,
        subtitle: meetingData.subtitle || 'With our experts who will guide you in building a profitable business',
        description: meetingData.description,
        dateTime: meetingData.dateTime,
        profileImage: meetingData.profileImage || 'https://via.placeholder.com/80',
        meetingLink: meetingData.meetingLink || '#schedule'
    };
    
    console.log(`Updated meetings for user ${userId}:`, meetings[userId]);
    res.json({ success: true, message: 'Meeting data updated successfully' });
});

// Ensure data directories exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure subdirectories exist
['email-stats', 'metrics', 'historical', 'logo-preferences', 'instagram-marketing'].forEach(subDir => {
    const dir = path.join(dataDir, subDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Improved error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Log to file here if needed
    // Optionally, you could restart the server here
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log to file here if needed
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    // Close any database connections or other resources here
    process.exit(0);
});

// Listen on all interfaces (0.0.0.0) to make the server accessible externally
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access locally via: http://localhost:${PORT}`);
    console.log(`For access from other devices use your computer's IP address`);
}); 