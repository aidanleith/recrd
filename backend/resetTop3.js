require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function resetTop3(username) {
    try {
        await client.connect();
        const db = client.db('recrd');
        
        if (username) {
            // Reset for specific username
            const result = await db.collection('Users').updateOne(
                { username: username },
                { $set: { top3: [] } }
            );
            
            if (result.matchedCount === 0) {
                console.log(`User "${username}" not found.`);
            } else {
                console.log(`Successfully reset top3 for user "${username}".`);
            }
        } else {
            // Reset for all users (use with caution!)
            const result = await db.collection('Users').updateMany(
                {},
                { $set: { top3: [] } }
            );
            console.log(`Successfully reset top3 for ${result.modifiedCount} users.`);
        }
    } catch (error) {
        console.error('Error resetting top3:', error);
    } finally {
        await client.close();
    }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
    console.log('Usage: node resetTop3.js <username>');
    console.log('Example: node resetTop3.js myusername');
    console.log('\nOr to reset all users (use with caution):');
    console.log('node resetTop3.js --all');
    process.exit(1);
}

if (username === '--all') {
    console.log('WARNING: This will reset top3 for ALL users!');
    resetTop3(null);
} else {
    resetTop3(username);
}

