'use strict';

// Initialize userContent variables and functions here

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
        console.log('Loading metrics for user:', userId);
        const response = await fetch(`/api/dashboard/metrics/${userId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response (${response.status}):`, errorText);
            throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
        }
        
        const metrics = await response.json();
        console.log('Received metrics data:', metrics);
        
        // Update metrics table
        updateMetricsTable(metrics);
        
        // Load historical data
        await loadHistoricalData(userId);
        
        return true;
    } catch (error) {
        console.error('Error loading metrics:', error);
        const metricsTable = document.getElementById('metricsTable');
        if (metricsTable) {
            const rows = metricsTable.querySelectorAll('tr');
            rows.forEach(row => {
                if (row.cells.length >= 4) {
                    row.cells[3].textContent = 'Error loading data';
                }
            });
        }
        return false;
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
        console.log('Loading historical data for user:', userId);
        const response = await fetch(`/api/dashboard/historical/${userId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response (${response.status}):`, errorText);
            throw new Error(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received historical data:', data);
        
        const tbody = document.getElementById('historicalData');
        if (!tbody) {
            console.error('Historical data table body not found');
            return false;
        }
        
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            console.log('No historical data available for user');
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="6" style="text-align: center;">No historical data available</td>`;
            tbody.appendChild(emptyRow);
            return true;
        }
        
        data.forEach(entry => {
            const row = createHistoricalRow(entry);
            tbody.appendChild(row);
        });
        
        return true;
    } catch (error) {
        console.error('Error loading historical data:', error);
        
        const tbody = document.getElementById('historicalData');
        if (tbody) {
            tbody.innerHTML = '';
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `<td colspan="6" style="text-align: center; color: #dc3545;">Error loading historical data</td>`;
            tbody.appendChild(errorRow);
        }
        
        return false;
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

// Initialize website configuration
async function loadWebsiteConfig(userId) {
    try {
        console.log('Loading website configuration for user:', userId);
        currentUserId = userId;
        
        const response = await fetch(`/api/website-config/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch website configuration: ${response.status}`);
        }
        
        const config = await response.json();
        currentConfig = config;
        console.log('Loaded website config:', config);
        
        // Update state toggle and text
        const stateToggle = document.getElementById('stateToggle');
        const state1Form = document.getElementById('state1Form');
        const state2Preview = document.getElementById('state2Preview');
        const stateText = document.getElementById('stateText');
        
        if (stateToggle) {
            console.log('Setting toggle state to:', config.state === 2);
            stateToggle.checked = config.state === 2;
        } else {
            console.error('stateToggle element not found');
        }
        
        // Update section visibility
        if (state1Form) state1Form.style.display = config.state === 1 ? 'block' : 'none';
        if (state2Preview) state2Preview.style.display = config.state === 2 ? 'block' : 'none';
        if (stateText) stateText.textContent = config.state === 2 ? 'Live Website' : 'Configuration';

        // Update form fields
        const brandNameInput = document.getElementById('brandName');
        const websiteTypeInput = document.getElementById('websiteType');
        const primaryColorInput = document.getElementById('primaryColor');
        const secondaryColorInput = document.getElementById('secondaryColor');
        const tertiaryColorInput = document.getElementById('tertiaryColor');
        const referenceWebsiteInput = document.getElementById('referenceWebsite');
        const websiteUrlInput = document.getElementById('websiteUrl');
        const websitePreviewUrlInput = document.getElementById('websitePreviewUrl');

        if (brandNameInput) brandNameInput.value = config.brandName || '';
        if (websiteTypeInput) websiteTypeInput.value = config.websiteType || '';
        if (primaryColorInput && config.colorScheme) primaryColorInput.value = config.colorScheme.primary || '#000000';
        if (secondaryColorInput && config.colorScheme) secondaryColorInput.value = config.colorScheme.secondary || '#ffffff';
        if (tertiaryColorInput && config.colorScheme) tertiaryColorInput.value = config.colorScheme.tertiary || '#cccccc';
        if (referenceWebsiteInput) referenceWebsiteInput.value = config.referenceWebsite || '';
        if (websiteUrlInput) websiteUrlInput.value = config.websiteUrl || '';
        if (websitePreviewUrlInput) websitePreviewUrlInput.value = config.previewImageUrl || '';

        // Update preview image with the URL
        const previewImg = document.getElementById('previewImage');
        if (previewImg) {
            if (config.previewImageUrl && config.previewImageUrl.trim() !== '') {
                previewImg.src = config.previewImageUrl;
                previewImg.style.display = 'block';
            } else {
                // Use default website image if no URL is provided
                previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlOWVjZWYiLz48cGF0aCBkPSJNMTczLjMzMyAxMTYuNjY3SDIyNi42NjdWMTQwSDI1MFYxMTYuNjY3QzI1MCAxMDguMDMzIDI0My4wOTggMTAwIDIzMy4zMzMgMTAwSDE2Ni42NjdDMTU2LjkwMiAxMDAgMTUwIDEwOC4wMzMgMTUwIDExNi42NjdWMTgzLjMzM0MxNTAgMTkxLjk2NyAxNTYuOTAyIDIwMCAxNjYuNjY3IDIwMEgyMzMuMzMzQzI0My4wOTggMjAwIDI1MCAxOTEuOTY3IDI1MCAxODMuMzMzVjE2MEgyMjYuNjY3VjE4My4zMzNIMTczLjMzM1YxMTYuNjY3WiIgZmlsbD0iIzZjNzU3ZCIvPjwvc3ZnPg==';
                previewImg.style.display = 'block';
            }
        }

        // Also load website queries to update the table
        loadWebsiteQueries(userId);
    } catch (error) {
        console.error('Error loading website configuration:', error);
        showError('Failed to load website configuration: ' + error.message);
    }
}

// Initialize user content page
function initUserContentPage() {
    console.log('Initializing user content page');
    
    // Add all CSS styles
    const styleEl = document.createElement('style');
    styleEl.textContent = generalCSS;
    document.head.appendChild(styleEl);
    
    // Only add Instagram marketing styles if the function exists
    if (typeof addInstagramMarketingStyles === 'function') {
        addInstagramMarketingStyles();
    } else {
        console.log('Instagram marketing styles function not loaded yet');
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
    console.log('Initializing user content page');
    
    initUIEventListeners();
    
    // Check if user is coming from dashboard (should have userId in localStorage)
    const userId = localStorage.getItem('userId');
    
    // Load users into the dropdown regardless
    loadUsers();
    
    // Set up the user select change listener
    const userSelect = document.getElementById('userSelect');
    if (userSelect) {
        userSelect.addEventListener('change', function() {
            const selectedUserId = this.value;
            if (selectedUserId) {
                console.log('User selected from dropdown:', selectedUserId);
                // Clear any info messages
                const infoMessage = document.querySelector('.info-message');
                if (infoMessage) {
                    infoMessage.remove();
                }
                
                // Store the selected userId in case we need it later
                localStorage.setItem('lastSelectedUser', selectedUserId);
                
                // Load data for the selected user
                loadUserData(selectedUserId);
                
                // Setup UI-specific event listeners for this user
                setupUIEventListeners(selectedUserId);
            }
        });
    }
    
    if (userId) {
        console.log('User ID found in localStorage:', userId);
        
        // If user selector exists, set the value
        const userSelect = document.getElementById('userSelect');
        if (userSelect) {
            // Wait a moment for users to load
            setTimeout(() => {
                userSelect.value = userId;
                
                // Trigger a change event to load the selected user's data
                const event = new Event('change');
                userSelect.dispatchEvent(event);
            }, 500);
        } else {
            // If no user selector, load data directly
            loadUserData(userId);
            setupUIEventListeners(userId);
        }
    } else {
        console.log('No user ID found in localStorage, waiting for user selection');
        // User will need to select from dropdown
        const userSelectContainer = document.querySelector('.user-select-container');
        if (userSelectContainer) {
            userSelectContainer.style.display = 'block';
        }
        
        // Show a gentle message to select a user
        const messageElement = document.createElement('div');
        messageElement.className = 'info-message';
        messageElement.textContent = 'Please select a user to manage content.';
        messageElement.style.padding = '10px';
        messageElement.style.backgroundColor = '#e7f3ff';
        messageElement.style.border = '1px solid #b9d4ff';
        messageElement.style.borderRadius = '4px';
        messageElement.style.margin = '10px 0';
        
        // Insert the message at the top of the container
        const container = document.querySelector('.container');
        if (container && container.firstChild) {
            container.insertBefore(messageElement, container.firstChild);
        }
    }
});

// Initialize UI event listeners that don't depend on user selection
function initUIEventListeners() {
    console.log('Initializing UI event listeners');
    
    // Set up the website form listeners
    const websiteConfigForm = document.getElementById('websiteConfigForm');
    if (websiteConfigForm) {
        websiteConfigForm.addEventListener('submit', submitWebsiteConfig);
    }
    
    // Set up the website query form
    const websiteQueryForm = document.getElementById('websiteQueryForm');
    if (websiteQueryForm) {
        websiteQueryForm.addEventListener('submit', submitWebsiteQuery);
    }
    
    // Set up the suggestion form
    const suggestionForm = document.getElementById('suggestionForm');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', submitSuggestion);
    }
    
    // Set up the preview URL input
    const previewUrlInput = document.getElementById('websitePreviewUrl');
    if (previewUrlInput) {
        previewUrlInput.addEventListener('input', updatePreviewImage);
    }
    
    // Set up the save website details button
    const saveWebsiteBtn = document.getElementById('saveWebsiteDetails');
    if (saveWebsiteBtn) {
        saveWebsiteBtn.addEventListener('click', saveWebsiteDetails);
    }
}

// Setup UI event listeners specific to the selected user
function setupUIEventListeners(userId) {
    console.log('Setting up user-specific event listeners for user:', userId);
    
    // Add event listener for state toggle
    const stateToggle = document.getElementById('stateToggle');
    if (stateToggle) {
        // Remove any existing event listeners
        const newToggle = stateToggle.cloneNode(true);
        stateToggle.parentNode.replaceChild(newToggle, stateToggle);
        
        // Add new event listener
        newToggle.addEventListener('change', function() {
            console.log('State toggle changed to:', this.checked ? 2 : 1);
            const newState = this.checked ? 2 : 1;
            debouncedUpdateWebsiteState(newState);
        });
    }
}

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
        console.log('Loading website queries for user:', userId);
        const response = await fetch(`/api/website-config/${userId}/queries`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response (${response.status}):`, errorText);
            throw new Error(`Failed to fetch website queries: ${response.status} ${response.statusText}`);
        }
        
        const queries = await response.json();
        console.log('Received website queries:', queries);
        
        const tbody = document.getElementById('websiteQueries');
        
        if (!tbody) {
            console.error('Website queries table body not found');
            return false;
        }
        
        tbody.innerHTML = '';
        
        if (!queries || queries.length === 0) {
            console.log('No website queries found for user');
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" class="text-center">No website queries found</td>`;
            tbody.appendChild(row);
            return true;
        }
        
        // Reverse the array to show newest first
        const sortedQueries = [...queries].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        sortedQueries.forEach(query => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(query.timestamp).toLocaleString()}</td>
                <td>${query.changes}</td>
                <td>${query.status || 'Pending'}</td>
            `;
            tbody.appendChild(row);
        });
        
        return true;
    } catch (error) {
        console.error('Error loading website queries:', error);
        
        const tbody = document.getElementById('websiteQueries');
        if (tbody) {
            tbody.innerHTML = '';
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `<td colspan="3" class="text-center" style="color: #dc3545;">Error loading website queries</td>`;
            tbody.appendChild(errorRow);
        }
        
        return false;
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

// Function to load user data
function loadUserData(userId) {
    console.log('Loading data for user ID:', userId);
    if (!userId) {
        console.error('User ID is empty in loadUserData');
        return;
    }
    
    // Set the currentUserId for persistence
    currentUserId = userId;
    
    // Clear any error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    try {
        // Load metrics and historical data
        loadUserMetrics(userId);
        
        // Load email and marketing data
        loadEmailStats(userId);
        loadEmailSuggestions(userId);
        
        // Load website configuration and related data
        loadWebsiteConfig(userId);
        loadWebsiteQueries(userId);
        
        // Load logo and preferences data
        loadLogoPreferenceNotes(userId);
        
        // Load Instagram marketing data if the function exists
        if (typeof loadInstagramMarketing === 'function') {
            console.log('Loading Instagram marketing data');
            loadInstagramMarketing(userId);
        } else {
            console.log('Instagram marketing function not available');
            // Try with our internal function
            loadInstagramMarketingData(userId);
        }
        
        // Load upcoming meetings data if the function exists
        if (typeof loadUpcomingMeetings === 'function') {
            console.log('Loading upcoming meetings data');
            loadUpcomingMeetings(userId);
        }
        
        console.log('All data loading functions triggered for user:', userId);
    } catch (error) {
        console.error('Error in loadUserData:', error);
        showErrorMessage('Error loading user data: ' + error.message);
    }
}

// Function to show error message
function showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    document.body.appendChild(errorContainer);
}

// Function to load email statistics
function loadEmailStats(userId) {
    console.log('Loading email stats for user:', userId);
    fetch(`/api/email-marketing/${userId}`)
        .then(response => response.json())
        .then(data => {
            updateEmailStatsDisplay(data);
        })
        .catch(error => {
            console.error('Error loading email stats:', error);
        });
}

// Function to update email stats display
function updateEmailStatsDisplay(data) {
    const sentElement = document.getElementById('emailsSent');
    const totalElement = document.getElementById('totalEmails');
    const rateElement = document.getElementById('conversionRate');
    
    if (sentElement && totalElement && rateElement) {
        sentElement.textContent = data.sent;
        totalElement.textContent = data.total;
        
        // Calculate and display conversion rate
        const rate = data.total > 0 ? ((data.sent / data.total) * 100).toFixed(1) : '0.0';
        rateElement.textContent = `${rate}%`;
    }
}

// Function to load website configuration
function loadWebsiteConfig(userId) {
    console.log('Loading website config for user:', userId);
    fetch(`/api/website-config/${userId}`)
        .then(response => response.json())
        .then(data => {
            // Update UI with website config data
            const stateToggle = document.getElementById('stateToggle');
            if (stateToggle) {
                stateToggle.checked = data.state === 2;
            }
            
            // Update other fields
            if (data.websiteUrl) {
                const websiteUrlInput = document.getElementById('websiteUrl');
                if (websiteUrlInput) websiteUrlInput.value = data.websiteUrl;
            }
            
            if (data.previewImageUrl) {
                const previewUrlInput = document.getElementById('websitePreviewUrl');
                if (previewUrlInput) previewUrlInput.value = data.previewImageUrl;
                
                const previewImage = document.getElementById('websitePreview');
                if (previewImage) previewImage.src = data.previewImageUrl;
            }
        })
        .catch(error => {
            console.error('Error loading website config:', error);
        });
}

// Function to load email suggestions
function loadEmailSuggestions(userId) {
    console.log('Loading email suggestions for user:', userId);
    fetch(`/api/email-marketing/suggestions?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            // Update UI with suggestions
            const suggestionsList = document.getElementById('suggestionsList');
            if (suggestionsList) {
                suggestionsList.innerHTML = '';
                
                if (data.length === 0) {
                    suggestionsList.innerHTML = '<p>No suggestions available.</p>';
                    return;
                }
                
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="suggestion-item">
                            <p>${item.suggestion}</p>
                            <small>Submitted: ${new Date(item.timestamp).toLocaleString()}</small>
                        </div>
                    `;
                    suggestionsList.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error('Error loading email suggestions:', error);
        });
}

// Function to load logo preference notes
function loadLogoPreferenceNotes(userId) {
    console.log('Loading logo preferences for user:', userId);
    fetch(`/api/logo-preference/${userId}`)
        .then(response => response.json())
        .then(data => {
            // Update UI with logo preference data
            const notesList = document.getElementById('logoNotesList');
            if (notesList) {
                notesList.innerHTML = '';
                
                if (!data.notes || data.notes.length === 0) {
                    notesList.innerHTML = '<p>No logo notes available.</p>';
                    return;
                }
                
                data.notes.forEach(note => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="note-item">
                            <p>${note.text}</p>
                            <small>Added: ${new Date(note.timestamp).toLocaleString()}</small>
                        </div>
                    `;
                    notesList.appendChild(li);
                });
            }
            
            // Update logo image if available
            if (data.logoUrl) {
                const logoPreview = document.getElementById('logoPreview');
                if (logoPreview) logoPreview.src = data.logoUrl;
            }
        })
        .catch(error => {
            console.error('Error loading logo preferences:', error);
        });
}

// Function to load Instagram marketing data
async function loadInstagramMarketingData(userId) {
    try {
        console.log('Loading Instagram marketing data for user:', userId);
        const response = await fetch(`/api/instagram-marketing/${userId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error loading Instagram data (${response.status}):`, errorText);
            throw new Error(`Failed to fetch Instagram data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received Instagram marketing data:', data);
        
        // Update Instagram marketing display
        updateInstagramDisplay(data);
        
        return true;
    } catch (error) {
        console.error('Error loading Instagram marketing data:', error);
        
        // Find Instagram marketing section and add error message
        const instagramSection = document.querySelector('.instagram-marketing');
        if (instagramSection) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Error loading Instagram marketing data';
            
            // Remove any existing error messages
            const existingErrors = instagramSection.querySelectorAll('.error-message');
            existingErrors.forEach(el => el.remove());
            
            // Add the new error message
            instagramSection.prepend(errorMsg);
        }
        
        return false;
    }
}

// Function to update Instagram marketing display
function updateInstagramDisplay(data) {
    try {
        console.log('Updating Instagram display with data:', data);
        
        // Update accounts reached input
        const accountsReachedInput = document.getElementById('accountsReached');
        if (accountsReachedInput) {
            accountsReachedInput.value = data.accountsReached || 0;
        }
        
        // Update leads converted input
        const leadsConvertedInput = document.getElementById('leadsConverted');
        if (leadsConvertedInput) {
            leadsConvertedInput.value = data.leadsConverted || 0;
        }
        
        // Update niche selection if available
        const nicheSelect = document.getElementById('instagramNiche');
        if (nicheSelect && data.niche) {
            // Select the option that matches the niche
            const options = Array.from(nicheSelect.options);
            const matchingOption = options.find(option => option.value === data.niche);
            
            if (matchingOption) {
                nicheSelect.value = data.niche;
            } else if (data.niche && data.niche.trim() !== '') {
                // If the niche isn't in the options, try to add it
                const newOption = document.createElement('option');
                newOption.value = data.niche;
                newOption.textContent = data.niche;
                nicheSelect.appendChild(newOption);
                nicheSelect.value = data.niche;
            }
        }
        
        // Update the niche preferences table if it exists
        const nichePreferencesTableBody = document.querySelector('#nichePreferencesTable tbody');
        if (nichePreferencesTableBody && data.preferences) {
            nichePreferencesTableBody.innerHTML = '';
            
            if (data.preferences && data.preferences.length > 0) {
                data.preferences.forEach(pref => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${pref.niche || 'Unknown'}</td>
                        <td>${pref.priority || 'Medium'}</td>
                        <td>${new Date(pref.timestamp).toLocaleString()}</td>
                    `;
                    nichePreferencesTableBody.appendChild(row);
                });
            } else {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = '<td colspan="3" class="text-center">No preferences set</td>';
                nichePreferencesTableBody.appendChild(emptyRow);
            }
        }
        
        console.log('Instagram display updated successfully');
    } catch (error) {
        console.error('Error updating Instagram display:', error);
    }
}

// Function to update website state
function updateWebsiteState(userId, state) {
    fetch(`/api/website-config/${userId}/state`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Website state updated:', data);
        
        // Update UI based on state
        const stateItems = document.querySelectorAll('.state-dependent');
        stateItems.forEach(item => {
            const forState = parseInt(item.getAttribute('data-state'));
            if (forState === state) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    })
    .catch(error => {
        console.error('Error updating website state:', error);
    });
}

// Function to save website details
function saveWebsiteDetails(userId) {
    const websiteUrl = document.getElementById('websiteUrl').value;
    const previewUrl = document.getElementById('websitePreviewUrl').value;
    
    if (!websiteUrl) {
        alert('Please enter a website URL');
        return;
    }
    
    // Show loading state on button
    const saveButton = document.getElementById('saveWebsiteDetails');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;
    
    fetch(`/api/website-config/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            websiteUrl,
            previewImageUrl: previewUrl,
            state: 2
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Website details saved:', data);
        saveButton.textContent = 'Saved!';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }, 2000);
        
        // Update toggle if needed
        const stateToggle = document.getElementById('stateToggle');
        if (stateToggle) {
            stateToggle.checked = true;
        }
        
        // Notify dashboard
        notifyDashboardOfWebsiteUpdate();
    })
    .catch(error => {
        console.error('Error saving website details:', error);
        saveButton.textContent = 'Error!';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }, 2000);
    });
}

// Function to update preview image
function updatePreviewImage() {
    const previewUrl = document.getElementById('websitePreviewUrl').value;
    const previewImage = document.getElementById('websitePreview');
    
    if (previewUrl && previewImage) {
        previewImage.src = previewUrl;
    }
}

// Function to submit email suggestion
function submitSuggestion(userId) {
    const suggestionInput = document.getElementById('suggestionInput');
    const suggestion = suggestionInput.value.trim();
    
    if (!suggestion) {
        alert('Please enter a suggestion');
        return;
    }
    
    fetch('/api/email-marketing/suggest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId,
            username: localStorage.getItem('username') || 'Unknown User',
            suggestion
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Suggestion submitted:', data);
        suggestionInput.value = '';
        
        // Reload suggestions
        loadEmailSuggestions(userId);
    })
    .catch(error => {
        console.error('Error submitting suggestion:', error);
    });
}

// Function to submit website query
function submitWebsiteQuery(userId) {
    const changesInput = document.getElementById('websiteChanges');
    const changes = changesInput.value.trim();
    
    if (!changes) {
        alert('Please describe the changes you want');
        return;
    }
    
    fetch(`/api/website-config/${userId}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ changes })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Website query submitted:', data);
        changesInput.value = '';
        alert('Your change request has been submitted!');
    })
    .catch(error => {
        console.error('Error submitting website query:', error);
    });
}

// Function to submit website configuration
function submitWebsiteConfig(userId) {
    const brandName = document.getElementById('brandName').value;
    const websiteType = document.getElementById('websiteType').value;
    
    if (!brandName || !websiteType) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get color values
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const tertiaryColor = document.getElementById('tertiaryColor').value;
    
    const referenceWebsite = document.getElementById('referenceWebsite').value;
    
    fetch(`/api/website-config/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            brandName,
            websiteType,
            colors: {
                primary: primaryColor,
                secondary: secondaryColor,
                tertiary: tertiaryColor
            },
            referenceWebsite,
            state: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Website config submitted:', data);
        alert('Website configuration has been saved!');
        
        // Update toggle if needed
        const stateToggle = document.getElementById('stateToggle');
        if (stateToggle) {
            stateToggle.checked = false;
        }
    })
    .catch(error => {
        console.error('Error submitting website config:', error);
    });
}

// Function to notify dashboard of website update
function notifyDashboardOfWebsiteUpdate() {
    // Send message to parent window
    if (window.parent && window.parent !== window) {
        console.log('Sending website update message to parent window');
        window.parent.postMessage({
            type: 'website-config-updated'
        }, '*');
    }
    
    // Also try to notify dashboard directly if there's a dashboard iframe
    try {
        const dashboardFrame = document.querySelector('iframe[name="dashboard"]');
        if (dashboardFrame && dashboardFrame.contentWindow) {
            console.log('Sending website update message to dashboard iframe');
            dashboardFrame.contentWindow.postMessage({
                type: 'website-config-updated'
            }, '*');
        }
    } catch (error) {
        console.error('Error sending message to dashboard:', error);
    }
}