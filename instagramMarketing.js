// Instagram Marketing Module

// Function to load Instagram marketing data
async function loadInstagramMarketing(userId) {
    if (!userId) {
        console.error('No user ID provided for Instagram marketing data');
        return;
    }

    try {
        console.log('Loading Instagram marketing data for user:', userId);
        const response = await fetch(`/api/instagram-marketing/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch Instagram marketing data: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received Instagram data:', data);

        // Create or update the section
        createOrUpdateInstagramSection(userId, data);
    } catch (error) {
        console.error('Error loading Instagram marketing data:', error);
        showErrorMessage('Failed to load Instagram marketing data');
    }
}

// Create or update Instagram section
function createOrUpdateInstagramSection(userId, data) {
    // Find content container
    const contentContainer = document.querySelector('.container');
    if (!contentContainer) {
        console.error('Container not found');
        return;
    }

    // Check if section already exists
    let instagramSection = document.getElementById('instagramMarketingSection');
    
    // If not, create it
    if (!instagramSection) {
        instagramSection = document.createElement('div');
        instagramSection.id = 'instagramMarketingSection';
        instagramSection.className = 'content-section';
        
        // Find a better insertion point - after Email Marketing Suggestions section
        const emailSuggestionsSection = Array.from(document.querySelectorAll('.content-section h2'))
            .find(h2 => h2.textContent.includes('Email Marketing Suggestions'))?.parentElement;
        
        if (emailSuggestionsSection) {
            contentContainer.insertBefore(instagramSection, emailSuggestionsSection.nextSibling);
        } else {
            // Fallback - just add it before the website config section
            const websiteConfig = document.querySelector('.website-config');
            if (websiteConfig) {
                contentContainer.insertBefore(instagramSection, websiteConfig);
            } else {
                // Last resort - append to container
                contentContainer.appendChild(instagramSection);
            }
        }
    }

    // Update the content of the section
    instagramSection.innerHTML = `
        <h2>Instagram Marketing</h2>
        <div class="instagram-marketing-container">
            <!-- Admin Metrics Form -->
            <div class="metrics-form">
                <h3>Update Marketing Metrics</h3>
                <div class="form-group">
                    <label for="instaAccountsReached">Accounts Reached</label>
                    <input type="number" id="instaAccountsReached" value="${data.accountsReached || 0}" min="0">
                </div>
                <div class="form-group">
                    <label for="instaLeadsConverted">Leads Converted</label>
                    <input type="number" id="instaLeadsConverted" value="${data.leadsConverted || 0}" min="0">
                </div>
                <button type="button" id="updateInstaMetricsBtn" class="btn btn-primary">Update Metrics</button>
            </div>
            
            <!-- User Preferences Table -->
            <div class="preferences-section">
                <h3>User Niche Preferences</h3>
                <table id="instagramPreferencesTable" class="preferences-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Niche</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateInstagramPreferencesRows(data.preferences || [])}
                    </tbody>
                </table>
                ${(data.preferences || []).length === 0 ? '<p class="empty-message">No preferences submitted yet.</p>' : ''}
            </div>
        </div>
    `;

    // Add event listener to update button
    const updateButton = document.getElementById('updateInstaMetricsBtn');
    if (updateButton) {
        updateButton.addEventListener('click', () => updateInstagramMetrics(userId));
    }

    // Add styles
    addInstagramStyles();
}

// Function to generate preference table rows
function generateInstagramPreferencesRows(preferences) {
    if (!preferences || preferences.length === 0) {
        return '';
    }
    
    // Sort by timestamp, newest first
    const sortedPrefs = [...preferences].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return sortedPrefs.map(pref => `
        <tr>
            <td>${new Date(pref.timestamp).toLocaleString()}</td>
            <td>${pref.niche || 'Not specified'}</td>
        </tr>
    `).join('');
}

// Function to update metrics
async function updateInstagramMetrics(userId) {
    if (!userId) {
        showErrorMessage('Please select a user first');
        return;
    }
    
    const accountsReached = parseInt(document.getElementById('instaAccountsReached').value) || 0;
    const leadsConverted = parseInt(document.getElementById('instaLeadsConverted').value) || 0;
    
    try {
        // Show loading state on button
        const button = document.getElementById('updateInstaMetricsBtn');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Updating...';
        
        const response = await fetch(`/api/instagram-marketing/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountsReached,
                leadsConverted
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update Instagram metrics');
        }
        
        showSuccessMessage('Instagram metrics updated successfully');
        
        // Notify the dashboard about the update
        notifyDashboardOfUpdate();
        
    } catch (error) {
        console.error('Error updating Instagram metrics:', error);
        showErrorMessage('Failed to update Instagram metrics');
    } finally {
        // Reset button state
        const button = document.getElementById('updateInstaMetricsBtn');
        if (button) {
            button.disabled = false;
            button.textContent = 'Update Metrics';
        }
    }
}

// Function to notify the dashboard iframe about data updates
function notifyDashboardOfUpdate() {
    try {
        // Try to get the parent window
        if (window.parent && window.parent !== window) {
            console.log('Notifying dashboard about Instagram data update');
            window.parent.postMessage('instagramDataUpdated', '*');
        } else {
            console.log('No parent window detected');
        }
        
        // Also notify any dashboard iframe in the current window
        const dashboardFrame = document.getElementById('dashboardFrame');
        if (dashboardFrame && dashboardFrame.contentWindow) {
            console.log('Notifying dashboard iframe about Instagram data update');
            dashboardFrame.contentWindow.postMessage('instagramDataUpdated', '*');
        }
    } catch (e) {
        console.error('Failed to notify dashboard:', e);
    }
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const container = document.getElementById('instagramMarketingSection');
    if (container) {
        container.insertAdjacentElement('afterbegin', successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.getElementById('instagramMarketingSection');
    if (container) {
        container.insertAdjacentElement('afterbegin', errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Add Instagram marketing styles
function addInstagramStyles() {
    // Check if styles already exist
    if (document.getElementById('instagram-marketing-styles')) {
        return;
    }
    
    const styles = `
        #instagramMarketingSection {
            margin-bottom: 30px;
        }
        
        .instagram-marketing-container {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            margin-top: 20px;
        }
        
        .metrics-form {
            flex: 1;
            min-width: 300px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .metrics-form h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            color: #2c3e50;
        }
        
        .metrics-form .form-group {
            margin-bottom: 15px;
        }
        
        .metrics-form label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }
        
        .metrics-form input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .metrics-form button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .metrics-form button:hover {
            background: #2980b9;
        }
        
        .preferences-section {
            flex: 2;
            min-width: 300px;
        }
        
        .preferences-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            color: #2c3e50;
        }
        
        .preferences-table {
            width: 100%;
            border-collapse: collapse;
            box-shadow: 0 2px 3px rgba(0,0,0,0.05);
        }
        
        .preferences-table th,
        .preferences-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .preferences-table th {
            background: #f4f6f9;
            font-weight: 600;
            color: #333;
        }
        
        .preferences-table tr:hover {
            background: #f8f9fa;
        }
        
        .empty-message {
            color: #7f8c8d;
            font-style: italic;
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .success-message, .error-message {
            padding: 10px 15px;
            margin-bottom: 15px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .success-message {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'instagram-marketing-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
}

// Initialize module
function initInstagramMarketing() {
    // Add event listener to user select dropdown
    const userSelect = document.getElementById('userSelect');
    if (userSelect) {
        userSelect.addEventListener('change', function() {
            const userId = this.value;
            if (userId) {
                loadInstagramMarketing(userId);
            }
        });
        
        // If user is already selected, load data
        if (userSelect.value) {
            loadInstagramMarketing(userSelect.value);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initInstagramMarketing);

// Export functionality
window.loadInstagramMarketing = loadInstagramMarketing; 