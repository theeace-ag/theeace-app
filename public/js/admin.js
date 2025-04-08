// API URL configuration
const API_URL = ''; // Use relative paths to current server

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

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
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <div class="user-info">
                <strong>${user.username}</strong> (ID: ${user.userId})
                <br>
                <small>Created: ${new Date(user.createdAt).toLocaleString()}</small>
                ${user.lastLogin ? `<br><small>Last Login: ${new Date(user.lastLogin).toLocaleString()}</small>` : ''}
            </div>
            <div class="user-actions">
                <button onclick="editUser('${user.userId}')">Edit</button>
                <button class="delete-btn" onclick="deleteUser('${user.userId}')">Delete</button>
            </div>
        `;
        userList.appendChild(userElement);
    });
}

async function editUser(userId) {
    // Implement edit functionality
    console.log('Edit user:', userId);
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadUsers(); // Reload the user list
            } else {
                const error = await response.json();
                alert(error.message || 'Error deleting user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
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