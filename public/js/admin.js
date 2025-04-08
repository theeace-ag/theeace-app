const API_URL = ''; // Use relative paths to current server

// Load users when the page loads
window.onload = function() {
    loadUsers();
};

// Add Single User
document.getElementById('addUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value;
    const userId = document.getElementById('newUserId').value;
    const passkey = document.getElementById('newPasskey').value;
    
    try {
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, userId, passkey })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('singleUserMessage').innerHTML = `
                <div class="success-message">User added successfully!</div>
            `;
            document.getElementById('addUserForm').reset();
            loadUsers(); // Refresh user list
        } else {
            document.getElementById('singleUserMessage').innerHTML = `
                <div class="error-message">${data.message}</div>
            `;
        }
    } catch (error) {
        document.getElementById('singleUserMessage').innerHTML = `
            <div class="error-message">Error adding user: ${error.message}</div>
        `;
    }
});

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
const csvFileInput = document.getElementById('csvFile');
const csvFileLabel = document.querySelector('.file-label');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    csvFileLabel.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    csvFileLabel.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    csvFileLabel.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    csvFileLabel.classList.add('highlight');
}

function unhighlight(e) {
    csvFileLabel.classList.remove('highlight');
}

csvFileLabel.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    csvFileInput.files = files;
    updateFileLabel(files[0]);
}

csvFileInput.addEventListener('change', function(e) {
    updateFileLabel(this.files[0]);
});

function updateFileLabel(file) {
    if (file) {
        csvFileLabel.textContent = file.name;
    } else {
        csvFileLabel.textContent = 'Choose CSV file or drag & drop here';
    }
}

// Upload CSV
async function uploadCSV() {
    const fileInput = document.getElementById('csvFile');
    const messageDiv = document.getElementById('bulkImportMessage');
    
    if (!fileInput.files.length) {
        messageDiv.innerHTML = `
            <div class="error-message">Please select a CSV file</div>
        `;
        return;
    }
    
    const formData = new FormData();
    formData.append('csv', fileInput.files[0]);
    
    try {
        const response = await fetch(`${API_URL}/api/users/bulk-import`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const results = data.results;
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            messageDiv.innerHTML = `
                <div class="success-message">
                    Import completed:<br>
                    ${successful} users added successfully<br>
                    ${failed} users failed
                </div>
                ${failed > 0 ? `
                    <div class="error-message">
                        Failed entries:<br>
                        ${results.filter(r => !r.success)
                            .map(r => `${r.username}: ${r.error}`)
                            .join('<br>')}
                    </div>
                ` : ''}
            `;
            
            // Reset file input and label
            fileInput.value = '';
            csvFileLabel.textContent = 'Choose CSV file or drag & drop here';
            
            // Refresh user list
            loadUsers();
        } else {
            messageDiv.innerHTML = `
                <div class="error-message">${data.message}</div>
            `;
        }
    } catch (error) {
        messageDiv.innerHTML = `
            <div class="error-message">Error uploading CSV: ${error.message}</div>
        `;
    }
} 