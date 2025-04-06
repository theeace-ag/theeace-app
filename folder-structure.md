# Proposed Folder Structure for TheEace Login Portal

```
theeace-login-portal/
│
├── public/                # Static client-side files
│   ├── css/               # CSS stylesheets
│   │   ├── dashboard.css
│   │   └── styles.css
│   │
│   ├── js/                # Client-side JavaScript
│   │   ├── admin.js
│   │   ├── dashboard.js
│   │   ├── instagramMarketing.js
│   │   ├── script.js
│   │   ├── socket-client.js
│   │   ├── upcomingMeetings.js
│   │   └── userContent.js
│   │
│   ├── views/             # HTML files
│   │   ├── admin.html
│   │   ├── dashboard.html
│   │   ├── index.html
│   │   └── userContent.html
│   │
│   └── img/               # Images folder
│       └── placeholder.jpg
│
├── server/                # Server-side code
│   ├── config/            # Configuration files
│   │   └── .env           # Environment variables
│   │
│   ├── data/              # Data storage (auto-created)
│   │   ├── email-stats/
│   │   ├── metrics/
│   │   ├── historical/
│   │   ├── logo-preferences/
│   │   └── instagram-marketing/
│   │
│   ├── routes/            # API routes in future
│   │
│   └── utils/             # Utility functions
│       ├── create-user.js
│       └── debug-data-paths.js
│
├── docs/                  # Documentation
│   ├── DEPLOYMENT.md
│   ├── DEPLOYMENT_ALTERNATIVE.md
│   ├── GLITCH_INSTRUCTIONS.md
│   └── HOSTING.md
│
├── .dockerignore          # Docker ignore file
├── .gitignore             # Git ignore file
├── fly.toml               # Fly.io configuration
├── package.json           # NPM package config
├── package-lock.json      # NPM dependencies lockfile
├── README.md              # Project README
└── server.js              # Main server entry point
```

## Migration Plan

1. Create the new directory structure
2. Move existing files to their new locations
3. Update file paths in HTML, JavaScript, and server files
4. Ensure server paths for static files are correctly configured 