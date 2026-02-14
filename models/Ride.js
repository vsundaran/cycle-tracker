const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Morning Ride'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    distance: {
        type: Number, // in km
        default: 0
    },
    avgSpeed: {
        type: Number, // in km/h
        default: 0
    },
    calories: {
        type: Number,
        default: 0
    },
    route: [
        {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ride', rideSchema);
