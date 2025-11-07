require('express');
require('mongodb');
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
                         { $set: { password: hashedPassword}, $unset: { passwordResetToken: "", passwordResetTokenExpires: ""} });
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

