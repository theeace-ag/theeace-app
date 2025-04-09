// API URL configuration
const API_URL = ''; // Use relative URLs to current domain

// Check if user is already logged in
window.onload = function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        // Redirect to our dashboard instead of external site
        window.location.href = '/dashboard.html';
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
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
            
            // Create user data directly
            const userData = {
                username: username,
                userId: userId,
                lastLogin: new Date().toISOString()
            };
            
            // Store user data in localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(userData));
            localStorage.setItem('userId', userId);
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }
    
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (loggedInUser && window.location.pathname === '/') {
        // Auto-redirect to dashboard if already logged in
        window.location.href = 'dashboard.html';
    }
});

// Function to show message
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('error-message');
    if (!messageContainer) return;
    
    messageContainer.textContent = message;
    messageContainer.className = `error-message ${type}`;
    messageContainer.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            messageContainer.style.display = 'none';
            messageContainer.style.opacity = '1';
        }, 300);
    }, 5000);
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