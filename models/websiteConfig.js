const mongoose = require('mongoose');

const websiteConfigSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    state: {
        type: Number,
        enum: [1, 2],
        default: 1
    },
    websiteUrl: {
        type: String,
        default: ''
    },
    previewImage: {
        type: String,
        default: null
    },
    queries: [{
        type: String
    }],
    brandName: {
        type: String,
        default: ''
    },
    websiteType: {
        type: String,
        default: ''
    },
    colorScheme: {
        type: String,
        default: ''
    },
    referenceWebsite: {
        type: String,
        default: ''
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Update lastUpdated on save
websiteConfigSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('WebsiteConfig', websiteConfigSchema); 