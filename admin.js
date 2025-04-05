// API URL configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://theeace-login-portal.onrender.com';

// Load users when the page loads
window.onload = function() {
    loadUsers();
};

// Add Single User
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const userId = document.getElementById('newUserId').value.trim();
    const passkey = document.getElementById('newPasskey').value;
    const messageDiv = document.getElementById('singleUserMessage');
    const submitBtn = e.target.querySelector('.sign-in-btn');
    
    try {
        submitBtn.classList.add('loading');
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, userId, passkey })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.className = 'success-message';
            messageDiv.textContent = 'User added successfully!';
            loadUsers(); // Refresh user list
            e.target.reset();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        messageDiv.className = 'error-message';
        messageDiv.textContent = error.message || 'Error adding user';
    } finally {
        submitBtn.classList.remove('loading');
    }
});

// Upload CSV
async function uploadCSV() {
    const fileInput = document.getElementById('csvFile');
    const messageDiv = document.getElementById('bulkImportMessage');
    const uploadBtn = document.querySelector('.file-upload .sign-in-btn');
    
    if (!fileInput.files[0]) {
        messageDiv.className = 'error-message';
        messageDiv.textContent = 'Please select a CSV file';
        return;
    }
    
    const formData = new FormData();
    formData.append('csv', fileInput.files[0]);
    
    try {
        uploadBtn.classList.add('loading');
        const response = await fetch(`${API_URL}/api/users/bulk-import`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const successCount = data.results.filter(r => r.success).length;
            const failCount = data.results.filter(r => !r.success).length;
            
            messageDiv.className = 'success-message';
            messageDiv.innerHTML = `Import completed:<br>
                - ${successCount} users imported successfully<br>
                ${failCount > 0 ? `- ${failCount} users failed to import` : ''}`;
            
            if (failCount > 0) {
                const failedUsers = data.results
                    .filter(r => !r.success)
                    .map(r => `${r.username}: ${r.error}`)
                    .join('<br>');
                messageDiv.innerHTML += `<br><br>Failed imports:<br>${failedUsers}`;
            }
            
            loadUsers(); // Refresh user list
            fileInput.value = '';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        messageDiv.className = 'error-message';
        messageDiv.textContent = error.message || 'Error importing users';
    } finally {
        uploadBtn.classList.remove('loading');
    }
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/api/users`);
        const users = await response.json();
        
        const tbody = document.getElementById('userList');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.userId}</td>
                <td>${new Date(user.createdAt).toLocaleString()}</td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Setup drag and drop for CSV file
const dropZone = document.querySelector('.file-label');
const fileInput = document.getElementById('csvFile');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = 'rgba(255, 255, 255, 0.05)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = 'rgba(255, 255, 255, 0.05)';
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        dropZone.textContent = e.dataTransfer.files[0].name;
    }
}); 