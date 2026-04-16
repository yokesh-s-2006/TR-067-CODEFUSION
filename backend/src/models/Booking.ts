import mongoose, { Schema, Document } from 'mongoose';

export interface IPassenger {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  seatPreference?: string;
}

export interface IBooking extends Document {
  pnr: string;
  trainId: string;
  userId: string;
  passengers: IPassenger[];
  classType: 'sleeper' | 'ac3' | 'ac2' | 'ac1';
  date: Date;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PassengerSchema = new Schema<IPassenger>({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  seatPreference: { type: String },
});

const BookingSchema = new Schema<IBooking>(
  {
    pnr: { type: String, required: true, unique: true },
    trainId: { type: String, required: true },
    userId: { type: String, required: true },
    passengers: { type: [PassengerSchema], required: true },
    classType: {
      type: String,
      enum: ['sleeper', 'ac3', 'ac2', 'ac1'],
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'waitlisted', 'cancelled'],
      default: 'confirmed',
    },
    totalAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
