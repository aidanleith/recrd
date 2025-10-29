const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
// app.use(bodyParser.json());
app.use(express.json());

const MongoClient = require('mongodb').MongoClient;
//console.log(process.env.MONGO_URI);
const url = process.env.MONGO_URI;
const client = new MongoClient(url);
client.connect()

var api = require('./api.js');
api.setApp( app, client );

app.listen(5000); // start Node + Express server on port 5000