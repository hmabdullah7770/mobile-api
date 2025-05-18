import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  purpose: { 
    type: String, 
    required: true, 
    enum: ['registration', 'password_reset'] 
  } // Purpose field for differentiating OTP types
});

// TTL index: Automatically remove documents once expiresAt is reached.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if model exists before creating to prevent overwriting
export const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);

