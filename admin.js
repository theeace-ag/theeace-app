// Define API URL based on environment
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? ''  // Use relative URLs for local development
    : '';  // Use relative URLs for production too

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initialized');
    loadUsers();
    
    // Set up event listeners
    document.getElementById('addUserForm').addEventListener('submit', addUser);
    document.getElementById('importCSVForm').addEventListener('submit', importUsers);
    document.getElementById('deleteUserForm').addEventListener('submit', deleteUser);
});

// Load and display users
function loadUsers() {
    console.log('Loading users...');
    
    fetch(`${API_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(users => {
            console.log(`Loaded ${users.length} users`);
            displayUsers(users);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            document.getElementById('usersList').innerHTML = `<p class="error">Error loading users: ${error.message}</p>`;
        });
}

// Display users in the UI
function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'users-table';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Created</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    users.forEach(user => {
        const tr = document.createElement('tr');
        const userId = user.id || user.userId; // Support both formats
        
        tr.innerHTML = `
            <td>${userId}</td>
            <td>${user.username}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${new Date(user.createdAt).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    usersList.innerHTML = '';
    usersList.appendChild(table);
}

// Add a new user
function addUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!username || !password) {
        alert('Username and password are required');
        return;
    }
    
    console.log('Adding new user:', username);
    
    const userData = {
        username,
        password,
        email
    };
    
    fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to add user');
            });
        }
        return response.json();
    })
    .then(newUser => {
        console.log('User added successfully:', newUser);
        document.getElementById('addUserForm').reset();
        loadUsers(); // Reload the users list
        
        // Show success message
        const statusMsg = document.getElementById('addUserStatus');
        statusMsg.textContent = `User ${newUser.username} added successfully`;
        statusMsg.className = 'success';
        setTimeout(() => {
            statusMsg.textContent = '';
            statusMsg.className = '';
        }, 3000);
    })
    .catch(error => {
        console.error('Error adding user:', error);
        
        // Show error message
        const statusMsg = document.getElementById('addUserStatus');
        statusMsg.textContent = error.message;
        statusMsg.className = 'error';
    });
}

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