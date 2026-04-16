import express from 'express';

const router = express.Router();

router.post('/', (req: any, res: any) => {
  const { trainNumber, fromStation, toStation, seats } = req.body;
  const pnr = 'PNR' + Date.now().toString().slice(-6);
  
  res.json({
    success: true,
    pnr,
    message: `Booked ${seats} seats on ${trainNumber}`,
    bookingId: Date.now()
  });
});

router.get('/history', (req: any, res: any) => {
  res.json({
    success: true,
    bookings: [
      { pnr: 'PNR123456', train: '12601', status: 'Confirmed' }
    ]
  });
});

export default router;
