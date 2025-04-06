// Upcoming Meetings Management Module

// Function to load upcoming meetings data
async function loadUpcomingMeetings(userId) {
    if (!userId) {
        console.error('No user ID provided for upcoming meetings data');
        return;
    }

    try {
        console.log('Loading upcoming meetings data for user:', userId);
        const response = await fetch(`/api/upcoming-meetings/${userId}`);
        
        // If we don't have meetings data yet, create with defaults
        if (response.status === 404) {
            console.log('No meetings data exists yet, creating section with defaults');
            const defaultData = {
                heading: 'Strategy Session',
                subtitle: 'With our experts who will guide you in building a profitable business',
                description: 'Join us for a personalized strategy session to analyze your business goals and create an action plan.',
                dateTime: 'Next available slot',
                profileImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==', // Use base64 fallback for default
                meetingLink: '#schedule'
            };
            
            // Save defaults to server
            try {
                const saveResponse = await fetch(`/api/upcoming-meetings/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(defaultData)
                });
                
                if (!saveResponse.ok) {
                    console.warn('Failed to save default meeting data, but proceeding with UI creation');
                } else {
                    console.log('Successfully saved default meeting data to server');
                }
            } catch (saveError) {
                console.error('Error saving default meeting data:', saveError);
            }
            
            createOrUpdateUpcomingMeetingsSection(userId, defaultData);
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received upcoming meetings data:', data);

        // Create or update the section
        createOrUpdateUpcomingMeetingsSection(userId, data);
    } catch (error) {
        console.error('Error loading upcoming meetings data:', error);
        showErrorMessage(`Failed to load upcoming meetings data: ${error.message}`);
    }
}

// Create or update upcoming meetings section
function createOrUpdateUpcomingMeetingsSection(userId, data) {
    // Find content container
    const contentContainer = document.querySelector('.container');
    if (!contentContainer) {
        console.error('Container not found');
        return;
    }

    // Default base64 image as fallback (simple avatar silhouette)
    const defaultImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==';

    // Check if section already exists
    let meetingsSection = document.getElementById('upcomingMeetingsSection');
    
    // If not, create it
    if (!meetingsSection) {
        meetingsSection = document.createElement('div');
        meetingsSection.id = 'upcomingMeetingsSection';
        meetingsSection.className = 'content-section';
        
        // Find a better insertion point - after Instagram Marketing section
        const instagramSection = document.getElementById('instagramMarketingSection');
        
        if (instagramSection) {
            contentContainer.insertBefore(meetingsSection, instagramSection.nextSibling);
        } else {
            // Fallback - just add it before the website config section
            const websiteConfig = document.querySelector('.website-config');
            if (websiteConfig) {
                contentContainer.insertBefore(meetingsSection, websiteConfig);
            } else {
                // Last resort - append to container
                contentContainer.appendChild(meetingsSection);
            }
        }
    }

    // Ensure profile image is valid or use default
    const profileImage = data.profileImage && data.profileImage.trim() !== '' 
        ? data.profileImage 
        : defaultImageBase64;

    // Update the content of the section
    meetingsSection.innerHTML = `
        <h2>Upcoming Meetings Configuration</h2>
        <div class="meetings-config-container">
            <form id="meetingsConfigForm" class="meetings-form">
                <div class="form-group">
                    <label for="meetingHeading">Meeting Title</label>
                    <input type="text" id="meetingHeading" value="${data.heading || 'Strategy Session'}" required>
                </div>
                
                <div class="form-group">
                    <label for="meetingSubtitle">Widget Subtitle</label>
                    <input type="text" id="meetingSubtitle" value="${data.subtitle || 'With our experts who will guide you in building a profitable business'}">
                </div>
                
                <div class="form-group">
                    <label for="meetingDescription">Meeting Description</label>
                    <textarea id="meetingDescription" rows="3" required>${data.description || 'Join us for a personalized strategy session to analyze your business goals and create an action plan.'}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="meetingDateTime">Meeting Date/Time</label>
                    <input type="text" id="meetingDateTime" value="${data.dateTime || 'Next available slot'}" required>
                </div>
                
                <div class="form-group">
                    <label for="meetingProfileImage">Profile Image URL</label>
                    <input type="url" id="meetingProfileImage" value="${profileImage}">
                    <small style="display: block; margin-top: 5px; color: #777;">Use a direct image URL or leave as default</small>
                </div>
                
                <div class="form-group">
                    <label for="meetingLink">Meeting Link URL</label>
                    <input type="url" id="meetingLink" value="${data.meetingLink || '#schedule'}">
                </div>
                
                <div class="preview-container">
                    <h3>Preview</h3>
                    <div class="meeting-card-preview">
                        <div class="meeting-profile-preview">
                            <div class="profile-image-preview">
                                <img id="profileImagePreview" src="${profileImage}" alt="Expert profile" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg=='; this.onerror=null;">
                            </div>
                            <div class="meeting-details-preview">
                                <h3 id="headingPreview">${data.heading || 'Strategy Session'}</h3>
                                <p id="descriptionPreview">${data.description || 'Join us for a personalized strategy session to analyze your business goals and create an action plan.'}</p>
                            </div>
                        </div>
                        <div class="meeting-footer-preview">
                            <div class="meeting-time-preview" id="dateTimePreview">
                                ${data.dateTime || 'Next available slot'}
                            </div>
                            <div class="meeting-action-preview">
                                <button type="button" class="meeting-btn-preview">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button type="submit" id="updateMeetingsBtn" class="btn btn-primary">
                    Update Meetings Configuration
                </button>
            </form>
        </div>
    `;

    // Add event listeners
    const form = document.getElementById('meetingsConfigForm');
    if (form) {
        form.addEventListener('submit', (e) => updateMeetingsConfig(e, userId));
        
        // Add live preview event listeners
        document.getElementById('meetingHeading').addEventListener('input', updatePreview);
        document.getElementById('meetingDescription').addEventListener('input', updatePreview);
        document.getElementById('meetingDateTime').addEventListener('input', updatePreview);
        document.getElementById('meetingProfileImage').addEventListener('input', updatePreview);
    }

    // Add styles
    addUpcomingMeetingsStyles();
}

// Live preview updates
function updatePreview() {
    const headingPreview = document.getElementById('headingPreview');
    const descriptionPreview = document.getElementById('descriptionPreview');
    const dateTimePreview = document.getElementById('dateTimePreview');
    const profileImagePreview = document.getElementById('profileImagePreview');
    
    // Update preview elements if they exist
    if (headingPreview) {
        headingPreview.textContent = document.getElementById('meetingHeading').value;
    }
    
    if (descriptionPreview) {
        descriptionPreview.textContent = document.getElementById('meetingDescription').value;
    }
    
    if (dateTimePreview) {
        dateTimePreview.textContent = document.getElementById('meetingDateTime').value;
    }
    
    if (profileImagePreview) {
        const imageUrl = document.getElementById('meetingProfileImage').value;
        if (imageUrl && isValidUrl(imageUrl)) {
            profileImagePreview.src = imageUrl;
        }
    }
}

// Validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Function to update meetings configuration
async function updateMeetingsConfig(event, userId) {
    event.preventDefault();
    
    if (!userId) {
        showErrorMessage('Please select a user first');
        return;
    }
    
    // Get form values
    const heading = document.getElementById('meetingHeading').value;
    const subtitle = document.getElementById('meetingSubtitle').value;
    const description = document.getElementById('meetingDescription').value;
    const dateTime = document.getElementById('meetingDateTime').value;
    const profileImage = document.getElementById('meetingProfileImage').value;
    const meetingLink = document.getElementById('meetingLink').value;
    
    try {
        // Show loading state on button
        const button = document.getElementById('updateMeetingsBtn');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Updating...';
        
        console.log('Sending meeting data to server:', {
            heading, subtitle, description, dateTime, profileImage, meetingLink
        });
        
        const response = await fetch(`/api/upcoming-meetings/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                heading,
                subtitle,
                description,
                dateTime,
                profileImage,
                meetingLink
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update meetings configuration');
        }
        
        // Show success message
        showSuccessMessage('Meetings configuration updated successfully');
        
        // Notify dashboard and parent window
        notifyDashboardOfUpdate();
        
        // Store a local copy of the data as backup
        localStorage.setItem(`meetings_data_${userId}`, JSON.stringify({
            heading,
            subtitle,
            description,
            dateTime,
            profileImage,
            meetingLink,
            timestamp: new Date().toISOString()
        }));
        
        // Reset button state
        button.disabled = false;
        button.textContent = originalText;
        
    } catch (error) {
        console.error('Error updating meetings configuration:', error);
        showErrorMessage(`Failed to update meetings configuration: ${error.message}`);
        
        // Reset button state
        const button = document.getElementById('updateMeetingsBtn');
        if (button) {
            button.disabled = false;
            button.textContent = 'Update Meetings Configuration';
        }
    }
}

// Notify dashboard of updates
function notifyDashboardOfUpdate() {
    try {
        if (window.parent && window.parent !== window) {
            console.log('Notifying parent window of meetings data update');
            
            // Send both structured message and legacy format for compatibility
            window.parent.postMessage({
                type: 'meetingsDataUpdated',
                timestamp: new Date().toISOString()
            }, '*');
            
            // Legacy format
            window.parent.postMessage('meetingsDataUpdated', '*');
        }
    } catch (error) {
        console.error('Error notifying parent window:', error);
    }
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const container = document.getElementById('upcomingMeetingsSection');
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
    
    const container = document.getElementById('upcomingMeetingsSection');
    if (container) {
        container.insertAdjacentElement('afterbegin', errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Add upcoming meetings styles
function addUpcomingMeetingsStyles() {
    // Check if styles already exist
    if (document.getElementById('upcoming-meetings-styles')) {
        return;
    }
    
    const styles = `
        #upcomingMeetingsSection {
            margin-bottom: 30px;
        }
        
        .meetings-config-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .meetings-form {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .meetings-form .form-group {
            margin-bottom: 15px;
        }
        
        .meetings-form label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }
        
        .meetings-form input,
        .meetings-form textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .meetings-form textarea {
            resize: vertical;
        }
        
        .meetings-form button {
            grid-column: span 2;
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .meetings-form button:hover {
            background: #2980b9;
        }
        
        .preview-container {
            grid-column: span 2;
            margin-top: 20px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: white;
        }
        
        .preview-container h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        .meeting-card-preview {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
        }
        
        .meeting-profile-preview {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .profile-image-preview {
            flex-shrink: 0;
        }
        
        .profile-image-preview img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .meeting-details-preview {
            flex-grow: 1;
        }
        
        .meeting-details-preview h3 {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2c3e50;
            margin-top: 0;
            margin-bottom: 8px;
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .meeting-details-preview p {
            font-size: 0.9rem;
            color: #555;
            line-height: 1.5;
            margin: 0;
        }
        
        .meeting-footer-preview {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(0,0,0,0.1);
            padding-top: 12px;
        }
        
        .meeting-time-preview {
            font-size: 0.95rem;
            font-weight: 500;
            color: #3498db;
        }
        
        .meeting-action-preview {
            text-align: right;
        }
        
        .meeting-btn-preview {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: 36px;
            height: 36px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
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
        
        @media (max-width: 768px) {
            .meetings-form {
                grid-template-columns: 1fr;
            }
            
            .meetings-form button,
            .preview-container {
                grid-column: 1;
            }
        }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'upcoming-meetings-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
}

// Initialize module
function initUpcomingMeetings() {
    // Add event listener to user select dropdown
    const userSelect = document.getElementById('userSelect');
    if (userSelect) {
        userSelect.addEventListener('change', function() {
            const userId = this.value;
            if (userId) {
                loadUpcomingMeetings(userId);
            }
        });
        
        // If user is already selected, load data
        if (userSelect.value) {
            loadUpcomingMeetings(userSelect.value);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initUpcomingMeetings);

// Export functionality
window.loadUpcomingMeetings = loadUpcomingMeetings; 