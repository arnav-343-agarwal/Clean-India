import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  upvote: {
    type: Boolean,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
reviewSchema.index({ report: 1, createdAt: -1 });
reviewSchema.index({ author: 1 });
reviewSchema.index({ upvote: 1 });

// Compound index to ensure one review per user per report
reviewSchema.index({ report: 1, author: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review; 