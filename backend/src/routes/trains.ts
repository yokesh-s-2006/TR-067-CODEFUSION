import express from 'express';
import Redis from 'redis';
import { redisClient } from '../server';

const router = express.Router();

// Mock train data
const trains = [
  {
    number: "12601",
    name: "Chennai Mail",
    from: { code: "MAS", name: "Chennai Central" },
    to: { code: "NDLS", name: "New Delhi" },
    departure: "18:30",
    arrival: "12:45",
    duration: "42h 15m",
    fare: 2500,
    seats: { Sleeper: 120, AC3: 45, AC2: 30 }
  },
  {
    number: "12603",
    name: "Chennai-Delhi SF Express",
    from: { code: "MAS", name: "Chennai Central" },
    to: { code: "NDLS", name: "New Delhi" },
    departure: "19:45",
    arrival: "14:20",
    duration: "42h 35m",
    fare: 2800,
    seats: { Sleeper: 80, AC3: 60, AC2: 40 }
  }
];

router.get('/search', async (req: any, res: any) => {
  try {
    const { source, destination, date } = req.query;
    
    const cacheKey = `trains:${source}:${destination}:${date}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const results = trains.filter((train: any) =>
      train.from.code === source && train.to.code === destination
    );

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
    
    res.json({
      success: true,
      trains: results,
      total: results.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
