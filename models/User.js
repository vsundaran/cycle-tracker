const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    lifetimeStats: {
        totalDistance: { type: Number, default: 0 }, // in km
        totalDuration: { type: Number, default: 0 }, // in seconds
        avgSpeed: { type: Number, default: 0 },      // in km/h
        totalCalories: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
