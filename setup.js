const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  console.log('🚀 WebChat Setup');
  console.log('=================\n');
  
  console.log('This application requires MongoDB to store chat data.');
  console.log('You have two options:\n');
  
  console.log('1. 🌐 MongoDB Atlas (Cloud - Recommended)');
  console.log('   - Free tier available');
  console.log('   - No local installation required');
  console.log('   - Reliable and scalable\n');
  
  console.log('2. 🏠 Local MongoDB');
  console.log('   - Requires MongoDB installation');
  console.log('   - Runs on your machine\n');
  
  const choice = await askQuestion('Choose your MongoDB setup (1 for Atlas, 2 for Local): ');
  
  if (choice === '1') {
    await setupAtlas();
  } else if (choice === '2') {
    await setupLocal();
  } else {
    console.log('❌ Invalid choice. Please run the setup again.');
    process.exit(1);
  }
  
  rl.close();
}

async function setupAtlas() {
  console.log('\n📋 MongoDB Atlas Setup Instructions:');
  console.log('=====================================\n');
  
  console.log('1. Go to https://www.mongodb.com/atlas');
  console.log('2. Create a free account or sign in');
  console.log('3. Create a new cluster (choose the free tier)');
  console.log('4. Create a database user:');
  console.log('   - Go to Database Access');
  console.log('   - Add New Database User');
  console.log('   - Choose Password authentication');
  console.log('   - Set username and password');
  console.log('   - Grant "Read and write to any database" privileges');
  console.log('5. Configure network access:');
  console.log('   - Go to Network Access');
  console.log('   - Add IP Address');
  console.log('   - Choose "Allow access from anywhere" (0.0.0.0/0)');
  console.log('6. Get your connection string:');
  console.log('   - Go to Clusters');
  console.log('   - Click "Connect"');
  console.log('   - Choose "Connect your application"');
  console.log('   - Copy the connection string\n');
  
  const connectionString = await askQuestion('Enter your MongoDB Atlas connection string: ');
  
  if (connectionString.trim()) {
    updateEnvFile(connectionString.trim());
    console.log('\n✅ Configuration saved!');
    console.log('\n🎉 Setup complete! You can now run:');
    console.log('   npm run process-data  # Process sample data');
    console.log('   npm start            # Start the server');
  } else {
    console.log('❌ No connection string provided. Please update .env file manually.');
  }
}

async function setupLocal() {
  console.log('\n📋 Local MongoDB Setup Instructions:');
  console.log('====================================\n');
  
  console.log('1. Download and install MongoDB Community Server:');
  console.log('   https://www.mongodb.com/try/download/community');
  console.log('2. Start MongoDB service:');
  console.log('   - Windows: Start "MongoDB" service from Services');
  console.log('   - macOS: brew services start mongodb-community');
  console.log('   - Linux: sudo systemctl start mongod');
  console.log('3. MongoDB will be available at: mongodb://localhost:27017\n');
  
  const isInstalled = await askQuestion('Have you installed and started MongoDB? (y/n): ');
  
  if (isInstalled.toLowerCase() === 'y') {
    updateEnvFile('mongodb://localhost:27017/whatsapp');
    console.log('\n✅ Configuration saved!');
    console.log('\n🎉 Setup complete! You can now run:');
    console.log('   npm run process-data  # Process sample data');
    console.log('   npm start            # Start the server');
  } else {
    console.log('\n⚠️  Please install and start MongoDB first, then run this setup again.');
  }
}

function updateEnvFile(mongoUri) {
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update MongoDB URI
  envContent = envContent.replace(
    /MONGODB_URI=.*/,
    `MONGODB_URI=${mongoUri}`
  );
  
  fs.writeFileSync(envPath, envContent);
}

if (require.main === module) {
  setup().catch(console.error);
}

module.exports = { setup };