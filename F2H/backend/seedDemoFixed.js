const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/face2hire');

const InterviewSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  title: String,
  type: { type: String, default: 'ai-generated' },
  role: String,
  status: String,
  scores: {
    overall: Number,
    communication: Number,
    content: Number,
    confidence: Number
  },
  metadata: {
    completedAt: Date,
    totalDuration: Number
  }
}, { collection: 'interviews' });

const Interview = mongoose.model('InterviewTemp', InterviewSchema);

async function seed() {
  const user = await mongoose.model('User', require('./models/User').schema).findOne({email: 'fazilatfatima313@gmail.com'});
  if (!user) {
    console.log('No user');
    mongoose.disconnect();
    return;
  }
  const userId = user._id;
  console.log('User:', userId.toString());

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const interview = new Interview({
      user: userId,
      title: `Practice Interview #${i+1}`,
      type: 'ai-generated',
      role: 'Software Engineer',
      status: 'completed',
      scores: {
        overall: 65 + i * 3.5,
        communication: 70 + i * 3.1,
        content: 62 + i * 3.8,
        confidence: 68 + i * 3.3
      },
      metadata: {
        completedAt: date,
        totalDuration: 1200 + i * 100
      }
    });
    await interview.save();
    console.log(`Seeded #${i+1} (${Math.round(interview.scores.overall)}%) ${date.toDateString()}`);
  }
  console.log('Demo data seeded to interviews collection!');
  mongoose.disconnect();
}

seed().catch(console.error);

