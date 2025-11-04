//this file is used to retrieve albums by genre
//NOTE: make sure you retrieve a valid access token every hour
require("dotenv").config();
const {MongoClient} = require('mongodb')

const uri = process.env.MONGO_URI
const client = new MongoClient(uri)
const token = process.env.SPOTIFY_TOKEN

//fetch albums from range of genres
async function fetchAlbums(){
    try {
        let errors = 0
        //connect to db
        await client.connect();
        const db = client.db('recrd');

        //select desired list of artists to retrieve from
        const popArtists = [
            "Taylor Swift", "Ariana Grande", "Billie Eilish", "Dua Lipa",
            "Olivia Rodrigo", "Harry Styles", "Ed Sheeran", "The Weeknd",
            "Bruno Mars", "Doja Cat", "Sabrina Carpenter", "Miley Cyrus",
            "Justin Bieber", "Selena Gomez", "Katy Perry", "Lady Gaga",
            "Adele", "Sam Smith", "Shawn Mendes", "Camila Cabello"
        ];

        const rapArtists = [
            "Drake", "Kendrick Lamar", "Travis Scott", "Post Malone", "J. Cole",
            "Kanye West", "Lil Baby", "21 Savage", "Future", "Metro Boomin",
            "Tyler, The Creator", "Playboi Carti", "Lil Uzi Vert", "Juice WRLD",
            "XXXTentacion", "Polo G", "Roddy Ricch", "DaBaby", "Megan Thee Stallion",
            "Cardi B", "Nicki Minaj", "SZA"
        ]

        const rockArtists = [
            "Arctic Monkeys", "The 1975", "Imagine Dragons", "Twenty One Pilots", "Fall Out Boy",
            "Panic! At The Disco", "Foo Fighters", "Red Hot Chili Peppers", "Radiohead", "Oasis",
            "Nirvana", "Green Day", "Linkin Park", "Paramore", "My Chemical Romance"
        ]

        const countryArtists = [
            "Morgan Wallen", "Luke Combs", "Zach Bryan", "Chris Stapleton",
            "Kacey Musgraves", "Thomas Rhett", "Kane Brown"
        ];

        const latinArtists = [
            "Bad Bunny", "J Balvin", "Peso Pluma", "Karol G", "Rosalía",
            "Daddy Yankee", "Maluma", "Ozuna", "Rauw Alejandro", "Feid"
        ];

        const kpopArtists = ["BTS", "BLACKPINK", "Stray Kids", "SEVENTEEN", 
        "NewJeans", "TOMORROW X TOGETHER"];

        const indieArtists = ["Tame Impala", "Mac DeMarco", "Clairo", 
        "Cigarettes After Sex", "Mitski", "Phoebe Bridgers", "boygenius"];

        const electronicArtists = ["Calvin Harris", "The Chainsmokers", "David Guetta", 
        "Marshmello", "Avicii", "Martin Garrix", "Kygo", "Zedd", "Skrillex", "Diplo"];
            
        //add amy winehouse
        const rnbArtists = ["Frank Ocean", "Summer Walker", "Brent Faiyaz", 
        "Bryson Tiller", "H.E.R.", "Jhené Aiko", "The Weeknd", "Miguel"];

        const limit = 50;
        let allAlbums = [];

        //update which list to iterate through here
        for (const artist of rnbArtists) {
            const url = `https://api.spotify.com/v1/search?type=album&q=artist:${artist}&limit=${limit}`;
            try {
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                allAlbums = allAlbums.concat(data.albums.items);
            } catch (err) {
                console.error(`Error fetching ${artist}:`, err);
            }
        }

        console.log("Total albums fetched:", allAlbums.length);

        for (const album of allAlbums) {
            const artistNames = album.artists.map(a => a.name).join(', ');
            const newAlbum = {
                title: album.name,
                artist: artistNames,
                releaseDate: new Date(album.release_date),
                genre: "R&B/Soul",
                coverArtUrl: album.images?.[0]?.url || "",
                createdAt: new Date()
            };

            try {
                await db.collection('Albums').insertOne(newAlbum);
            } catch (err) {
                errors += 1
                console.error(`Error inserting album ${album.name}:`, err);
            }
        }
        console.log(`Errors encountered: ${errors}`)
        console.log("All albums inserted.");
    } catch (err) {
        console.error("DB connection error:", err);
    } finally {
        await client.close();
    }
}

fetchAlbums()