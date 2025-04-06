// Socket.IO client connection script
(function() {
  // Initialize socket connection
  const socket = io();
  let currentUserId = null;
  
  // Connect and join user's room
  function initSocket() {
    // Get user ID from localStorage
    currentUserId = localStorage.getItem('userId');
    
    if (currentUserId) {
      console.log('Connecting to socket with user ID:', currentUserId);
      socket.emit('join', currentUserId);
    } else {
      console.log('No user ID found in localStorage');
    }
  }
  
  // Event handlers
  socket.on('connect', () => {
    console.log('Connected to server socket');
    initSocket();
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server socket');
  });
  
  // Listen for user creation events
  socket.on('user-created', (data) => {
    console.log('New user created:', data);
    // Refresh user list if on admin page
    if (window.location.pathname.includes('admin')) {
      if (typeof loadUsers === 'function') {
        loadUsers();
      }
    }
  });
  
  // Listen for email stats updates
  socket.on('email-stats-updated', (data) => {
    console.log('Email stats updated:', data);
    
    // Refresh data if on the dashboard page
    if (window.location.pathname.includes('dashboard')) {
      if (typeof loadEmailStats === 'function') {
        loadEmailStats();
      }
    }
    
    // If in user content page
    if (window.location.pathname.includes('userContent')) {
      if (typeof updateEmailStatsDisplay === 'function') {
        updateEmailStatsDisplay(data);
      }
    }
  });
  
  // Listen for Instagram data updates
  socket.on('instagram-data-updated', (data) => {
    console.log('Instagram data updated:', data);
    
    // Refresh data if on the dashboard page
    if (window.location.pathname.includes('dashboard')) {
      if (typeof loadInstagramMarketingData === 'function') {
        loadInstagramMarketingData();
      }
    }
    
    // If in user content page
    if (window.location.pathname.includes('userContent')) {
      if (typeof updateInstagramDisplay === 'function') {
        updateInstagramDisplay(data);
      }
    }
  });
  
  // Expose functions to window for global access
  window.socketUtil = {
    updateUserId: function(userId) {
      currentUserId = userId;
      if (socket.connected) {
        socket.emit('join', currentUserId);
      }
    }
  };
  
  // Initialize socket when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    initSocket();
  });
  
  // Also try to initialize when the login state changes
  window.addEventListener('storage', function(e) {
    if (e.key === 'userId') {
      initSocket();
    }
  });
})(); 