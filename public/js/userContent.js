// General CSS styles for the user content page
const generalCSS = `
    .container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    .section {
        margin-bottom: 30px;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .success-message {
        background-color: #d4edda;
        color: #155724;
        padding: 10px 15px;
        margin-bottom: 15px;
        border-radius: 4px;
    }
    .error-message {
        background-color: #f8d7da;
        color: #721c24;
        padding: 10px 15px;
        margin-bottom: 15px;
        border-radius: 4px;
    }
`;

// Make current variables globally accessible
let currentUserId = null;
let currentConfig = null;

// Load users into select dropdown
async function loadUsers() {
    try {
        console.log('Fetching users...');
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        console.log('Loaded users:', users);
        
        const userSelect = document.getElementById('userSelect');
        userSelect.innerHTML = '<option value="">Select a user...</option>';
        
        if (users.length === 0) {
            console.log('No users found');
            userSelect.innerHTML += '<option disabled>No users available</option>';
            return;
        }
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.userId;
            option.textContent = `${user.username} (${user.userId})`;
            userSelect.appendChild(option);
            console.log('Added user option:', user.username);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        const userSelect = document.getElementById('userSelect');
        userSelect.innerHTML = '<option value="">Error loading users</option>';
        alert('Error loading users. Please try refreshing the page.');
    }
}

// Load user's metrics
async function loadUserMetrics(userId) {
    try {
        const response = await fetch(`/api/dashboard/metrics/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch metrics');
        }
        const metrics = await response.json();
        
        // Update metrics table
        updateMetricsTable(metrics);
        
        // Load historical data
        loadHistoricalData(userId);
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

// Update metrics table with data
function updateMetricsTable(metrics) {
    const rows = document.querySelectorAll('#metricsTable tr');
    
    rows.forEach(row => {
        const metric = row.cells[0].textContent.toLowerCase().replace(' ', '_');
        if (metrics[metric]) {
            row.cells[1].textContent = formatMetricValue(metric, metrics[metric].value);
            row.cells[2].textContent = formatMetricChange(metrics[metric].change);
            row.cells[3].textContent = new Date(metrics[metric].lastUpdated).toLocaleString();
        }
    });
}

// Format metric values
function formatMetricValue(metric, value) {
    switch (metric) {
        case 'total_sales':
            return `₹${value}`;
        case 'conversion_rate':
            return `${value}%`;
        default:
            return value;
    }
}

// Format metric changes
function formatMetricChange(change) {
    if (change > 0) {
        return `↑ ${change}%`;
    } else if (change < 0) {
        return `↓ ${Math.abs(change)}%`;
    }
    return '0%';
}

// Load historical data
async function loadHistoricalData(userId) {
    try {
        const response = await fetch(`/api/dashboard/historical/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        
        const tbody = document.getElementById('historicalData');
        tbody.innerHTML = '';
        
        data.forEach(entry => {
            const row = createHistoricalRow(entry);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading historical data:', error);
    }
}

// Create historical data row
function createHistoricalRow(data = null) {
    const tr = document.createElement('tr');
    const today = new Date().toISOString().split('T')[0];
    
    tr.innerHTML = `
        <td><input type="date" value="${data ? data.date : today}"></td>
        <td contenteditable="true">${data ? data.sessions : '0'}</td>
        <td contenteditable="true">${data ? `₹${data.sales}` : '₹0'}</td>
        <td contenteditable="true">${data ? data.orders : '0'}</td>
        <td contenteditable="true">${data ? `${data.conversion}%` : '0%'}</td>
        <td>
            <button class="btn btn-primary" onclick="saveHistoricalRow(this)">Save</button>
            <button class="btn btn-danger" onclick="deleteHistoricalRow(this)">Delete</button>
        </td>
    `;
    
    return tr;
}

// Add new historical row
function addHistoricalRow() {
    const tbody = document.getElementById('historicalData');
    const row = createHistoricalRow();
    tbody.appendChild(row);
}

// Save historical row
async function saveHistoricalRow(button) {
    const userId = document.getElementById('userSelect').value;
    if (!userId) {
        alert('Please select a user first');
        return;
    }

    const row = button.closest('tr');
    const data = {
        date: row.cells[0].querySelector('input').value,
        sessions: parseInt(row.cells[1].textContent),
        sales: parseInt(row.cells[2].textContent.replace('₹', '')),
        orders: parseInt(row.cells[3].textContent),
        conversion: parseFloat(row.cells[4].textContent.replace('%', ''))
    };

    try {
        const response = await fetch(`/api/dashboard/historical/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to save historical data');
        }

        // Update metrics to reflect the latest data
        await updateMetricsFromHistorical(userId);
        
        // Reload the data to show updates
        loadUserMetrics(userId);
    } catch (error) {
        console.error('Error saving historical data:', error);
        alert('Failed to save data. Please try again.');
    }
}

// Update metrics based on historical data
async function updateMetricsFromHistorical(userId) {
    try {
        const response = await fetch(`/api/dashboard/historical/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        
        if (data.length === 0) return;
        
        // Get the latest entry
        const latest = data[data.length - 1];
        
        // Calculate changes from previous entry
        const previous = data.length > 1 ? data[data.length - 2] : null;
        
        const metrics = {
            sessions: {
                value: latest.sessions,
                change: previous ? ((latest.sessions - previous.sessions) / previous.sessions) * 100 : 0
            },
            total_sales: {
                value: latest.sales,
                change: previous ? ((latest.sales - previous.sales) / previous.sales) * 100 : 0
            },
            orders: {
                value: latest.orders,
                change: previous ? ((latest.orders - previous.orders) / previous.orders) * 100 : 0
            },
            conversion_rate: {
                value: latest.conversion,
                change: previous ? latest.conversion - previous.conversion : 0
            }
        };
        
        // Update each metric
        for (const [metric, data] of Object.entries(metrics)) {
            await fetch(`/api/dashboard/metrics/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metric,
                    value: data.value,
                    change: data.change
                })
            });
        }
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
}

// Delete historical row
async function deleteHistoricalRow(button) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }

    const userId = document.getElementById('userSelect').value;
    const row = button.closest('tr');
    const date = row.cells[0].querySelector('input').value;

    try {
        const response = await fetch(`/api/dashboard/historical/${userId}/${date}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete historical data');
        }

        row.remove();
        // Update metrics after deletion
        await updateMetricsFromHistorical(userId);
        loadUserMetrics(userId);
    } catch (error) {
        console.error('Error deleting historical data:', error);
        alert('Failed to delete data. Please try again.');
    }
}

// Update metric
async function updateMetric(button) {
    const userId = document.getElementById('userSelect').value;
    if (!userId) {
        alert('Please select a user first');
        return;
    }

    const row = button.closest('tr');
    const metric = row.cells[0].textContent.toLowerCase().replace(' ', '_');
    const value = parseFloat(row.cells[1].textContent.replace('₹', '').replace('%', ''));
    const change = parseFloat(row.cells[2].textContent.replace('↑', '').replace('↓', '').replace('%', ''));

    try {
        const response = await fetch(`/api/dashboard/metrics/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                metric,
                value,
                change
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update metric');
        }

        row.cells[3].textContent = new Date().toLocaleString();
        
        // Show success feedback
        button.textContent = 'Saved!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Save';
            button.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Error updating metric:', error);
        alert('Failed to update metric. Please try again.');
    }
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Find an appropriate container
    let container = document.getElementById('logoContentContainer');
    if (!container) {
        container = document.querySelector('.content-container');
    }
    
    if (container) {
        container.insertAdjacentElement('afterbegin', successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.getElementById('logoContentContainer');
    if (container) {
        container.insertAdjacentElement('afterbegin', errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Update email marketing stats
async function updateEmailStats() {
    try {
        const userId = document.getElementById('userSelect').value;
        if (!userId) {
            showError('Please select a user first');
            return;
        }

        // Get values and remove any formatting
        const sent = parseInt(document.getElementById('sentEmails').textContent.replace(/[^0-9]/g, ''));
        const total = parseInt(document.getElementById('totalEmails').textContent.replace(/[^0-9]/g, ''));

        console.log('Updating email stats:', { userId, sent, total });

        // Validate input
        if (isNaN(sent) || isNaN(total)) {
            showError('Please enter valid numbers');
            return;
        }

        if (sent > total) {
            showError('Sent emails cannot be greater than total emails');
            return;
        }

        const button = document.querySelector('#emailStats button');
        button.disabled = true;
        button.textContent = 'Saving...';

        const response = await fetch(`/api/email-marketing/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sent: sent,
                total: total
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update email stats');
        }

        // Update the display with padded numbers
        document.getElementById('sentEmails').textContent = String(sent).padStart(4, '0');
        document.getElementById('totalEmails').textContent = String(total).padStart(4, '0');

        showSuccess('Email stats updated successfully');

        // Add automation status message
        const automationStatus = document.createElement('div');
        automationStatus.className = 'automation-status';
        automationStatus.textContent = 'Your email is being automated';
        document.querySelector('#emailStats').appendChild(automationStatus);

        // Remove automation status after 5 seconds
        setTimeout(() => {
            automationStatus.remove();
        }, 5000);

        // Refresh the dashboard data if we're updating the currently logged-in user
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser && loggedInUser.userId === userId) {
            // Trigger a refresh of the dashboard if it exists
            if (window.parent && window.parent.loadWidgets) {
                window.parent.loadWidgets();
            }
        }

    } catch (error) {
        console.error('Error updating email stats:', error);
        showError(error.message || 'Failed to update email stats');
    } finally {
        const button = document.querySelector('#emailStats button');
        button.disabled = false;
        button.textContent = 'Save';
    }
}

// Load email marketing stats
async function loadEmailStats(userId) {
    try {
        console.log('Loading email stats for user:', userId);
        const response = await fetch(`/api/email-marketing/${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch email stats');
        }
        
        const stats = await response.json();
        console.log('Received email stats:', stats);
        
        // Update the display with padded numbers
        document.getElementById('sentEmails').textContent = String(stats.sent || 0).padStart(4, '0');
        document.getElementById('totalEmails').textContent = String(stats.total || 0).padStart(4, '0');
    } catch (error) {
        console.error('Error loading email stats:', error);
        showError('Failed to load email stats');
    }
}

// Load email marketing suggestions
async function loadEmailSuggestions(userId) {
    try {
        const url = userId 
            ? `/api/email-marketing/suggestions?userId=${userId}`
            : '/api/email-marketing/suggestions';
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        const suggestions = await response.json();
        const tbody = document.getElementById('emailSuggestions');
        tbody.innerHTML = '';

        suggestions.forEach(suggestion => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${suggestion.username}</td>
                <td>${suggestion.suggestion}</td>
                <td>${new Date(suggestion.timestamp).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading suggestions:', error);
        showError('Failed to load suggestions');
    }
}

// Submit email marketing suggestion
async function submitSuggestion(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        const userId = document.getElementById('userSelect').value;
        if (!userId) {
            throw new Error('Please select a user first');
        }
        
        const suggestion = document.getElementById('suggestionInput').value;
        const username = document.getElementById('userSelect').selectedOptions[0].text.split(' ')[0];
        
        const response = await fetch('/api/email-marketing/suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                username,
                suggestion
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit suggestion');
        }
        
        // Clear the input and show success message
        document.getElementById('suggestionInput').value = '';
        showSuccess('Suggestion submitted successfully');
        
        // Reload suggestions for the current user
        await loadEmailSuggestions(userId);
        
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showError(error.message || 'Failed to submit suggestion');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Add debounce function at the top
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update website state with debouncing
const debouncedUpdateWebsiteState = debounce(async (state) => {
    const userId = document.getElementById('userSelect').value;
    if (!userId) {
        showError('Please select a user first');
        return false;
    }

    try {
        console.log(`Updating website state to ${state} for user ${userId}`);
        
        // Simple state update endpoint
        const response = await fetch(`/api/website-config/${userId}/state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: state })
        });

        if (!response.ok) {
            throw new Error(`Failed to update website state: ${response.status}`);
        }

        // Update UI elements directly
        const state1Form = document.getElementById('state1Form');
        const state2Preview = document.getElementById('state2Preview');
        const stateText = document.getElementById('stateText');

        if (state1Form) state1Form.style.display = state === 1 ? 'block' : 'none';
        if (state2Preview) state2Preview.style.display = state === 2 ? 'block' : 'none';
        if (stateText) stateText.textContent = state === 2 ? 'Live Website' : 'Configuration';

        // Notify the dashboard about the update
        notifyDashboardOfWebsiteUpdate();
        
        showSuccess('Website state updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating website state:', error);
        showError('Failed to update website state: ' + error.message);
        return false;
    }
}, 500); // Reduced from 1000ms to 500ms for faster response

// Store color change history
let colorChangeHistory = [];

// Listen for website configuration updates from dashboard
window.addEventListener('message', async (event) => {
    try {
        if (event.data && event.data.type === 'websiteConfigUpdate') {
            console.log('Received website config update from dashboard:', event.data);
            
            // Update color scheme
            if (event.data.colorScheme) {
                const { primary, secondary, tertiary } = event.data.colorScheme;
                console.log('Updating colors from dashboard:', { primary, secondary, tertiary });
                
                // Update color input fields (readonly)
                const primaryColorInput = document.getElementById('primaryColor');
                const secondaryColorInput = document.getElementById('secondaryColor');
                const tertiaryColorInput = document.getElementById('tertiaryColor');
                
                if (primaryColorInput) {
                    primaryColorInput.value = primary;
                    primaryColorInput.readOnly = true;
                }
                if (secondaryColorInput) {
                    secondaryColorInput.value = secondary;
                    secondaryColorInput.readOnly = true;
                }
                if (tertiaryColorInput) {
                    tertiaryColorInput.value = tertiary;
                    tertiaryColorInput.readOnly = true;
                }
                
                // Apply colors to the page
                applyColorScheme(primary, secondary, tertiary);
                
                // Add to color history
                addToColorHistory(primary, secondary, tertiary);
            }
        }
    } catch (error) {
        console.error('Error handling website config update:', error);
    }
});

// Function to add entry to color history
function addToColorHistory(primary, secondary, tertiary) {
    // Add to history with current timestamp
    const timestamp = new Date().toLocaleString();
    colorChangeHistory.push({
        timestamp,
        primary,
        secondary,
        tertiary
    });
    
    // Update history table
    updateColorHistoryTable();
    
    // Limit history to last 10 entries
    if (colorChangeHistory.length > 10) {
        colorChangeHistory.shift();
    }
}

// Function to update color history table
function updateColorHistoryTable() {
    console.log('Updating color history table', colorChangeHistory);
    
    // Find or create color history section
    let colorHistorySection = document.getElementById('colorHistorySection');
    
    if (!colorHistorySection) {
        // Create section if it doesn't exist
        console.log('Creating color history section');
        
        // Look for the website config form
        const websiteConfigForm = document.getElementById('websiteConfigForm');
        if (websiteConfigForm) {
            colorHistorySection = document.createElement('div');
            colorHistorySection.id = 'colorHistorySection';
            colorHistorySection.className = 'mt-4 section';
            colorHistorySection.innerHTML = `
                <h4>Color Scheme History</h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Primary Color</th>
                                <th>Secondary Color</th>
                                <th>Tertiary Color</th>
                            </tr>
                        </thead>
                        <tbody id="colorHistoryTableBody">
                        </tbody>
                    </table>
                </div>
            `;
            
            // Insert after the form
            websiteConfigForm.parentNode.insertBefore(colorHistorySection, websiteConfigForm.nextSibling);
            } else {
            console.error('Website config form not found, cannot add color history table');
            return;
        }
    }
    
    // Update table with history entries
    const tableBody = document.getElementById('colorHistoryTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        // Add entries in reverse order (newest first)
        colorChangeHistory.slice().reverse().forEach(entry => {
            const row = document.createElement('tr');
            
            // Create color sample cells
            row.innerHTML = `
                <td>${entry.timestamp}</td>
                <td><span style="display:inline-block; width:20px; height:20px; background-color:${entry.primary}; border:1px solid #ccc; border-radius:3px; margin-right:10px;"></span> ${entry.primary}</td>
                <td><span style="display:inline-block; width:20px; height:20px; background-color:${entry.secondary}; border:1px solid #ccc; border-radius:3px; margin-right:10px;"></span> ${entry.secondary}</td>
                <td><span style="display:inline-block; width:20px; height:20px; background-color:${entry.tertiary}; border:1px solid #ccc; border-radius:3px; margin-right:10px;"></span> ${entry.tertiary}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
}

// Initialize user content page
function initUserContentPage() {
    console.log('Initializing user content page');
    
    // Add all CSS styles
    const styleEl = document.createElement('style');
    styleEl.textContent = generalCSS;
    document.head.appendChild(styleEl);
    
    // Make color inputs readonly
    const primaryColorInput = document.getElementById('primaryColor');
    const secondaryColorInput = document.getElementById('secondaryColor');
    const tertiaryColorInput = document.getElementById('tertiaryColor');
    
    if (primaryColorInput) primaryColorInput.readOnly = true;
    if (secondaryColorInput) secondaryColorInput.readOnly = true;
    if (tertiaryColorInput) tertiaryColorInput.readOnly = true;
}

// Load website configuration
async function loadWebsiteConfig(userId) {
    try {
        const response = await fetch(`/api/website-config/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to load website configuration');
        }
        
        const config = await response.json();
        console.log('Loaded website config:', config);
        
        // Update form fields with current values
        document.getElementById('brandName').value = config.brandName || '';
        document.getElementById('websiteType').value = config.websiteType || 'business';
        document.getElementById('referenceWebsite').value = config.referenceWebsite || '';
        
        // Update color inputs and make them read-only
        if (config.colorScheme) {
            const primaryColorInput = document.getElementById('primaryColor');
            const secondaryColorInput = document.getElementById('secondaryColor');
            const tertiaryColorInput = document.getElementById('tertiaryColor');
            
            if (primaryColorInput) {
                primaryColorInput.value = config.colorScheme.primary || '#000000';
                primaryColorInput.readOnly = true;
            }
            if (secondaryColorInput) {
                secondaryColorInput.value = config.colorScheme.secondary || '#ffffff';
                secondaryColorInput.readOnly = true;
            }
            if (tertiaryColorInput) {
                tertiaryColorInput.value = config.colorScheme.tertiary || '#cccccc';
                tertiaryColorInput.readOnly = true;
            }
            
            // Apply the color scheme to the page
            applyColorScheme(
                config.colorScheme.primary,
                config.colorScheme.secondary,
                config.colorScheme.tertiary
            );
            
            // Initialize color history with current values
            if (colorChangeHistory.length === 0) {
                addToColorHistory(
                    config.colorScheme.primary,
                    config.colorScheme.secondary,
                    config.colorScheme.tertiary
                );
            }
        }
        
        // Store the current config
        currentConfig = config;
        
        return config;
    } catch (error) {
        console.error('Error loading website configuration:', error);
        showError('Failed to load website configuration');
        return null;
    }
}

// Function to update preview image based on URL input
function updatePreviewImage() {
    const previewUrl = document.getElementById('websitePreviewUrl').value;
    const previewImg = document.getElementById('previewImage');
    
    if (previewImg) {
        if (previewUrl && previewUrl.trim() !== '') {
            previewImg.src = previewUrl;
        } else {
            // Use default website image if no URL is provided
            previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlOWVjZWYiLz48cGF0aCBkPSJNMTczLjMzMyAxMTYuNjY3SDIyNi42NjdWMTQwSDI1MFYxMTYuNjY3QzI1MCAxMDguMDMzIDI0My4wOTggMTAwIDIzMy4zMzMgMTAwSDE2Ni42NjdDMTU2LjkwMiAxMDAgMTUwIDEwOC4wMzMgMTUwIDExNi42NjdWMTgzLjMzM0MxNTAgMTkxLjk2NyAxNTYuOTAyIDIwMCAxNjYuNjY3IDIwMEgyMzMuMzMzQzI0My4wOTggMjAwIDI1MCAxOTEuOTY3IDI1MCAxODMuMzMzVjE2MEgyMjYuNjY3VjE4My4zMzNIMTczLjMzM1YxMTYuNjY3WiIgZmlsbD0iIzZjNzU3ZCIvPjwvc3ZnPg==';
        }
        
        // Add error handler
        previewImg.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlOWVjZWYiLz48cGF0aCBkPSJNMTczLjMzMyAxMTYuNjY3SDIyNi42NjdWMTQwSDI1MFYxMTYuNjY3QzI1MCAxMDguMDMzIDI0My4wOTggMTAwIDIzMy4zMzMgMTAwSDE2Ni42NjdDMTU2LjkwMiAxMDAgMTUwIDEwOC4wMzMgMTUwIDExNi42NjdWMTgzLjMzM0MxNTAgMTkxLjk2NyAxNTYuOTAyIDIwMCAxNjYuNjY3IDIwMEgyMzMuMzMzQzI0My4wOTggMjAwIDI1MCAxOTEuOTY3IDI1MCAxODMuMzMzVjE2MEgyMjYuNjY3VjE4My4zMzNIMTczLjMzM1YxMTYuNjY3WiIgZmlsbD0iIzZjNzU3ZCIvPjwvc3ZnPg==';
            console.error('Failed to load preview image:', previewUrl);
        };
    }
}

// Save website details
async function saveWebsiteDetails() {
    try {
        const saveButton = document.getElementById('saveWebsiteDetails');
        const websiteUrlInput = document.getElementById('websiteUrl');
        const previewUrlInput = document.getElementById('websitePreviewUrl');
        
        // Validate inputs
        if (!websiteUrlInput || !previewUrlInput) {
            console.error('Input elements not found');
            return;
        }
        
        // Get values
        const websiteUrl = websiteUrlInput.value.trim();
        const previewImageUrl = previewUrlInput.value.trim();
        
        // Validation
        if (websiteUrl === '') {
            showError('Please enter a website URL');
            return;
        }
        
        // Change button state
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Get userId
        const userId = document.getElementById('userSelect').value;
        if (!userId) {
            showError('Please select a user first');
            saveButton.disabled = false;
            saveButton.textContent = 'Save Website Details';
            return;
        }
        
        // Prepare data
        const websiteData = {
            state: 2,
            websiteUrl: websiteUrl,
            previewImageUrl: previewImageUrl
        };
        
        console.log('Saving website details:', websiteData);
        
        // Save to server
        const response = await fetch(`/api/website-config/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(websiteData)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        // Show success message
        showSuccess('Website details saved successfully!');
        
        // Reset button
        saveButton.disabled = false;
        saveButton.textContent = 'Save Website Details';
        
        // Notify the dashboard about the update
        notifyDashboardOfWebsiteUpdate();
        
    } catch (error) {
        console.error('Error saving website details:', error);
        showError(`Error: ${error.message}`);
        
        // Reset button
        const saveButton = document.getElementById('saveWebsiteDetails');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Website Details';
        }
    }
}

function notifyDashboardOfWebsiteUpdate() {
    console.log('Notifying dashboard of website config update');
    
    // Try to notify parent window if in an iframe
    try {
        if (window.parent && window.parent !== window) {
            // Send both modern structured message and legacy format for compatibility
            console.log('Sending websiteConfigUpdated message to parent window');
            
            // Modern format with structured data
            window.parent.postMessage({
                type: 'websiteConfigUpdated',
                userId: document.getElementById('userSelect').value
            }, '*');
            
            // Legacy format for backward compatibility
            window.parent.postMessage('websiteConfigUpdated', '*');
            
            console.log('Website update notification sent in both formats');
        } else {
            console.log('Not in an iframe, no parent to notify');
        }
    } catch (error) {
        console.error('Error notifying parent window:', error);
    }
}

// Document load event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page first
    initUserContentPage();
    
    // Then load users
    loadUsers().then(() => {
        // Add event listener for user selection
        const userSelect = document.getElementById('userSelect');
        if (userSelect) {
            userSelect.addEventListener('change', function(event) {
                const userId = event.target.value;
                if (userId) {
                    loadEmailStats(userId);
                    loadWebsiteConfig(userId);
                    loadEmailSuggestions(userId);
                    loadLogoPreferenceNotes(userId);
                    // Load other data as needed
                }
            });
        }

        // Add event listener for state toggle
        const stateToggle = document.getElementById('stateToggle');
        if (stateToggle) {
            stateToggle.addEventListener('change', function(event) {
                console.log('Toggle changed, new state:', event.target.checked ? 2 : 1);
                const newState = event.target.checked ? 2 : 1;
                debouncedUpdateWebsiteState(newState);
            });
        } else {
            console.error('State toggle element not found in DOM');
        }

        // Add save website details button event listener
        const saveWebsiteDetailsBtn = document.getElementById('saveWebsiteDetails');
        if (saveWebsiteDetailsBtn) {
            saveWebsiteDetailsBtn.addEventListener('click', saveWebsiteDetails);
        }

        // Add preview URL input change listener
        const websitePreviewUrlInput = document.getElementById('websitePreviewUrl');
        if (websitePreviewUrlInput) {
            websitePreviewUrlInput.addEventListener('input', updatePreviewImage);
        }

        // Add event listener for email suggestion form
        const suggestionForm = document.getElementById('suggestionForm');
        if (suggestionForm) {
            suggestionForm.addEventListener('submit', submitSuggestion);
        }

        // Add event listener for website query form
        const websiteQueryForm = document.getElementById('websiteQueryForm');
        if (websiteQueryForm) {
            websiteQueryForm.addEventListener('submit', submitWebsiteQuery);
        }

        // Add event listener for website config form
        const websiteConfigForm = document.getElementById('websiteConfigForm');
        if (websiteConfigForm) {
            websiteConfigForm.addEventListener('submit', submitWebsiteConfig);
        }

        // Select first user by default if available
        if (userSelect && userSelect.options.length > 1) {
            userSelect.selectedIndex = 1; // Select the first actual user
            userSelect.dispatchEvent(new Event('change'));
        }
    });
});

// Submit website query (from state 2)
async function submitWebsiteQuery(event) {
    event.preventDefault();
    
    try {
        const userId = document.getElementById('userSelect').value;
        if (!userId) {
            showError('Please select a user first');
            return;
        }
        
        const changesInput = document.getElementById('websiteQueryInput');
        if (!changesInput) {
            console.error('Website query input not found');
            return;
        }
        
        const changes = changesInput.value.trim();
        if (!changes) {
            showError('Please enter the changes you want');
            return;
        }
        
        const submitButton = event.target.querySelector('button');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
        
        const response = await fetch(`/api/website-config/${userId}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ changes })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit website query');
        }
        
        // Clear the form and show success
        changesInput.value = '';
        showSuccess('Your changes have been submitted successfully!');
        
        // Reload the queries to show the newly submitted one
        loadWebsiteQueries(userId);
        
        // Notify dashboard
        notifyDashboardOfWebsiteUpdate();
        
    } catch (error) {
        console.error('Error submitting website query:', error);
        showError(`Error: ${error.message}`);
    } finally {
        const submitButton = event.target.querySelector('button');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Changes';
        }
    }
}

// Load logo preference notes
async function loadLogoPreferenceNotes(userId) {
    try {
        console.log('Loading logo preference notes for user:', userId);
        const response = await fetch(`/api/logo-preference/${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch logo preferences');
        }
        
        const preferences = await response.json();
        console.log('Received logo preferences:', preferences);
        
        // Update the logo notes table
        const tbody = document.getElementById('logoNotesTable').querySelector('tbody');
        tbody.innerHTML = '';
        
        if (preferences.notes && preferences.notes.length > 0) {
            preferences.notes.forEach(note => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(note.timestamp).toLocaleString()}</td>
                    <td>${note.text}</td>
                    <td>${note.status || 'Pending'}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="3" class="text-center">No logo change requests found</td>
            `;
            tbody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading logo preference notes:', error);
    }
}

// Load website queries
async function loadWebsiteQueries(userId) {
    try {
        const response = await fetch(`/api/website-config/${userId}/queries`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch website queries');
        }
        
        const queries = await response.json();
        const tbody = document.getElementById('websiteQueries');
        
        if (!tbody) {
            console.error('Website queries table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (queries.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" class="text-center">No website queries found</td>`;
            tbody.appendChild(row);
            return;
        }
        
        queries.forEach(query => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(query.timestamp).toLocaleString()}</td>
                <td>${query.changes}</td>
                <td>${query.status || 'Pending'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading website queries:', error);
    }
}

// Submit website configuration (from state 1)
async function submitWebsiteConfig(event) {
    event.preventDefault();
    
    try {
        const userId = document.getElementById('userSelect').value;
        if (!userId) {
            showError('Please select a user first');
            return;
        }
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
        
        // Get form data
        const brandName = document.getElementById('brandName').value;
        const websiteType = document.getElementById('websiteType').value;
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        const tertiaryColor = document.getElementById('tertiaryColor').value;
        const referenceWebsite = document.getElementById('referenceWebsite').value;
        
        // Prepare data
        const configData = {
            state: 1,
            brandName,
            websiteType,
            colorScheme: {
                primary: primaryColor,
                secondary: secondaryColor,
                tertiary: tertiaryColor
            },
            referenceWebsite
        };
        
        // Send to server
        const response = await fetch(`/api/website-config/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save website configuration');
        }
        
        // Show success message
        showSuccess('Website configuration submitted successfully!');
        
        // Notify dashboard
        notifyDashboardOfWebsiteUpdate();
        
    } catch (error) {
        console.error('Error submitting website configuration:', error);
        showError(`Error: ${error.message}`);
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Configuration';
        }
    }
}