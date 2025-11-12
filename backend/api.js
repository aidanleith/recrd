require('express');
const { ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

//Install these in the backend folder if you dont have them
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

//Used for Hashing
const saltRounds = 10;
//30 Minutes to milliseconds
const otpExpirationTime = 30 * 60000;
const passwordExpirationTime = 10 * 60000;

//Used for password link in email, change to domain name / ip when on server
const app_name = 'localhost:5173'
//const app_name = '45.55.136.167'

exports.setApp = function (app, client) {
    app.post('/api/followUser', async (req, res, next) => {
        // incoming: userId, JWT
        // outgoing: error
        const { userId, jwtToken } = req.body;
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }
        var error = '';
        decodedToken = jwt.decode(jwtToken);
        var objectUserId = new ObjectId(String(userId));
        var objectDecodedId = new ObjectId(String(decodedToken.id));
        try {
            const db = client.db('recrd');
            await db.collection('Users').findOneAndUpdate({ _id: objectDecodedId }, { $push: { following: objectUserId } });
            await db.collection('Users').findOneAndUpdate({ _id: objectUserId }, { $push: { followers: objectDecodedId } });
            //console.log(test1, test2);
        }
        catch (e) {
            error = e.toString();
        }
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/createRanking', async (req, res, next) => {
        // incoming: albumId, rankvalue, notes, JWT
        // outgoing: error

        const { albumId, rankValue, notes, jwtToken } = req.body;
        decodedToken = jwt.decode(jwtToken);
        //Might want to check if user has already added a ranking
        var objectDecodedId = new ObjectId(String(decodedToken.id));
        const newRanking = {
            user: objectDecodedId,
            album: new ObjectId(String(albumId)),
            rankValue: rankValue,
            notes: notes,
            createdAt: new Date()
        };
        console.log(newRanking);
        var error = '';
        try {
            const db = client.db('recrd');

            await db.collection('Rankings').insertOne(newRanking);
        }
        catch (e) {
            error = e.toString();
        }
        res.status(200).json(error);
    });
    app.post('/api/addTopThree', async (req, res, next) => {
        // incoming: albumId, JWT
        // outgoing: error

        const { albumId, jwtToken } = req.body;
        decodedToken = jwt.decode(jwtToken);
        var objectDecodedId = new ObjectId(String(decodedToken.id));
        var objectAlbumId = new ObjectId(String(albumId))
        var error = '';
        try {
            const db = client.db('recrd');
            await db.collection('Users').findOneAndUpdate({ _id: objectDecodedId }, { $push: { top3: objectAlbumId } });
        }
        catch (e) {
            error = e.toString();
        }
        res.status(200).json(error);
    });

    app.post('/api/addToListen', async (req, res, next) => {
        // incoming: albumId, JWT
        // outgoing: error

        const { albumId, jwtToken } = req.body;
        decodedToken = jwt.decode(jwtToken);
        var objectDecodedId = new ObjectId(String(decodedToken.id));
        var objectAlbumId = new ObjectId(String(albumId))
        var error = '';
        try {
            const db = client.db('recrd');
            await db.collection('Users').findOneAndUpdate({ _id: objectDecodedId }, { $push: { toListen: objectAlbumId } });
        }
        catch (e) {
            error = e.toString();
        }
        res.status(200).json(error);
    });

    app.patch('/api/editRanking', async (req, res, next) => {
        // incoming: albumId, rankValue, notes, JWT
        // outgoing: error

        const { albumId, rankValue, notes, jwtToken } = req.body;
        decodedToken = jwt.decode(jwtToken);
        var objectDecodedId = new ObjectId(String(decodedToken.id));
        var error = '';
        try {
            const db = client.db('recrd');

            const result = await db.collection('Rankings').updateOne(
                {
                    user: objectDecodedId,
                    album: new ObjectId(String(albumId))
                },
                {
                    $set: {
                        rankValue: rankValue,
                        notes: notes,
                        createdAt: new Date() // Update the date when edited
                    }
                }
            );

            if (result.matchedCount === 0) {
                error = 'Ranking not found';
            }
        }
        catch (e) {
            error = e.toString();
        }
        res.status(200).json(error);
    });

    app.post('/api/addcard', async (req, res, next) => {
        // incoming: userId, color
        // outgoing: error
        const { userId, card, jwtToken } = req.body;
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }
        const newCard = { Card: card, UserId: userId };
        var error = '';
        try {
            const db = client.db();
            const result = db.collection('Cards').insertOne(newCard);
        }
        catch (e) {
            error = e.toString();
        }
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/login', async (req, res, next) => {
        // incoming: username, password
        // outgoing: JWT, error
        var error = '';
        console.log('LOGIN ATTEMPT BODY:', req.body);
        const { username, password } = req.body;
        // Trim whitespace from password to avoid comparison issues
        const trimmedPassword = password ? password.trim() : '';
        const db = client.db('recrd'); // Use the actual DB name
        const results = await db.collection('Users').find({ username: username }).toArray();
        console.log('DB QUERY RESULTS:', results);
        var id = -1;
        var email = '';
        var ret = { error: "Username or Password incorrect" }; // Initialize with default error
        if (results.length > 0) {
            //Check if password matches the hashed one
            const hashedPassword = results[0].password;
            console.log('Comparing password (length:', trimmedPassword.length, '):', JSON.stringify(trimmedPassword), 'with hash:', hashedPassword);
            console.log('Hash type:', typeof hashedPassword, 'Hash length:', hashedPassword ? hashedPassword.length : 'null');

            // Verify hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
            if (!hashedPassword || typeof hashedPassword !== 'string' || !hashedPassword.startsWith('$2')) {
                console.log('ERROR: Invalid hash format in database!');
                ret = { error: "Database error: Invalid password hash format" };
            } else {
                const passwordMatch = await bcrypt.compare(trimmedPassword, hashedPassword);
                console.log('Password match result:', passwordMatch);
                if (passwordMatch) {
                    id = results[0]._id;
                    email = results[0].email;
                    try {
                        const token = require("./createJWT.js");
                        // Convert ObjectId to string for JWT
                        const idString = id.toString();
                        ret = token.createToken(email, idString);
                        console.log('Token created, ret:', ret);
                    }
                    catch (e) {
                        console.log('Error creating token:', e);
                        ret = { error: e.message };
                    }
                }
                else {
                    //Incorrect Password
                    console.log('Password comparison failed');
                    ret = { error: "Username or Password incorrect" };
                }
            }
        }
        else {
            //User not found
            console.log('User not found');
            ret = { error: "Username or Password incorrect" };
        }
        console.log('Sending response:', ret);
        res.status(200).json(ret);
    });

    app.post('/api/register', async (req, res, next) => {
        // incoming: username, email, password
        // outgoing: error

        const { username, email, password } = req.body;
        //Hash the password to be put in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //Create 6 Digit OTP and then hash it for the database
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedOtp = await bcrypt.hash(otp, saltRounds);

        sendVerificationEmail(email, otp);
        const newUser = {
            username: String(username),
            email: String(email),
            password: String(hashedPassword),
            following: [],
            followers: [],
            createdAt: new Date(),
            isVerified: false,
            toListen: [],
            top3: [],
            otp: String(hashedOtp),
            otpCreatedAt: Date.now(),
            otpExpiresAt: Date.now() + otpExpirationTime
        };
        var error = '';

        //Try adding user to database
        try {
            const db = client.db('recrd');

            await db.collection('Users').insertOne(newUser);
        }
        catch (e) {
            error = e.toString();
        }
        res.status(200).json(error);
    });

    const sendVerificationEmail = async (email, otp) => {
        const transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "apikey",
                pass: process.env.SENDGRID_SMTP_RELAY,
            },
        });

        const info = await transporter.sendMail({
            from: 'recrd@hamsterrunner.com',
            to: email,
            subject: "Verifiy Your RECRD Account",
            text: "Your verification code is: " + otp + "."
                + "\nYour code will expire in " + otpExpirationTime / 60000 + " minutes.", // plain‑text body
        });

    };

    app.post('/api/verifyOTP', async (req, res, next) => {
        // incoming: username, otp
        // outgoing: JWT, error
        var error = '';
        const { username, otp } = req.body;
        const db = client.db('recrd');
        const results = await
            db.collection('Users').find({ username: username }).toArray
                ();
        var id = -1;
        var email = '';
        var ret;

        if (results.length > 0) {
            const expirationTime = results[0].otpExpiresAt;
            if (expirationTime > Date.now()) {
                const hashedOtp = results[0].otp;
                if (await bcrypt.compare(String(otp), hashedOtp)) {
                    //Set account to verified and removed OTP fields from database
                    try {
                        await db.collection('Users').findOneAndUpdate({ username: username }, { $set: { isVerified: true }, $unset: { otp: "", otpCreatedAt: "", otpExpiresAt: "" } });
                    }
                    catch (e) {
                        ret = { error: e.message };
                    }

                    //Create the JWT
                    id = results[0]._id;
                    email = results[0].email;
                    try {
                        const token = require("./createJWT.js");
                        // Convert ObjectId to string for JWT
                        const idString = id.toString();
                        ret = token.createToken(email, idString);
                    }
                    catch (e) {
                        ret = { error: e.message };
                    }
                }
                else {
                    ret = { error: "OTP is incorrect" };
                }
            }
            else {
                ret = { error: "The OTP has expired" }
            }
        }
        else {
            ret = { error: "User already verified or does not exist" };
        }
        res.status(200).json(ret);
    });

    app.post('/api/forgotPassword', async (req, res, next) => {
        // incoming: email
        // outgoing: error

        const { email } = req.body;

        var error = '';
        console.log('LOGIN ATTEMPT BODY:', req.body);
        const db = client.db('recrd'); // Use the actual DB name
        const results = await db.collection('Users').find({ email: email }).toArray();
        console.log('DB QUERY RESULTS:', results);
        var id = -1;
        var ret;
        if (results.length > 0) {
            id = results[0]._id;
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            const resetTokenExpiration = Date.now() + passwordExpirationTime;

            try {
                await db.collection('Users').findOneAndUpdate({ email: email }, { $set: { passwordResetToken: hashedResetToken, passwordResetTokenExpires: resetTokenExpiration } });
            }
            catch (e) {
                ret = e;
            }
            console.log(resetToken, hashedResetToken);

            sendPasswordResetEmail(email, resetToken, req);

        }
        else {
            ret = { error: "User does not exist with that email" };
        }

        res.status(200).json(ret);
    });

    const sendPasswordResetEmail = async (email, resetToken, req) => {
        const transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "apikey",
                pass: process.env.SENDGRID_SMTP_RELAY,
            },
        });

        const info = await transporter.sendMail({
            from: 'recrd@hamsterrunner.com',
            to: email,
            subject: "Reset Your RECRD Password",
            text: `Your password reset link is: http://${app_name}/reset-password/${resetToken}`
                + "\nYour link will expire in " + passwordExpirationTime / 60000 + " minutes.", // plain‑text body
        });

    };

    app.patch('/api/resetPassword/:token', async (req, res, next) => {
        // incoming: password
        // outgoing: JWT, error

        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        console.log('LOGIN ATTEMPT BODY:', req.body);
        const db = client.db('recrd'); // Use the actual DB name
        const results = await db.collection('Users').find({ passwordResetToken: hashedToken }).toArray();
        console.log('DB QUERY RESULTS:', results);
        var error = '';
        var id = -1;
        var email = '';
        var ret;
        if (results.length > 0) {
            const expirationTime = results[0].passwordResetTokenExpires;
            id = results[0]._id;
            email = results[0].email;
            if (expirationTime > Date.now()) {
                try {
                    await db.collection('Users').findOneAndUpdate({ passwordResetToken: hashedToken },
                        { $set: { password: hashedPassword }, $unset: { passwordResetToken: "", passwordResetTokenExpires: "" } });
                }
                catch (e) {
                    ret = e;
                }
                //Create the JWT
                id = results[0]._id;
                email = results[0].email;
                try {
                    const token = require("./createJWT.js");
                    // Convert ObjectId to string for JWT
                    const idString = id.toString();
                    ret = token.createToken(email, idString);
                }
                catch (e) {
                    ret = { error: e.message };
                }
            } else {
                ret = { error: "Token has expired" };
            }
        } else {
            ret = { error: "Invalid Reset Token" };
        }

        res.status(200).json(ret);
    });

    app.get('/api/users/:username', async (req, res, next) => {
        // incoming: 
        // outgoing: id, toListen, topThree, followerCount, followingCount, albums
        // album = {title, artist, coverArtUrl, rankValue, notes}

        const username = req.params.username;

        console.log('LOGIN ATTEMPT BODY:', req.body);
        const db = client.db('recrd'); // Use the actual DB name
        const userResults = await db.collection('Users').find({ username: username }).toArray();
        console.log('DB QUERY RESULTS:', userResults);
        var error = '';
        var ret;
        var id = -1;
        var toListen = [];
        var topThree = [];
        var followerCount, followingCount;
        if (userResults.length > 0) {
            id = userResults[0]._id;
            toListen = userResults[0].toListen;
            topThree = userResults[0].top3;
            followerCount = userResults[0].followers.length;
            followingCount = userResults[0].following.length;

            //Might want to make this only display 5 most recent and then allow a view all option
            const rankingResults = await db.collection('Rankings').find({ user: id }).toArray();

            //Gets album info for each album and compiles it to be returned
            const albums = await Promise.all(rankingResults.map(async ranking => {
                var album = new Object();
                try {
                    const albumResults = await db.collection('Albums').find({ _id: ranking.album }).toArray();
                    if (albumResults.length > 0) {
                        album.title = albumResults[0].title;
                        album.artist = albumResults[0].artist;
                        album.coverArtUrl = albumResults[0].coverArtUrl;
                        album.rankValue = ranking.rankValue;
                        album.notes = ranking.notes;
                        console.log('ALBUM RESULTS:', album);
                        return album;
                    } else {
                        ret = { error: "No Album exists for id: " + ranking.album };
                        return error;
                    }
                }
                catch (error) {
                    console.error("Error finding album: ", error);
                    return error;
                }
            }));

            ret = { id: id, toListen: toListen, topThree: topThree, followerCount: followerCount, followingCount: followingCount, albums: albums }

        } else {
            ret = { error: "User Not Found" };
        }

        res.status(200).json(ret);
    });

    // Get user info by ID (for getting current user's username)
    app.get('/api/userById/:id', async (req, res, next) => {
        const userId = req.params.id;
        const db = client.db('recrd');
        try {
            const userResults = await db.collection('Users').find({ _id: new ObjectId(userId) }).toArray();
            if (userResults.length > 0) {
                res.status(200).json({ username: userResults[0].username, email: userResults[0].email });
            } else {
                res.status(200).json({ error: "User not found" });
            }
        } catch (e) {
            res.status(200).json({ error: e.message });
        }
    });

    app.get('/api/albums/:title', async (req, res, next) => {
        // incoming: 
        // outgoing: id, artist, releaseDate, genre, coverArtUrl, averageRanking, rankings
        // rankings = { username, rankvalue, notes, createdAt }

        // Might want to use ID instead of name because of special characters
        // Would have to change search albums api as well
        const title = req.params.title.replace(/-/g, ' ');

        console.log('Searching for album with title:', title);
        const db = client.db('recrd'); // Use the actual DB name
        // Use case-insensitive search with regex
        const albumResults = await db.collection('Albums').find({
            title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).toArray();
        console.log('DB QUERY RESULTS:', albumResults);
        var error = '';
        var ret;
        var id = -1;
        var artist, genre, coverArtUrl;
        var releaseDate;
        var averageRanking;
        if (albumResults.length > 0) {
            id = albumResults[0]._id;
            const albumTitle = albumResults[0].title;
            artist = albumResults[0].artist;
            genre = albumResults[0].genre;
            coverArtUrl = albumResults[0].coverArtUrl;
            releaseDate = albumResults[0].releaseDate;

            //Might want to make this only display 5 most recent and then allow a view all option
            const rankingResults = await db.collection('Rankings').find({ album: id }).toArray();
            var rankings;

            var totalRankingAmount = 0;
            rankingResults.forEach(ranking => {
                totalRankingAmount += ranking.rankValue;
            });
            averageRanking = totalRankingAmount / rankingResults.length;

            if (rankingResults.length > 0) {
                //Gets album info for each album and compiles it to be returned
                rankings = await Promise.all(rankingResults.map(async ranking => {
                    var rankingObject = new Object();
                    try {
                        const userResults = await db.collection('Users').find({ _id: ranking.user }).toArray();
                        if (albumResults.length > 0) {
                            rankingObject.username = userResults[0].username;
                            rankingObject.rankValue = ranking.rankValue;
                            rankingObject.notes = ranking.notes;
                            rankingObject.createdAt = ranking.createdAt;
                            console.log('ALBUM RESULTS:', rankingObject);
                            return rankingObject;
                        } else {
                            ret = { error: "No users found to reviewed this album" + ranking.album };
                            return error;
                        }
                    }
                    catch (error) {
                        console.error("Error finding users: ", error);
                        return error;
                    }
                }));
            } else {
                rankings = [];
                averageRanking = 0;
            }


            ret = { id: id, title: albumTitle, artist: artist, releaseDate: releaseDate, genre: genre, coverArtUrl: coverArtUrl, averageRanking: averageRanking, rankings: rankings }

        } else {
            ret = { error: "Album Not Found" };
        }

        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) => {
        // incoming: userId, search
        // outgoing: results[], error
        var error = '';
        const { userId, search, jwtToken } = req.body;
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }
        var _search = search.trim();
        const db = client.db();
        const results = await db.collection('Cards').find({
            "Card": {
                $regex: _search + '.*',
                $options: 'i'
            }
        }).toArray();
        var _ret = [];
        for (var i = 0; i < results.length; i++) {
            _ret.push(results[i].Card);
        }
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }
        var ret = { results: _ret, error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    //search for albums
    app.post('/api/searchAlbums', async (req, res, next) => {
        try {

            console.log("Request body:", req.body);
            const db = client.db('recrd'); // Use the actual DB name
            const searchTerm = req.body.title;
            console.log("Searching for:", searchTerm);
            //retrieve all matching song names
            // const results = await db.collection('Albums').find({ title: songName}).toArray();
            const results = await db.collection('Albums').find({
                $or: [
                    { "title": { $regex: searchTerm, $options: 'i' } },
                    { "artist": { $regex: searchTerm, $options: 'i' } }
                ]
            }).toArray();
            console.log("Results returned: ", results);
            var ret;
            if (results.length > 0) {
                // Calculate average ranking for each album
                const albumsWithRankings = await Promise.all(results.map(async (album) => {
                    const rankingResults = await db.collection('Rankings').find({ album: album._id }).toArray();
                    var averageRanking = 0;
                    var rankingCount = rankingResults.length;

                    if (rankingResults.length > 0) {
                        var totalRankingAmount = 0;
                        rankingResults.forEach(ranking => {
                            totalRankingAmount += ranking.rankValue;
                        });
                        averageRanking = totalRankingAmount / rankingResults.length;
                        console.log(`Album ${album.title}: ${rankingResults.length} rankings, average: ${averageRanking}`);
                    } else {
                        console.log(`Album ${album.title}: No rankings found`);
                    }

                    return {
                        ...album,
                        averageRanking: averageRanking,
                        rankingCount: rankingCount
                    };
                }));

                //return list of albums with average rankings
                return res.status(200).json(albumsWithRankings);
            }
            else {
                //No matching albums found
                ret = { error: "No matching albums found." };
                //status code 404 = client error
                return res.status(404).json(ret);
            }
        } catch (err) {
            console.error("API Error in /searchAlbums:", err);
            return res.status(500).json({ error: "An internal database error occurred." });
        }
    });

    //searching for users seperate from searching for albums, searched by username
    app.post('/api/searchUsers', async (req, res, next) => {
        try {
            const user = req.body.search;
            const db = client.db('recrd');
            // const results = await db.collection('Users').find({username:user}).toArray();
            const results = await db.collection('Users').find({
                "username": { $regex: user, $options: 'i' }
            }).toArray();
            var ret;
            if (results.length > 0) {
                //return list of users
                return res.status(200).json(results);
            }
            else {
                ret = { error: "No matching users found." }
                return res.status(400).json(ret);
            }
        } catch (err) {
            console.error("API Error in /searchUsers:", err);
            return res.status(500).json({ error: "An internal database error occurred." });
        }
    });

    // Get all recent rankings from all users, ordered from earliest to oldest
    app.get('/api/allRankings', async (req, res, next) => {
        // outgoing: array of rankings with username, rankValue, notes, createdAt, album info
        try {
            const db = client.db('recrd');

            // Get all rankings sorted by createdAt ascending (earliest first)
            const rankingResults = await db.collection('Rankings').find({}).sort({ createdAt: 1 }).toArray();

            console.log('Found rankings:', rankingResults.length);

            if (rankingResults.length === 0) {
                return res.status(200).json([]);
            }

            // Get user and album info for each ranking
            const rankings = await Promise.all(rankingResults.map(async ranking => {
                var rankingObject = new Object();
                try {
                    // Get user info
                    const userResults = await db.collection('Users').find({ _id: ranking.user }).toArray();
                    if (userResults.length === 0) {
                        return null;
                    }

                    // Get album info
                    const albumResults = await db.collection('Albums').find({ _id: ranking.album }).toArray();
                    if (albumResults.length === 0) {
                        return null;
                    }

                    rankingObject.username = userResults[0].username;
                    rankingObject.rankValue = ranking.rankValue;
                    rankingObject.notes = ranking.notes;
                    rankingObject.createdAt = ranking.createdAt;
                    rankingObject.album = {
                        title: albumResults[0].title,
                        artist: albumResults[0].artist,
                        coverArtUrl: albumResults[0].coverArtUrl
                    };

                    return rankingObject;
                } catch (error) {
                    console.error("Error processing ranking:", error);
                    return null;
                }
            }));

            // Filter out any null results
            const validRankings = rankings.filter(r => r !== null);

            return res.status(200).json(validRankings);
        } catch (err) {
            console.error("API Error in /allRankings:", err);
            return res.status(500).json({ error: "An internal database error occurred." });
        }
    });

    //used to display logged in users profile page
    app.get('/api/users/profile', async (req, res, next) => {
        // incoming:JWT in header
        // outgoing:userId, username, email, toListen, topThree, follower/following counts, 
        // albums, number of rankings and refreshed JWT
        // albums = {title, artist, coverArtUrl, ranking, notes, createdAt} 
        const jwtToken = req.headers.authorization?.split(' ')[1];
        const token = require("./createJWT.js");

        try {
            if (!jwtToken || token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'The JWT is no longer valid' });
            }
        } catch (e) {
            console.log(e.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        //decode JWT to get user ID
        const decodedToken = jwt.decode(jwtToken);
        const userId = new ObjectId(String(decodedToken.id));

        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ _id: userId }).toArray();

            if (userResults.length === 0) {
                return res.status(404).json({ error: "User Not Found" });
            }

            //get all relevant user data. NOTE: see separate api for interacting with followers/following
            const user = userResults[0];
            const toListen = user.toListen;
            const topThree = user.top3;
            const followerCount = user.followers.length;
            const followingCount = user.following.length;

            //get user's rankings
            const rankingResults = await db.collection('Rankings').find({ user: userId }).toArray();
            const numRankings = rankingResults.length;

            //get album info for each ranking
            //albums is array of what is returned for each ranking document within ranking results
            const albums = await Promise.all(rankingResults.map(async ranking => {
                try {
                    const albumResults = await db.collection('Albums').find({ _id: ranking.album }).toArray();
                    if (albumResults.length > 0) {
                        return {
                            title: albumResults[0].title,
                            artist: albumResults[0].artist,
                            coverArtUrl: albumResults[0].coverArtUrl,
                            rankValue: ranking.rankValue,
                            notes: ranking.notes,
                            createdAt: ranking.createdAt
                        };
                    }
                } catch (error) {
                    console.error("Error finding album: ", error);
                    return null;
                }
            }));

            // Filter out any null values from failed album lookups
            const validAlbums = albums.filter(album => album !== null);

            // Refresh token so user isnt logged out
            let refreshedToken = null;
            try {
                refreshedToken = token.refresh(jwtToken);
            } catch (e) {
                console.log(e.message);
            }

            const ret = {
                id: userId,
                username: user.username,
                email: user.email,
                toListen: toListen,
                topThree: topThree,
                followerCount: followerCount,
                followingCount: followingCount,
                albums: validAlbums,
                numRankings: numRankings,
                jwtToken: refreshedToken
            };

            res.status(200).json(ret);

        } catch (error) {
            console.error("Error fetching profile:", error);
            res.status(500).json({ error: "An error occurred fetching the profile" });
        }
    });

    //endpoint to see specific followers from user profile
    app.get('/api/users/profile/followers', async (req, res, next) => {
        //incoming:JWT in header
        //outgoing: followersList = {_id, username}
        const jwtToken = req.headers.authorization?.split(' ')[1];
        const token = require("./createJWT.js");

        try {
            if (!jwtToken || token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'The JWT is no longer valid' });
            }
        } catch (e) {
            console.log(e.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        //decode JWT to get user ID
        const decodedToken = jwt.decode(jwtToken);
        const userId = new ObjectId(String(decodedToken.id));
        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ _id: userId }).toArray();

            if (userResults.length === 0) {
                return res.status(404).json({ error: "User Not Found" });
            }

            const user = userResults[0];
            const followerIds = user.followers;
            //look up each follower's user info
            const followers = await db.collection('Users').find({
                _id: { $in: followerIds }  //find all users whose _id is in the followerIds array
            }).toArray();

            //returns id and username
            const followersList = followers.map(follower => ({
                _id: follower._id,
                username: follower.username
            }));
            res.status(200).json(followersList);
        }
        catch (e) {
            console.error("Error fetching profile:", e);
            res.status(500).json({ error: "An error occurred fetching the profile" });
        }
    });

    //endpoint to see specific following from user profile
    app.get('/api/users/profile/following', async (req, res, next) => {
        //incoming:JWT in header
        //outgoing: followingList = {_id, username}
        const jwtToken = req.headers.authorization?.split(' ')[1];
        const token = require("./createJWT.js");

        try {
            if (!jwtToken || token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'The JWT is no longer valid' });
            }
        } catch (e) {
            console.log(e.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        //decode JWT to get user ID
        const decodedToken = jwt.decode(jwtToken);
        const userId = new ObjectId(String(decodedToken.id));
        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ _id: userId }).toArray();

            if (userResults.length === 0) {
                return res.status(404).json({ error: "User Not Found" });
            }

            const user = userResults[0];
            const followingIds = user.following;
            //look up each following's user info
            const followings = await db.collection('Users').find({
                _id: { $in: followingIds }  //find all users whose _id is in the followingIds array
            }).toArray();

            //returns id and username
            const followingList = followings.map(following => ({
                _id: following._id,
                username: following.username
            }));
            res.status(200).json(followingList);
        }
        catch (e) {
            console.error("Error fetching profile:", e);
            res.status(500).json({ error: "An error occurred fetching the profile" });
        }
    });
}

