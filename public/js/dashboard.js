// Check if user is logged in
function checkAuth() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = '/index.html';
        return;
    }
    const userData = JSON.parse(loggedInUser);
    document.querySelector('.nav-title').textContent = `Welcome, ${userData.username}`;
    return userData;
}

// Load user's widgets
async function loadWidgets() {
    try {
        const userData = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!userData) return;
        
        const widgetSection = document.getElementById('widgetSection');
        showLoading(widgetSection);
        
        // Fetch metrics, email stats, and historical data
        const [metricsResponse, emailStatsResponse, historicalResponse] = await Promise.all([
            fetch(`/api/dashboard/metrics/${userData.userId}`),
            fetch(`/api/email-marketing/${userData.userId}`),
            fetch(`/api/dashboard/historical/${userData.userId}`)
        ]);

        if (!metricsResponse.ok || !emailStatsResponse.ok || !historicalResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const metrics = await metricsResponse.json();
        const emailStats = await emailStatsResponse.json();
        const historicalData = await historicalResponse.json();
        
        // Update metric values
        const metricData = {
            sessions: { value: metrics.sessions?.value || 0, change: metrics.sessions?.change || 0 },
            total_sales: { value: metrics.total_sales?.value || 0, change: metrics.total_sales?.change || 0 },
            orders: { value: metrics.orders?.value || 0, change: metrics.orders?.change || 0 },
            conversion_rate: { value: metrics.conversion_rate?.value || 0, change: metrics.conversion_rate?.change || 0 }
        };

        // Update each metric card
        Object.entries(metricData).forEach(([key, data]) => {
            const card = document.querySelector(`.metric-card:has(#${key}Chart)`);
            if (card) {
                card.querySelector('.metric-value').textContent = formatMetricValue(key, data.value);
                const changeElement = card.querySelector('.metric-change');
                changeElement.textContent = formatMetricChange(data.change);
                changeElement.className = `metric-change ${data.change >= 0 ? 'positive' : 'negative'}`;
            }
        });

        // Update email stats
        document.querySelector('.sent-count').textContent = String(emailStats.sent).padStart(4, '0');
        document.querySelector('.total-count').textContent = String(emailStats.total).padStart(4, '0');
        
        hideLoading(widgetSection);
        
        // Initialize charts with historical data
        window.historicalData = historicalData; // Make historical data available globally
        initializeCharts(metricData);
        initializeWidgetScroll();
    } catch (error) {
        console.error('Error loading widgets:', error);
        hideLoading(widgetSection);
    }
}

// Create metric card
function createMetricCard(metric, value, change) {
    const div = document.createElement('div');
    div.className = 'metric-card';
    
    const title = metric.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const formattedValue = formatMetricValue(metric, value);
    const formattedChange = formatMetricChange(change);
    
    div.innerHTML = `
        <h3>${title}</h3>
        <div class="metric-value">${formattedValue}</div>
        <div class="metric-change ${change >= 0 ? 'positive' : 'negative'}">${formattedChange}</div>
        <div class="metric-chart" id="${metric}Chart"></div>
    `;
    
    return div;
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

// Initialize charts
function initializeCharts(metricData) {
    if (!window.historicalData || !Array.isArray(window.historicalData)) {
        console.error('Historical data is not available');
        return;
    }

    Chart.defaults.font.family = "'Inter', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.8)';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont.size = 14;
    Chart.defaults.plugins.tooltip.bodyFont.size = 13;

    const chartConfig = {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;
                            
                            if (label === 'Total Sales') {
                                return `${label}: ₹${value}`;
                            } else if (label === 'Conversion Rate') {
                                return `${label}: ${value}%`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        display: true,
                        font: {
                            size: 9,
                            family: "'Inter', sans-serif"
                        },
                        maxRotation: 0,
                        color: '#64748b',
                        padding: 8,
                        autoSkip: true,
                        maxTicksLimit: 5
                    }
                },
                y: {
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        display: true,
                        font: {
                            size: 10
                        },
                        color: '#64748b',
                        padding: 8,
                        callback: function(value) {
                            if (this.chart.canvas.id.includes('total_sales')) {
                                return '₹' + value;
                            } else if (this.chart.canvas.id.includes('conversion_rate')) {
                                return value + '%';
                            }
                            return value;
                        }
                    },
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0.3,
                    borderWidth: 2,
                    fill: true
                },
                point: {
                    radius: 3,
                    hitRadius: 8,
                    hoverRadius: 4,
                    backgroundColor: '#fff',
                    borderWidth: 2
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 20,
                    bottom: 10
                }
            }
        }
    };

    // Sort historical data by date
    const sortedData = window.historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get dates from historical data
    const dates = sortedData.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    });

    const metricMappings = {
        sessions: { key: 'sessions', title: 'Sessions' },
        total_sales: { key: 'sales', title: 'Total Sales' },
        orders: { key: 'orders', title: 'Orders' },
        conversion_rate: { key: 'conversion', title: 'Conversion Rate' }
    };

    Object.entries(metricData).forEach(([metric, data]) => {
        const canvas = document.getElementById(`${metric}Chart`);
        if (!canvas) {
            console.error(`Canvas not found for metric: ${metric}`);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error(`Could not get 2D context for metric: ${metric}`);
            return;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const mapping = metricMappings[metric];
        const chartData = sortedData.map(entry => entry[mapping.key]);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, getMetricColor(metric, 0.2));
        gradient.addColorStop(1, getMetricColor(metric, 0.0));

        try {
            new Chart(ctx, {
                ...chartConfig,
                data: {
                    labels: dates,
                    datasets: [{
                        label: mapping.title,
                        data: chartData,
                        borderColor: getMetricColor(metric),
                        backgroundColor: gradient,
                        fill: true,
                        cubicInterpolationMode: 'monotone',
                        pointBackgroundColor: getMetricColor(metric),
                        pointBorderColor: getMetricColor(metric)
                    }]
                }
            });
        } catch (error) {
            console.error(`Error creating chart for metric: ${metric}`, error);
        }
    });
}

// Get metric-specific volatility
function getMetricVolatility(metric) {
    const volatilities = {
        sessions: 0.15,      // 15% volatility
        total_sales: 0.2,    // 20% volatility
        orders: 0.25,        // 25% volatility
        conversion_rate: 0.1  // 10% volatility
    };
    return volatilities[metric] || 0.15;
}

// Create gradient backgrounds for charts
function getMetricGradient(ctx, metric) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    const color = getMetricColor(metric);
    
    gradient.addColorStop(0, color.replace(')', ', 0.2)'));
    gradient.addColorStop(1, color.replace(')', ', 0.0)'));
    
    return gradient;
}

// Get metric color with improved palette
function getMetricColor(metric, alpha = 1) {
    const colors = {
        sessions: `rgba(59, 130, 246, ${alpha})`,      // Blue
        total_sales: `rgba(16, 185, 129, ${alpha})`,   // Green
        orders: `rgba(245, 158, 11, ${alpha})`,        // Amber
        conversion_rate: `rgba(139, 92, 246, ${alpha})` // Purple
    };
    return colors[metric] || colors.sessions;
}

// Load user's content
async function loadUserContent() {
    try {
        const userData = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!userData) return;
        
        const response = await fetch(`/api/dashboard/content/${userData.userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch content');
        }
        const content = await response.json();
        
        const contentContainer = document.getElementById('userContent');
        contentContainer.innerHTML = content.html || '';
    } catch (error) {
        console.error('Error loading user content:', error);
    }
}

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userId');
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    window.location.href = '/index.html';
});

// Add auto-refresh for widgets
function startAutoRefresh() {
    setInterval(async () => {
        const userData = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userData) {
            try {
                const emailStatsResponse = await fetch(`/api/email-marketing/${userData.userId}`);
                if (emailStatsResponse.ok) {
                    const emailStats = await emailStatsResponse.json();
                    document.querySelector('.sent-count').textContent = String(emailStats.sent).padStart(4, '0');
                    document.querySelector('.total-count').textContent = String(emailStats.total).padStart(4, '0');
                }
            } catch (error) {
                console.error('Error refreshing email stats:', error);
            }
        }
    }, 30000); // Refresh every 30 seconds
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const userData = checkAuth();
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = '/';
    });
    
    // Set up refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        console.log('Refreshing dashboard...');
        // Show a brief spinning animation on the refresh icon
        const refreshIcon = document.querySelector('#refreshBtn i');
        refreshIcon.classList.add('fa-spin');
        
        // Reload all data
        Promise.all([
            loadWidgets(),
            loadWebsiteConfig(),
            loadDashboardLogoPreference(),
            loadInstagramMarketingData(),
            loadUpcomingMeetings()
        ]).then(() => {
            // Stop spinning and show success message
            setTimeout(() => {
                refreshIcon.classList.remove('fa-spin');
                showNotification('Dashboard refreshed successfully', 'success');
            }, 500);
        }).catch(error => {
            console.error('Error refreshing dashboard:', error);
            refreshIcon.classList.remove('fa-spin');
            showNotification('Error refreshing data', 'error');
        });
    });

    if (userData) {
        // Initialize dashboard
        loadWebsiteConfig();
        loadDashboardLogoPreference();
        loadWidgets();
        loadUserContent();
        startAutoRefresh();
        startInstagramDataPolling();
        loadUpcomingMeetings();
    }
});

// Add smooth scrolling for widget container
function initializeWidgetScroll() {
    const container = document.querySelector('.widget-scroll');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    // Add scroll indicator if content is wider than container
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    scrollIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
    container.parentElement.appendChild(scrollIndicator);

    // Show/hide scroll indicator based on scroll position
    function updateScrollIndicator() {
        const maxScroll = container.scrollWidth - container.clientWidth;
        scrollIndicator.classList.toggle('visible', 
            container.scrollLeft < maxScroll && maxScroll > 0);
    }

    container.addEventListener('scroll', updateScrollIndicator);
    window.addEventListener('resize', updateScrollIndicator);
    updateScrollIndicator();
}

// Add loading animation
function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

// Show notification message
function showNotification(message, type = 'success') {
    const container = document.querySelector('.dashboard-container');
    const existingNotification = container.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.insertBefore(notification, container.firstChild);
    
    setTimeout(() => notification.remove(), 3000);
}

// Handle suggestion form submission
document.getElementById('emailSuggestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        const userData = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!userData) {
            throw new Error('User not logged in');
        }
        
        const suggestion = document.getElementById('suggestionInput').value;
        
        const response = await fetch('/api/email-marketing/suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userData.userId,
                username: userData.username,
                suggestion: suggestion
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit suggestion');
        }
        
        // Clear the input and show success message
        document.getElementById('suggestionInput').value = '';
        showNotification('Suggestion submitted successfully!', 'success');
        
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showNotification('Failed to submit suggestion. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
});

// Website Configuration Widget Functions
async function loadWebsiteConfig() {
    try {
        console.log('Loading website configuration...');
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user || !user.userId) {
            console.error('User not logged in');
            return;
        }
        
        showLoading(document.querySelector('.website-config-widget'));
        
        const response = await fetch(`/api/website-config/${user.userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch website config');
        }
        
        const config = await response.json();
        console.log('Website configuration loaded:', config);
        
        // Switch to the appropriate state
        switchWidgetState(config.state || 1);
        
        // Update form fields in state 1
        if (config.state === 1 || !config.state) {
            const form = document.getElementById('websiteConfigForm');
            if (form) {
                form.elements.brandName.value = config.brandName || '';
                form.elements.websiteType.value = config.websiteType || '';
                
                if (config.colorScheme) {
                    form.elements.primaryColor.value = config.colorScheme.primary || '#000000';
                    form.elements.secondaryColor.value = config.colorScheme.secondary || '#ffffff';
                    form.elements.tertiaryColor.value = config.colorScheme.tertiary || '#cccccc';
                }
                
                form.elements.referenceWebsite.value = config.referenceWebsite || '';
            }
        }
        
        // Update website preview in state 2
        if (config.state === 2) {
            updateWebsitePreview(config);
        }
        
        hideLoading(document.querySelector('.website-config-widget'));
    } catch (error) {
        console.error('Error loading website config:', error);
        hideLoading(document.querySelector('.website-config-widget'));
    }
}

// Switch widget state
function switchWidgetState(state) {
    console.log('Switching widget state to:', state);
    const state1 = document.querySelector('.website-config-widget .state-1');
    const state2 = document.querySelector('.website-config-widget .state-2');
    
    if (!state1 || !state2) {
        console.error('Widget state elements not found:', { state1, state2 });
        return;
    }
    
    // Store current state for reference
    currentWebsiteState = state;
    
    if (state === 2) {
        state1.style.display = 'none';
        state2.style.display = 'block';
        console.log('Displaying state 2 (preview)');
    } else {
        state1.style.display = 'block';
        state2.style.display = 'none';
        console.log('Displaying state 1 (configuration)');
    }
}

function updateWebsitePreview(config) {
    console.log('Updating website preview with config:', config);
    const previewImg = document.getElementById('websitePreview');
    const websiteLink = document.getElementById('websiteLink');
    
    // Default base64 website placeholder
    const defaultImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlOWVjZWYiLz48cGF0aCBkPSJNMTczLjMzMyAxMTYuNjY3SDIyNi42NjdWMTQwSDI1MFYxMTYuNjY3QzI1MCAxMDguMDMzIDI0My4wOTggMTAwIDIzMy4zMzMgMTAwSDE2Ni42NjdDMTU2LjkwMiAxMDAgMTUwIDEwOC4wMzMgMTUwIDExNi42NjdWMTgzLjMzM0MxNTAgMTkxLjk2NyAxNTYuOTAyIDIwMCAxNjYuNjY3IDIwMEgyMzMuMzMzQzI0My4wOTggMjAwIDI1MCAxOTEuOTY3IDI1MCAxODMuMzMzVjE2MEgyMjYuNjY3VjE4My4zMzNIMTczLjMzM1YxMTYuNjY3WiIgZmlsbD0iIzZjNzU3ZCIvPjwvc3ZnPg==';
    
    if (previewImg) {
        if (config.previewImageUrl && config.previewImageUrl.trim() !== '') {
            console.log('Setting preview image URL:', config.previewImageUrl);
            previewImg.src = config.previewImageUrl;
        } else {
            // Use a default image if no preview URL is provided
            console.log('Using default image for preview');
            previewImg.src = defaultImageBase64;
        }
        
        // Set up error handler for image loading failures
        previewImg.onerror = function() {
            console.error('Failed to load preview image:', config.previewImageUrl);
            this.src = defaultImageBase64;
        };
    } else {
        console.error('Preview image element not found');
    }
    
    if (websiteLink) {
        if (config.websiteUrl && config.websiteUrl.trim() !== '') {
            console.log('Setting website URL:', config.websiteUrl);
            websiteLink.href = config.websiteUrl;
            websiteLink.target = '_blank';
        } else {
            websiteLink.href = '#';
            websiteLink.target = '';
        }
    } else {
        console.error('Website link element not found');
    }
}

function showPopupLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'popup-lightbox';
    lightbox.innerHTML = `
        <div class="popup-content">
            <h3>Your Website is Getting Ready!</h3>
            <p>In the meantime, let's work on your email marketing.</p>
            <a href="#emailMarketing">Go to Email Marketing</a>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    
    // Force reflow
    lightbox.offsetHeight;
    lightbox.classList.add('active');
    
    // Add click handler to close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            setTimeout(() => lightbox.remove(), 300);
        }
    });
}

// Event Listeners
document.getElementById('websiteConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!userData) return;
    
    try {
        const formData = {
            brandName: document.getElementById('brandName').value,
            websiteType: document.getElementById('websiteType').value,
            colors: {
                primary: document.getElementById('primaryColor').value,
                secondary: document.getElementById('secondaryColor').value,
                tertiary: document.getElementById('tertiaryColor').value
            },
            referenceWebsite: document.getElementById('referenceWebsite').value
        };
        
        const response = await fetch(`/api/website-config/${userData.userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save website configuration');
        }
        
        showPopupLightbox();
        
        // Scroll to email marketing section after a delay
        setTimeout(() => {
            const emailSection = document.querySelector('.email-marketing-widget');
            if (emailSection) {
                emailSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error saving website configuration:', error);
    }
});

document.getElementById('websiteQueryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!userData) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    try {
        const changes = document.getElementById('changes').value.trim();
        
        if (!changes) {
            showNotification('Please describe the changes you want', 'error');
            return;
        }
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        console.log('Submitting website query with changes:', changes);
        
        const response = await fetch(`/api/website-config/${userData.userId}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ changes: changes })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit changes: ' + response.status);
        }
        
        // Clear the form and show success message
        document.getElementById('changes').value = '';
        showNotification('Your changes have been submitted successfully!', 'success');
        
        // Reload userContent iframe
        const userContentFrame = document.getElementById('userContent');
        if (userContentFrame) {
            userContentFrame.src = userContentFrame.src;
            console.log('Reloading userContent iframe to reflect website query changes');
        }
        
    } catch (error) {
        console.error('Error submitting changes:', error);
        showNotification('Failed to submit changes: ' + error.message, 'error');
    } finally {
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Changes';
        }
    }
});

// Initialize website configuration on load
document.addEventListener('DOMContentLoaded', () => {
    const userData = checkAuth();
    if (userData) {
        loadWebsiteConfig();
        loadDashboardLogoPreference();
        loadWidgets();
        loadUserContent();
        startAutoRefresh();
    }
});

// Logo Preference Widget
let currentLogoPreferenceData = null; // Renamed to avoid conflict

// Initialize logo preferences FOR THE DASHBOARD WIDGET
async function loadDashboardLogoPreference() {
    try {
        const userData = checkAuth();
        if (!userData || !userData.userId) {
            console.log('User not logged in or userId missing.');
            return;
        }

        console.log('Loading logo preferences for userId:', userData.userId);
        const response = await fetch(`/api/logo-preference/${userData.userId}`);
        if (!response.ok) {
            console.error(`Failed to fetch logo preferences for user ${userData.userId}, status: ${response.status}`);
            // Don't throw error, maybe preferences don't exist yet
            currentLogoPreferenceData = { logoType: '' }; // Set default
        } else {
            currentLogoPreferenceData = await response.json();
            console.log('Loaded logo preferences:', currentLogoPreferenceData);
        }
        
        // Update only the form field in the dashboard widget
        const logoTypeSelect = document.getElementById('logoType');
        if (logoTypeSelect) {
            logoTypeSelect.value = currentLogoPreferenceData.logoType || '';
        }
    } catch (error) {
        console.error('Error loading dashboard logo preferences:', error);
        // Handle error state in UI if necessary
    }
}

// Show the logo creation lightbox
function showLogoCreationLightbox() {
    const lightbox = document.getElementById('logoCreationLightbox');
    if (lightbox) {
        lightbox.style.display = 'flex';
        
        // Close lightbox after 3 seconds
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 3000);
    }
}

// Add event listeners specifically for dashboard logo preference widget
document.addEventListener('DOMContentLoaded', () => {
    // Load initial logo type selection for the dashboard form
    const userData = checkAuth();
    if (userData && userData.userId) {
        loadDashboardLogoPreference(); 
    }
    
    // Logo preference form submission (Dashboard only)
    const logoPreferenceForm = document.getElementById('logoPreferenceForm');
    if (logoPreferenceForm) {
        logoPreferenceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const logoType = document.getElementById('logoType').value;
            if (!logoType) {
                alert('Please select a logo type');
                return;
            }
            
            try {
                console.log('Submitting logo preference:', logoType);
                const currentUserData = checkAuth(); // Fetch again to ensure it's current
                if (!currentUserData || !currentUserData.userId) {
                    alert('User session error. Please log out and log in again.');
                    return;
                }
                
                const submitButton = e.target.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
                }
                
                // Save logo preference with a note about the selection
                const response = await fetch(`/api/logo-preference/${currentUserData.userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        logoType, 
                        timestamp: new Date().toISOString(),
                        noteText: `User selected logo type: ${logoType}` 
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save logo preference');
                }
                
                const responseData = await response.json();
                console.log('Logo preference saved successfully:', responseData);
                
                // Show creation lightbox
                showLogoCreationLightbox();
                
                // Update the local state and the dashboard dropdown
                currentLogoPreferenceData.logoType = logoType;
                document.getElementById('logoType').value = logoType; // Explicitly update the dropdown

                // Reload userContent iframe to update the logo notes table and config display
                const userContentFrame = document.getElementById('userContent');
                if (userContentFrame && userContentFrame.contentWindow) {
                    // Force reload of the iframe content
                    userContentFrame.src = userContentFrame.src;
                    console.log('Reloading userContent iframe to reflect logo preference changes');
                } else {
                     console.warn('userContent iframe not found or inaccessible');
                }
                
                // Show notification
                showNotification('Logo preference saved successfully', 'success');
                
            } catch (error) {
                console.error('Error submitting logo preference:', error);
                alert(`Failed to save logo preference: ${error.message}`);
            } finally {
                const submitButton = e.target.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Preference';
                }
            }
        });
    }
});

// Instagram Marketing Widget Functionality
async function loadInstagramMarketingData() {
    try {
        const userData = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!userData || !userData.userId) {
            console.error('No user logged in');
            return;
        }

        console.log('Loading Instagram marketing data for dashboard...');
        const response = await fetch(`/api/instagram-marketing/${userData.userId}`);
        if (!response.ok) {
            throw new Error('Failed to load Instagram marketing data');
        }

        const data = await response.json();
        console.log('Dashboard received Instagram data:', data);
        
        // Update the metrics in the UI
        document.getElementById('accountsReached').textContent = data.accountsReached.toLocaleString();
        document.getElementById('leadsConverted').textContent = data.leadsConverted.toLocaleString();

    } catch (error) {
        console.error('Error loading Instagram marketing data:', error);
    }
}

// Add polling to keep dashboard data fresh
function startInstagramDataPolling() {
    // Initial load
    loadInstagramMarketingData();
    
    // Reload data every 30 seconds
    setInterval(loadInstagramMarketingData, 30000);
}

// Setup iframe message event to reload data when userContent makes changes
window.addEventListener('message', function(event) {
    if (event.data === 'instagramDataUpdated') {
        console.log('Received message to update Instagram data');
        loadInstagramMarketingData();
    }
});

// Add this to DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization...
    
    // Start Instagram data polling
    startInstagramDataPolling();
});

// Add event listener for Instagram niche preference form
document.getElementById('instagramPreferenceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!userData) {
        showNotification('Please log in first', 'error');
        return;
    }

    const niche = document.getElementById('instagramNiche').value;
    if (!niche) {
        showNotification('Please select a niche', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/instagram-marketing/${userData.userId}/preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ niche })
        });

        if (!response.ok) {
            throw new Error('Failed to save preference');
        }

        // Show confirmation lightbox instead of notification
        showInstagramConfirmationLightbox();
        
        // Reset form
        document.getElementById('instagramNiche').value = '';
        
        // Reload user content iframe to display updated preferences
        const userContentFrame = document.getElementById('userContent');
        if (userContentFrame && userContentFrame.contentWindow) {
            userContentFrame.contentWindow.location.reload();
        }
        
    } catch (error) {
        console.error('Error saving Instagram niche preference:', error);
        showNotification('Failed to save preference', 'error');
    }
});

// Function to show Instagram suggestion confirmation lightbox
function showInstagramConfirmationLightbox() {
    const lightbox = document.getElementById('instagramConfirmationLightbox');
    if (lightbox) {
        lightbox.style.display = 'flex';
        
        // Close lightbox after 3 seconds
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 3000);
    }
}

// Update the loadUserDashboard function to include Instagram marketing data
async function loadUserDashboard(user) {
    try {
        // ... existing code ...

        // Load Instagram marketing data
        await loadInstagramMarketingData();

        // ... existing code ...
    } catch (error) {
        console.error('Error loading user dashboard:', error);
    }
}

// Upcoming Meetings Widget
async function loadUpcomingMeetings() {
    try {
        const userData = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!userData || !userData.userId) {
            console.error('No user logged in');
            return;
        }

        console.log('Loading upcoming meetings data...');
        const response = await fetch(`/api/upcoming-meetings/${userData.userId}`);
        
        // Handle 404 (not found) differently
        if (response.status === 404) {
            console.log('No meetings data found, using defaults');
            // Set default values
            const defaultData = {
                heading: 'Strategy Session',
                subtitle: 'With our experts who will guide you in building a profitable business',
                description: 'Join us for a personalized strategy session to analyze your business goals and create an action plan.',
                dateTime: 'Next available slot',
                profileImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==',
                meetingLink: '#schedule'
            };
            updateUpcomingMeetingsUI(defaultData);
            return;
        }
        else if (!response.ok) {
            throw new Error('Failed to load upcoming meetings data');
        }

        const data = await response.json();
        console.log('Received upcoming meetings data:', data);
        
        // Update the dashboard UI with the meeting data
        updateUpcomingMeetingsUI(data);
    } catch (error) {
        console.error('Error loading upcoming meetings:', error);
        // Set default values in case of error
        const defaultData = {
            heading: 'Strategy Session',
            subtitle: 'With our experts who will guide you in building a profitable business',
            description: 'Join us for a personalized strategy session to analyze your business goals and create an action plan.',
            dateTime: 'Next available slot',
            profileImage: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==',
            meetingLink: '#schedule'
        };
        updateUpcomingMeetingsUI(defaultData);
    }
}

// Update the UI with meeting data
function updateUpcomingMeetingsUI(data) {
    // Update heading
    const headingEl = document.getElementById('meetingHeading');
    if (headingEl) headingEl.textContent = data.heading || 'Strategy Session';
    
    // Update subtitle if it exists
    const subtitleEl = document.getElementById('meetingSubtitle');
    if (subtitleEl) subtitleEl.textContent = data.subtitle || 'With our experts who will guide you in building a profitable business';
    
    // Update description
    const descriptionEl = document.getElementById('meetingDescription');
    if (descriptionEl) descriptionEl.textContent = data.description || 'Join us for a personalized strategy session to analyze your business goals and create an action plan.';
    
    // Update datetime
    const timeEl = document.getElementById('meetingTime');
    if (timeEl) timeEl.textContent = data.dateTime || 'Next available slot';
    
    // Update profile image if provided
    const imageEl = document.getElementById('meetingProfileImage');
    if (imageEl) {
        if (data.profileImage && data.profileImage.trim() !== '') {
            imageEl.src = data.profileImage;
        } else {
            // Default base64 image
            imageEl.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==';
        }
        imageEl.alt = data.heading || 'Expert profile';
        
        // Add error handler to use default image if loading fails
        imageEl.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFWMTlDMjAgMTYuNzkwOCAxOC4yMDkxIDE1IDE2IDE1SDhDNS43OTA4NiAxNSA0IDE2Ljc5MDkgNCAxOVYyMSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==';
            if (!this.hasAttribute('data-error-reported')) {
                console.error('Failed to load image:', data.profileImage);
                this.setAttribute('data-error-reported', 'true');
            }
        };
    }
    
    // Update meeting link
    const linkEl = document.getElementById('meetingLink');
    if (linkEl) linkEl.href = data.meetingLink || '#schedule';
}

// Listen for messages from the userContent iframe
window.addEventListener('message', function(event) {
    // Handle existing messages
    if (event.data === 'instagramDataUpdated') {
        console.log('Received message to update Instagram data');
        loadInstagramMarketingData();
    }
    
    // Handle meeting data updates
    if (event.data === 'meetingsDataUpdated') {
        console.log('Received message to update meetings data');
        loadUpcomingMeetings();
    }
});

// Add this to DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const userData = checkAuth();
    if (userData) {
        // Existing initialization...
        loadWidgets();
        loadDashboardLogoPreference();
        loadUserContent();
        startAutoRefresh();
        
        // Start Instagram data polling
        startInstagramDataPolling();
        
        // Load upcoming meetings data
        loadUpcomingMeetings();
    }
});

// Listen for messages from the userContent iframe for website updates
window.addEventListener('message', function(event) {
    // Handle existing messages
    if (event.data === 'instagramDataUpdated') {
        console.log('Received message to update Instagram data');
        loadInstagramMarketingData();
    }
    
    if (event.data === 'meetingsDataUpdated') {
        console.log('Received message to update meetings data');
        loadUpcomingMeetings();
    }
    
    // Handle website config updates
    if (event.data === 'websiteConfigUpdated') {
        console.log('Received message to update website configuration');
        loadWebsiteConfig();
    }
});

// Add message event listener for cross-iframe communication
window.addEventListener('message', function(event) {
    console.log('Dashboard received message:', event.data);
    
    // Handle website configuration updates
    if (event.data && event.data.type === 'websiteConfigUpdated') {
        console.log('Website configuration updated, reloading config...');
        loadWebsiteConfig();
    } else if (event.data === 'websiteConfigUpdated') {
        // Handle legacy format for backward compatibility
        console.log('Website configuration updated (legacy format), reloading config...');
        loadWebsiteConfig();
    }
    
    // Handle Instagram marketing updates
    if (event.data && event.data.type === 'instagramDataUpdated') {
        console.log('Instagram data updated, reloading data...');
        loadInstagramMarketingData();
    } else if (event.data === 'instagramDataUpdated') {
        // Handle legacy format for backward compatibility
        console.log('Instagram data updated (legacy format), reloading data...');
        loadInstagramMarketingData();
    }
    
    // Handle upcoming meetings updates
    if (event.data && event.data.type === 'meetingsDataUpdated') {
        console.log('Meetings data updated, reloading data...');
        loadUpcomingMeetings();
    } else if (event.data === 'meetingsDataUpdated') {
        // Handle legacy format for backward compatibility
        console.log('Meetings data updated (legacy format), reloading data...');
        loadUpcomingMeetings();
    }
}); 