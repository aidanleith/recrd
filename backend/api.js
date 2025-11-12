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
            db.collection('Users').findOneAndUpdate({ _id: objectDecodedId }, { $push: { following: objectUserId } });
            db.collection('Users').findOneAndUpdate({ _id: objectUserId }, { $push: { followers: objectDecodedId } });
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
        const db = client.db('recrd'); // Use the actual DB name
        const results = await db.collection('Users').find({ username: username }).toArray();
        console.log('DB QUERY RESULTS:', results);
        var id = -1;
        var email = '';
        var ret;
        if (results.length > 0) {
            //Check if password matches the hashed one
            const hashedPassword = results[0].password;
            if (await bcrypt.compare(password, hashedPassword)) {
                id = results[0]._id;
                email = results[0].email;
                try {
                    const token = require("./createJWT.js");
                    ret = token.createToken(email, id);
                }
                catch (e) {
                    ret = { error: e.message };
                }
            }
            else {
                //Incorrect Password
                ret = { error: "Username or Password incorrect" };
            }
        }
        else {
            //User not found
            ret = { error: "Username or Password incorrect" };
        }
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
                        db.collection('Users').findOneAndUpdate({ username: username }, { $set: { isVerified: true }, $unset: { otp: "", otpCreatedAt: "", otpExpiresAt: "" } });
                    }
                    catch (e) {
                        ret = { error: e.message };
                    }

                    //Create the JWT
                    id = results[0]._id;
                    email = results[0].email;
                    try {
                        const token = require("./createJWT.js");
                        ret = token.createToken(email, id);
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
                db.collection('Users').findOneAndUpdate({ email: email }, { $set: { passwordResetToken: hashedResetToken, passwordResetTokenExpires: resetTokenExpiration } });
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
                    db.collection('Users').findOneAndUpdate({ passwordResetToken: hashedToken },
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
                    ret = token.createToken(email, id);
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

    app.get('/api/albums/:title', async (req, res, next) => {
        // incoming: 
        // outgoing: id, artist, releaseDate, genre, coverArtUrl, averageRanking, rankings
        // rankings = { username, rankvalue, notes, createdAt }

        // Might want to use ID instead of name because of special characters
        // Would have to change search albums api as well
        const title = req.params.title.replace(/-/g, ' ');

        console.log('LOGIN ATTEMPT BODY:', req.body);
        const db = client.db('recrd'); // Use the actual DB name
        const albumResults = await db.collection('Albums').find({ title: title }).toArray();
        console.log('DB QUERY RESULTS:', albumResults);
        var error = '';
        var ret;
        var id = -1;
        var artist, genre, coverArtUrl;
        var releaseDate;
        var averageRanking;
        if (albumResults.length > 0) {
            id = albumResults[0]._id;
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


            ret = { id: id, artist: artist, releaseDate: releaseDate, genre: genre, coverArtUrl: coverArtUrl, averageRanking: averageRanking, rankings: rankings }

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
                //return list of albums
                return res.status(200).json(results);
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
}

