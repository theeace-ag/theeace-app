// API URL configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''  // Use relative URLs for local development
    : '';  // Use relative URLs for production too

// Check if user is already logged in
window.onload = function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        // Redirect to our dashboard
        window.location.href = '/dashboard.html';
    }

    // Setup password visibility toggle
    const showPasswordBtn = document.querySelector('.show-password');
    const passwordInput = document.getElementById('password');
    
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

async function handleLogin(event) {
    event.preventDefault();
    
    // Get form elements
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.sign-in-btn');
    const errorMessage = document.getElementById('error-message');
    
    // Clear previous error message
    errorMessage.textContent = '';
    
    // Validate input
    if (!username || !password) {
        errorMessage.textContent = 'Please enter both username and password.';
        return false;
    }
    
    // Show loading animation
    loginBtn.classList.add('loading');
    
    try {
        console.log('Attempting login for:', username);
        
        // Call backend API
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        // Handle non-OK responses
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Login failed');
        }
        
        // Parse successful response
        const data = await response.json();
        console.log('Login successful:', data.user.username);
        
        // Save login state and user data
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id); // Use new id field
        
        // Redirect to our dashboard
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        // Handle error case
        console.error('Login error:', error);
        errorMessage.textContent = 'Invalid credentials. Please try again.';
    } finally {
        // Remove loading state regardless of outcome
        loginBtn.classList.remove('loading');
    }
    
    return false; // Prevent form submission
}

// Function to logout
function logout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userId');
    window.location.href = '/index.html';
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