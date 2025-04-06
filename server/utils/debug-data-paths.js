const fs = require('fs');
const path = require('path');

// Detect environment
const isGlitch = process.env.PROJECT_DOMAIN !== undefined;
const dataDir = isGlitch ? path.join(__dirname, '.data') : path.join(__dirname, 'data');

console.log('====================== DATA PATH DIAGNOSTICS ======================');
console.log(`Running on Glitch: ${isGlitch ? 'Yes' : 'No'}`);
console.log(`Base data directory: ${dataDir}`);
console.log(`Data directory exists: ${fs.existsSync(dataDir) ? 'Yes' : 'No'}`);

// List all subdirectories we expect
const expectedDirs = [
    '',
    'email-stats',
    'metrics',
    'historical',
    'logo-preferences',
    'instagram-marketing'
];

// Check each directory
expectedDirs.forEach(subDir => {
    const dir = path.join(dataDir, subDir);
    const exists = fs.existsSync(dir);
    console.log(`Directory ${dir} exists: ${exists ? 'Yes' : 'No'}`);
    
    if (exists) {
        try {
            // List files in the directory
            const files = fs.readdirSync(dir);
            console.log(`Files in ${dir}: ${files.length > 0 ? files.join(', ') : 'No files'}`);
            
            // If this is the main data dir, look for important files
            if (subDir === '') {
                const importantFiles = ['users.json', 'widgets.json', 'content.json'];
                importantFiles.forEach(file => {
                    const filePath = path.join(dir, file);
                    const fileExists = fs.existsSync(filePath);
                    console.log(`Important file ${file} exists: ${fileExists ? 'Yes' : 'No'}`);
                    
                    if (fileExists) {
                        try {
                            const content = fs.readFileSync(filePath, 'utf8');
                            const data = JSON.parse(content);
                            console.log(`${file} content valid JSON: Yes`);
                            
                            if (file === 'users.json') {
                                console.log(`Users found: ${Array.isArray(data) ? data.length : 'Not an array'}`);
                                if (Array.isArray(data) && data.length > 0) {
                                    console.log(`First user: ${JSON.stringify(data[0])}`);
                                }
                            }
                        } catch (err) {
                            console.log(`${file} content valid JSON: No (${err.message})`);
                        }
                    }
                });
            }
        } catch (err) {
            console.log(`Error listing files in ${dir}: ${err.message}`);
        }
    }
});

// Check users file specifically
const usersFilePath = path.join(dataDir, 'users.json');
if (fs.existsSync(usersFilePath)) {
    try {
        const content = fs.readFileSync(usersFilePath, 'utf8');
        console.log(`\nUsers file content: ${content}`);
    } catch (err) {
        console.log(`Error reading users file: ${err.message}`);
    }
}

// Check file write permissions
console.log('\nTesting write permissions:');
const testFile = path.join(dataDir, 'test-write.txt');
try {
    fs.writeFileSync(testFile, 'Test write permission', 'utf8');
    console.log(`Successfully wrote to ${testFile}`);
    
    // Clean up
    fs.unlinkSync(testFile);
    console.log('Successfully deleted test file');
} catch (err) {
    console.log(`Error writing test file: ${err.message}`);
}

console.log('\n====================== END DIAGNOSTICS ======================'); 