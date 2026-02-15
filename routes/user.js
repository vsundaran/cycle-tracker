const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const Ride = require('../models/Ride');

// Helper for distance calculation (Haversine)
const calculateDistance = (route) => {
    if (!route || route.length < 2) return 0;
    let totalDist = 0;
    const R = 6371; // km
    for (let i = 1; i < route.length; i++) {
        const p1 = route[i-1];
        const p2 = route[i];
        const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
        const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        totalDist += R * c;
    }
    return totalDist;
};

// @route   GET api/users/me
// @desc    Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (user) {
            // Recalculate lifetime stats from valid rides to ensure accuracy
            const rides = await Ride.find({ userId: req.user.id, status: 'completed' });
            
            let totalDist = 0;
            let totalDur = 0;
            let totalCals = 0;

            rides.forEach(ride => {
                let rideDist = ride.distance || 0;
                // Fallback: calculate from route if distance is 0 but route exists
                if (rideDist === 0 && ride.route && ride.route.length > 1) {
                    rideDist = calculateDistance(ride.route);
                }
                
                totalDist += rideDist;
                totalDur += (ride.duration || 0);
                totalCals += (ride.calories || 0);
            });

            // Update stats
            user.lifetimeStats.totalDistance = totalDist;
            user.lifetimeStats.totalDuration = totalDur;
            user.lifetimeStats.totalCalories = totalCals;
            
            const totalHours = totalDur / 3600;
            if (totalHours > 0) {
                user.lifetimeStats.avgSpeed = totalDist / totalHours;
            } else {
                user.lifetimeStats.avgSpeed = 0;
            }

            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/profile
// @desc    Update user profile (e.g. name)
router.put('/profile', auth, async (req, res) => {
    const { name } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (name) user.name = name;
        
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
