const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
// app.use(bodyParser.json());
app.use(express.json());

const MongoClient = require('mongodb').MongoClient;
const url = process.env.MONGO_URI;
const client = new MongoClient(url);
client.connect()

app.use((req, res, next) =>
{
    
    app.get("/api/ping", (req, res, next) => {
        res.status(200).json({ message: "Hello World" });
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

app.post('/api/addcard', async (req, res, next) =>
{
    // incoming: userId, color
    // outgoing: error

    const { userId, card } = req.body;
    const newCard = {Card:card,UserId:userId};
    var error = '';
    
    try
    {
        const db = client.db('recrd');

        await db.collection('Cards').insertOne(newCard);
    }
    catch(e)
    {
        error = e.toString();
    }

    var ret = { error: error };
    res.status(200).json(ret);
});

app.post('/api/login', async (req, res, next) =>
{
    // incoming: login, password
    // outgoing: id, firstName, lastName, error

    var error = '';
    const { login, password } = req.body;
    const db = client.db('recrd');
    const results = await db.collection('Users').find({username:login, password:password}).toArray();
    var id = -1;
    var fn = '';
    var ln = '';
    
    if( results.length > 0 )
    {
        id = results[0].UserID;
        fn = results[0].FirstName;
        ln = results[0].LastName;
    }

    var ret = { id:id, firstName:fn, lastName:ln, error:''};
    res.status(200).json(ret);
});

// Registration endpoint
app.post('/api/register', async (req, res, next) => {
    // incoming: username, email, password
    // outgoing: error

    const { username, email, password } = req.body || {};
    console.log('Register endpoint called with:', { username, email });

    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
    }

    try {
        const db = client.db('recrd');

        // Check for existing username or email
        const existingUser = await db.collection('Users').findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'username or email already exists' });
        }

        // Build a user document that mirrors the fields used elsewhere in the codebase
        const newUser = {
            UserID: Date.now(), // numeric id
            username: String(username),
            email: email ? String(email) : '',
            password: String(password), // NOTE: store hashed password in production
            following: [],
            followers: [],
            createdAt: new Date()
        };

        // Optional fields: accept firstName/lastName if client sent them
        if (req.body.firstName) newUser.FirstName = String(req.body.firstName);
        if (req.body.lastName) newUser.LastName = String(req.body.lastName);

        console.log('Inserting user document:', newUser);

        const insertResult = await db.collection('Users').insertOne(newUser);
        console.log('Insert result:', insertResult.insertedId);

        return res.status(200).json({ error: '' });
    } catch (e) {
        console.error('Register error:', e);
        // If this is a MongoServerError about validation, return the message so you can inspect it
        return res.status(500).json({ error: e && e.message ? e.message : String(e) });
    }
});

app.post('/api/searchcards', async (req, res, next) =>
{
    // incoming: userId, search
    // outgoing: results[], error
    
    var error = '';
    
    const { userId, search } = req.body;
    
    var _search = search.trim();

    const db = client.db('recrd');
    const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();

    var _ret = [];

    for( var i=0; i<results.length; i++ )
    {
        _ret.push( results[i].Card );
    }
    
    var ret = {results:_ret, error:error};
    res.status(200).json(ret);
});

app.listen(5000); // start Node + Express server on port 5000