const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    passkey: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    }
});

// Add a static method to find user by credentials
userSchema.statics.findByCredentials = async function(username, userId, passkey) {
    try {
        // Try to find by username, userId and passkey
        if (username && userId && passkey) {
            const user = await this.findOne({ username, userId, passkey });
            if (user) return user;
        }
        
        // Try to find by username and passkey
        if (username && passkey) {
            const user = await this.findOne({ username, passkey });
            if (user) return user;
        }
        
        // Try to find by userId and passkey
        if (userId && passkey) {
            const user = await this.findOne({ userId, passkey });
            if (user) return user;
        }
        
        return null;
    } catch (error) {
        console.error('Error finding user by credentials:', error);
        return null;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 