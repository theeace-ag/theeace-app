const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'TheEace Login Portal',
  description: 'Login portal server for TheEace',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [],
  // Run as the current user
  allowServiceLogon: true,
  // Restart if it crashes
  restartAfterFailure: {
    delay: 10000,
    maxRestarts: 3
  }
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('Installation complete.');
  console.log('Service exists:', svc.exists);
  console.log('The service can be started with: net start "TheEace Login Portal"');
  
  // Start the service after installation
  svc.start();
  console.log('Service started');
});

// Listen for the "error" event
svc.on('error', function(error) {
  console.error('Error:', error);
});

// Just in case the service already exists
if (svc.exists) {
  console.log('Service already exists. Removing...');
  svc.uninstall();
  
  // Wait a bit and then install
  setTimeout(function() {
    console.log('Installing service...');
    svc.install();
  }, 5000);
} else {
  console.log('Installing service...');
  svc.install();
} 