const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/face2hire');

const User = mongoose.model('User', require('./models/User').schema);
const Interview = mongoose.model('Interview', require('./models/Interview').schema);

async function seed() {
  const user = await User.findOne({email: 'fazilatfatima313@gmail.com'});
  if (!user) {
    console.log('No user found');
    mongoose.disconnect();
    return;
  }
  const userId = user._id;
  console.log('User ID:', userId.toString());

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const interview = new Interview({
      user: userId,
      title: `Practice Interview #${i+1}`,
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
    console.log(`Seeded ${interview.title} (${interview.scores.overall}%) on ${date.toDateString()}`);
  }
  console.log('7 demo interviews seeded!');
  mongoose.disconnect();
}

seed().catch(console.error);

