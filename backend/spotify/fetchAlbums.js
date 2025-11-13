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
            /*
            "Taylor Swift", "Ariana Grande", "Billie Eilish", "Dua Lipa",
            "Olivia Rodrigo", "Harry Styles", "Ed Sheeran", "The Weeknd",
            "Bruno Mars", "Doja Cat", "Sabrina Carpenter", "Miley Cyrus",
            "Justin Bieber", "Selena Gomez", "Katy Perry", "Lady Gaga",
            "Adele", "Sam Smith", "Shawn Mendes", "Camila Cabello",
            "Charli XCX", "Troye Sivan", "Gracie Abrams", "Conan Gray",
            "Lorde", "RAYE", "Zara Larsson", "Bebe Rexha", 
            "Lauv", "Tate McRae"*/
            "Rihanna", "Sia", "Halsey", "Madison Beer", "Ava Max",
            "Kim Petras", "Meghan Trainor", "Anne-Marie", "Rita Ora",
            "Ellie Goulding", "Jessie J", "Demi Lovato", "Jonas Brothers",
            "OneRepublic", "Maroon 5", "Charlie Puth", "Khalid",
            "Alessia Cara", "Julia Michaels", "Fletcher", "Maisie Peters",
            "Holly Humberstone", "Reneé Rapp", "Chappell Roan", "Leah Kate"
        ];

        const rapArtists = [
            /*"Drake", "Kendrick Lamar", "Travis Scott", "Post Malone", "J. Cole",
            "Kanye West", "Lil Baby", "21 Savage", "Future", "Metro Boomin",
            "Tyler, The Creator", "Playboi Carti", "Lil Uzi Vert", "Juice WRLD",
            "XXXTentacion", "Polo G", "Roddy Ricch", "DaBaby", "Megan Thee Stallion",
            "Cardi B", "Nicki Minaj", "SZA",
            "A$AP Rocky", "Lil Durk", "Ice Spice", "Gunna",
            "Yeat", "Don Toliver", "Cordae", "Coi Leray", "Central Cee"*/
            "Eminem", "Lil Wayne", "Kid Cudi", "Big Sean", "Wiz Khalifa",
            "Mac Miller", "Logic", "Chance the Rapper", "Childish Gambino",
            "ScHoolboy Q", "Denzel Curry", "JID", "Smino", "EarthGang",
            "Isaiah Rashad", "Ski Mask The Slump God", "Trippie Redd",
            "NLE Choppa", "Lil Tjay", "Fivio Foreign", "Kodak Black",
            "NBA YoungBoy", "Moneybagg Yo", "EST Gee", "42 Dugg"
        ];

        const rockArtists = [
            /*"Arctic Monkeys", "The 1975", "Imagine Dragons", "Twenty One Pilots", "Fall Out Boy",
            "Panic! At The Disco", "Foo Fighters", "Red Hot Chili Peppers", "Radiohead", "Oasis",
            "Nirvana", "Green Day", "Linkin Park", "Paramore", "My Chemical Romance",
            "The Killers", "Muse", "Kings of Leon", "Weezer", 
            "The Strokes", "The Smashing Pumpkins", "The White Stripes",
            "Queens of the Stone Age", "Florence + The Machine"*/
            "Coldplay", "U2", "Metallica", "AC/DC", "Guns N' Roses",
            "Pearl Jam", "Soundgarden", "Alice In Chains", "Stone Temple Pilots",
            "Blink-182", "Sum 41", "The Offspring", "Good Charlotte",
            "Bring Me The Horizon", "Sleeping With Sirens", "Pierce The Veil",
            "Mayday Parade", "All Time Low", "Neck Deep", "The Maine",
            "YUNGBLUD", "Måneskin", "Greta Van Fleet", "Inhaler", "The Snuts"
        ];

        const countryArtists = [
            /*"Morgan Wallen", "Luke Combs", "Zach Bryan", "Chris Stapleton",
            "Kacey Musgraves", "Thomas Rhett", "Kane Brown",
            "Lainey Wilson", "Jason Aldean", "Brooks & Dunn",
            "Carly Pearce", "Jon Pardi", "Jordan Davis", "Bailey Zimmerman"*/
        ];

        const latinArtists = [
            /*"Bad Bunny", "J Balvin", "Peso Pluma", "Karol G", "Rosalía",
            "Daddy Yankee", "Maluma", "Ozuna", "Rauw Alejandro", "Feid",
            "Anitta", "Becky G", "Myke Towers", "El Alfa", 
            "Manuel Turizo", "Natti Natasha", "Young Miko", "Bizarrap"*/
            "Shakira", "Enrique Iglesias", "Luis Fonsi", "Romeo Santos",
            "Nicky Jam", "Arcángel", "Anuel AA", "Farruko", "Sech",
            "Jhayco", "Lunay", "Mora", "Eladio Carrion", "Tainy",
            "Kali Uchis", "Sebastián Yatra", "Prince Royce", "Camilo",
            "Reik", "Grupo Frontera", "Natanael Cano", "Junior H",
            "Eslabon Armado", "Yahritza Y Su Esencia", "Ivan Cornejo"
        ];

        const kpopArtists = [
            /*"BTS", "BLACKPINK", "Stray Kids", "SEVENTEEN", 
            "NewJeans", "TOMORROW X TOGETHER",
            "LE SSERAFIM", "IVE", "ITZY", "ENHYPEN", 
            "NCT DREAM", "TWICE", "ATEEZ"*/
        ];

        const indieArtists = [
            /*
            "Tame Impala", "Mac DeMarco", "Clairo", 
            "Cigarettes After Sex", "Mitski", "Phoebe Bridgers", "boygenius",
            "Beabadoobee", "Japanese Breakfast", "Soccer Mommy", 
            "Arctic Lake", "girl in red", "The Japanese House", 
            "Snail Mail", "Rex Orange County"*/
            "Bon Iver", "Sufjan Stevens", "The National", "Fleet Foxes",
            "Father John Misty", "Alvvays", "DIIV", "Beach House",
            "Real Estate", "Wild Nothing", "Homeshake", "Gus Dapperton",
            "Still Woozy", "Omar Apollo", "Dayglow", "Wallows",
            "The Marias", "Remi Wolf", "Jellyfish Entertainment", "Men I Trust",
            "boy pablo", "Cuco", "mxmtoon", "Current Joys", "Peach Pit"
        ];

        const electronicArtists = [
            /*"Calvin Harris", "The Chainsmokers", "David Guetta", 
            "Marshmello", "Avicii", "Martin Garrix", "Kygo", "Zedd", "Skrillex", "Diplo",
            "Knock2", "ISOxo", "MPH", "Daft Punk", "Kaytranada", 
            "Chris Lake", "Galantis", "Tiësto", "Dom Dolla", "John Summit", 
            "Alesso", "Madeon", "Porter Robinson", "Lane 8", "Fred again..", 
            "Disclosure", "Eric Prydz", "Peggy Gou", "Gorgon City"*/
        ];

        const rnbArtists = [
            /*"Frank Ocean", "Summer Walker", "Brent Faiyaz", 
            "Bryson Tiller", "H.E.R.", "Jhené Aiko", "The Weeknd", "Miguel",
            "Amy Winehouse", "Daniel Caesar", "Victoria Monét", 
            "Khalid", "Snoh Aalegra", "Giveon", "Mahalia", 
            "Chlöe", "6LACK", "SiR"*/
             "Usher", "Chris Brown", "Kehlani", "Ella Mai", "Trey Songz",
            "Ty Dolla $ign", "PARTYNEXTDOOR", "Tinashe", "Kiana Ledé",
            "Lucky Daye", "Joyce Wrice", "Ari Lennox", "Jazmine Sullivan",
            "Jorja Smith", "Sabrina Claudio", "Raveena", "UMI"
        ];

        const limit = 50;
        let allAlbums = [];

        //update which list to iterate through here
        for (const artist of popArtists) {
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
                genre: "Pop",
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