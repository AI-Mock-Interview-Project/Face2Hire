import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
await new Promise((resolve, reject) => {
  mongoose.connect('mongodb://localhost:27017/face2hire');
  mongoose.connection.on('connected', resolve);
  mongoose.connection.on('error', reject);
});

async function seed() {
  const db = mongoose.connection.db;

  const userEmail = 'fazilatfatima313@gmail.com';
  const user = await db.collection('users').findOne({email: userEmail});
  if (!user) {
    console.log('No user');
    process.exit();
  }
  const userId = user._id;
  console.log('Seeding for user:', userId);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
await db.collection('interviews').insertOne({
      user: userId,
      title: `Practice Interview #${i+1}`,
      type: 'ai-generated',
      role: 'Software Engineer',
      company: 'Demo Corp',
      status: 'completed',
      jobDescription: {
        requirements: [],
        skills: []
      },
      settings: {
        avatar: 'female-1',
        voiceEnabled: false,
        difficulty: 'intermediate',
        questionCount: 5,
        timeLimit: 0
      },
      questions: [],
      responses: [],
      scores: {
        communication: Math.round(70 + i * 3),
        content: Math.round(62 + i * 4),
        confidence: Math.round(68 + i * 3),
        overall: Math.round(65 + i * 3.5)
      },
      feedback: {
        summary: 'Demo interview',
        strengths: ['Good structure'],
        improvements: ['Add examples'],
        recommendations: []
      },
      metadata: {
        startedAt: new Date(date.getTime() - 3600000),
        completedAt: date,
        totalDuration: 1200 + i * 100,
        pauses: [],
        browserInfo: {},
        ipAddress: '127.0.0.1'
      },
      isActive: true,
      createdAt: date,
      updatedAt: date
    });

    console.log(`Inserted demo #${i+1} score ${65 + i * 3.5}% on ${date.toDateString()}`);
  }
  console.log('Mock data inserted directly to interviews collection!');
  mongoose.disconnect();
}

seed().catch(console.error);

