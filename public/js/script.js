// API URL configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://theeace-login-portal.onrender.com';

// Check if user is already logged in
window.onload = function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        // Redirect to our dashboard instead of external site
        window.location.href = '/dashboard';
    }

    // Setup password visibility toggle
    const showPasswordBtn = document.querySelector('.show-password');
    const passwordInput = document.getElementById('passkey');
    
    if (showPasswordBtn && passwordInput) {
        showPasswordBtn.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                this.textContent = 'Show';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const userId = document.getElementById('userId').value;
            const passkey = document.getElementById('passkey').value;
            
            if (!username || !userId || !passkey) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            // Show loading state
            const loginButton = document.querySelector('#loginForm button[type="submit"]');
            const originalText = loginButton.textContent;
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
            
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, userId, passkey })
            })
            .then(response => response.json())
            .then(data => {
                loginButton.disabled = false;
                loginButton.textContent = originalText;
                
                if (data.message === 'Login successful') {
                    // Store user data in localStorage
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    localStorage.setItem('userId', data.user.userId); // Add this for dashboard.js
                    
                    // Initialize socket connection with the user ID
                    if (window.socketUtil) {
                        window.socketUtil.updateUserId(data.user.userId);
                    }
                    
                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                } else {
                    showMessage('Login failed. Please check your credentials.', 'error');
                }
            })
            .catch(error => {
                console.error('Error during login:', error);
                loginButton.disabled = false;
                loginButton.textContent = originalText;
                showMessage('An error occurred. Please try again.', 'error');
            });
        });
    }
    
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (loggedInUser && window.location.pathname === '/') {
        // Auto-redirect to dashboard if already logged in
        window.location.href = '/dashboard';
    }
});

// Function to show message
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message');
    if (!messageContainer) return;
    
    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block';
    
    // Hide message after 3 seconds
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 3000);
}

// Function to logout
function logout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userId');
    window.location.href = '/';
}

function deleteCookiesAndLogout() {
    // Delete all cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear any stored session/local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/';
}