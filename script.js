// API URL configuration - No longer needed
const API_URL = ''; // Empty string to avoid any API calls

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

async function handleLogin(event) {
    event.preventDefault();
    
    // Get form elements
    const username = document.getElementById('username').value.trim();
    const userId = document.getElementById('userId').value.trim();
    const passkey = document.getElementById('passkey').value;
    const loginBtn = document.querySelector('.sign-in-btn');
    const errorMessage = document.getElementById('error-message');
    
    // Clear previous error message
    errorMessage.textContent = '';
    
    // Show loading animation
    loginBtn.classList.add('loading');
    
    try {
        // DIRECT LOGIN - Skip API call entirely
        // Create user data object
        const userData = {
            username: username,
            userId: userId || username,
            lastLogin: new Date().toISOString()
        };
        
        // Save login state and user data
        localStorage.setItem('loggedInUser', JSON.stringify(userData));
        localStorage.setItem('userId', userData.userId);
        
        // Simulate a slight delay for user experience
        setTimeout(() => {
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        }, 1000);
        
    } catch (error) {
        // Handle error case (should never happen with this approach)
        errorMessage.textContent = 'Something went wrong. Please try again.';
        loginBtn.classList.remove('loading');
    }
}

// Function to logout
function logout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
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