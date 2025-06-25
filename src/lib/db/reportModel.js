import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['garbage', 'waterlogging', 'other']
  },
  location: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  imageUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Indexes for faster queries
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ category: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ resolved: 1 });
reportSchema.index({ createdBy: 1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report; 