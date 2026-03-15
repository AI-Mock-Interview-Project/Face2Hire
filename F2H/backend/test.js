// test-mongo.js
import { MongoClient } from 'mongodb';

async function testConnection() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // List databases
    const databases = await client.db().admin().listDatabases();
    console.log('📊 Available databases:');
    databases.databases.forEach(db => console.log(`   - ${db.name}`));
    
    // Test if face2hire exists
    const db = client.db('face2hire');
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in 'face2hire':`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Is MongoDB installed?');
    console.log('   2. Is MongoDB running? (Run: net start MongoDB)');
    console.log('   3. Try: mongod --dbpath "C:\\data\\db"');
  } finally {
    await client.close();
  }
}

testConnection();