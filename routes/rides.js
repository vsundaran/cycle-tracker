const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');

// @route   POST api/rides
// @desc    Start a new ride
router.post('/', auth, async (req, res) => {
    try {
        const newRide = new Ride({
            userId: req.user.id,
            title: req.body.title || 'New Ride',
            startTime: new Date(),
            status: 'active'
        });

        const ride = await newRide.save();
        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/rides/:id/coordinates
// @desc    Add coordinates to an active ride
router.put('/:id/coordinates', auth, async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        if (ride.status !== 'active') {
            return res.status(400).json({ message: 'Ride is not active' });
        }

        ride.route.push(...req.body.coordinates);
        await ride.save();

        res.json(ride.route);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/rides/:id/end
// @desc    End a ride and update stats
router.put('/:id/end', auth, async (req, res) => {
    const { distance, duration, avgSpeed, calories } = req.body;

    try {
        let ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        ride.endTime = new Date();
        ride.duration = duration;
        ride.distance = distance;
        ride.avgSpeed = avgSpeed;
        ride.calories = calories;
        ride.status = 'completed';

        await ride.save();

        // Update User Lifetime Stats
        const user = await User.findById(req.user.id);
        user.lifetimeStats.totalDistance += distance;
        user.lifetimeStats.totalDuration += duration;
        user.lifetimeStats.totalCalories += calories;
        
        // Simple recalculation of lifetime average speed
        const totalHours = user.lifetimeStats.totalDuration / 3600;
        if (totalHours > 0) {
            user.lifetimeStats.avgSpeed = user.lifetimeStats.totalDistance / totalHours;
        }

        await user.save();

        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/rides
// @desc    Get all rides for a user
router.get('/', auth, async (req, res) => {
    try {
        const rides = await Ride.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(rides);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/rides/latest
// @desc    Get latest ride for user
router.get('/latest', auth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/rides/:id
// @desc    Get ride by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
