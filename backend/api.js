require('express');
const { ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

//Install these in the backend folder if you dont have them
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail')

// Check if SendGrid API key is configured
/*istanbul ignore next*/
if (!process.env.SENDGRID_EMAIL_API_KEY) {
    console.error('WARNING: SENDGRID_EMAIL_API_KEY is not set in environment variables!');
    console.error('Please create a .env file in the backend folder with: SENDGRID_EMAIL_API_KEY=your_api_key_here');
} else {
    sgMail.setApiKey(process.env.SENDGRID_EMAIL_API_KEY);
}

const bcrypt = require('bcrypt');

//Used for Hashing
const saltRounds = 10;
//30 Minutes to milliseconds
const otpExpirationTime = 30 * 60000;
const passwordExpirationTime = 10 * 60000;

//Used for password link in email, change to domain name / ip when on server
const app_name = 'ntw234.xyz'
//const app_name = '45.55.136.167'

exports.setApp = function (app, client) {
    /*istanbul ignore next*/
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
            const refreshResult = token.refresh(jwtToken);
            if (refreshResult && refreshResult.accessToken) {
                refreshedToken = refreshResult.accessToken;
            } else if (refreshResult && refreshResult.error) {
                console.error('Token refresh error:', refreshResult.error);
            }
        }
        catch (e) {
            console.log('Token refresh exception:', e.message);
        }
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    /*istanbul ignore next*/
    app.post('/api/unfollowUser', async (req, res, next) => {
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
            await db.collection('Users').findOneAndUpdate({ _id: objectDecodedId }, { $pull: { following: objectUserId } });
            await db.collection('Users').findOneAndUpdate({ _id: objectUserId }, { $pull: { followers: objectDecodedId } });
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

    /*istanbul ignore next line*/
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

    /*istanbul ignore next*/
    app.post('/api/addTopThree', async (req, res, next) => {
        // incoming: albumId, JWT
        // outgoing: { error: string, jwtToken: string }

        const { albumId, jwtToken } = req.body;
        const token = require("./createJWT.js");

        var error = '';
        var refreshedToken = null;
        var operationSuccess = false;

        try {
            if (!jwtToken || token.isExpired(jwtToken)) {
                error = 'The JWT is no longer valid';
            } else {
                const decodedToken = jwt.decode(jwtToken);
                if (!decodedToken || !decodedToken.id) {
                    error = 'Invalid token: missing user ID';
                } else {
                    var objectDecodedId = new ObjectId(String(decodedToken.id));
                    var objectAlbumId = new ObjectId(String(albumId));

                    const db = client.db('recrd');

                    // Check if user exists
                    console.log('Looking for user with ID:', objectDecodedId);
                    const user = await db.collection('Users').findOne({ _id: objectDecodedId });
                    console.log('User found:', user ? 'Yes' : 'No');
                    if (!user) {
                        error = 'User not found';
                        console.error('User not found for ID:', objectDecodedId, 'Decoded token ID:', decodedToken.id);
                    } else {
                        // Check if top3 already has 3 items, if so, don't add more
                        if (user.top3 && user.top3.length >= 3) {
                            error = 'Top 3 is already full. Please remove an album first.';
                        } else if (user.top3 && user.top3.some(id => String(id) === String(objectAlbumId))) {
                            // Check if album is already in top3
                            error = 'Album is already in your top 3';
                        } else {
                            // Add album to top3
                            // Use $set with the full array to avoid validation issues
                            const currentTop3 = user.top3 || [];
                            const newTop3 = [...currentTop3, objectAlbumId];

                            // Ensure we don't exceed 3 items
                            const finalTop3 = newTop3.slice(0, 3);

                            try {
                                await db.collection('Users').findOneAndUpdate(
                                    { _id: objectDecodedId },
                                    { $set: { top3: finalTop3 } }
                                );
                                // Mark operation as successful
                                operationSuccess = true;
                            } catch (validationError) {
                                // If validation fails, try to get more details
                                console.error('Validation error details:', JSON.stringify(validationError.errInfo, null, 2));
                                // Try bypassing validation as fallback (not ideal but might be necessary)
                                try {
                                    await db.collection('Users').findOneAndUpdate(
                                        { _id: objectDecodedId },
                                        { $set: { top3: finalTop3 } },
                                        { bypassDocumentValidation: true }
                                    );
                                    // Mark operation as successful
                                    operationSuccess = true;
                                } catch (bypassError) {
                                    error = 'Failed to update top 3: ' + validationError.toString();
                                    throw validationError; // Throw original error if bypass also fails
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error in addTopThree:', e);
            // Only set error if operation didn't succeed
            if (!operationSuccess) {
                error = e.toString();
            }
        }

        // If operation succeeded, clear any error that might have been set
        if (operationSuccess) {
            error = '';
        }

        // Try to refresh token - always try if we have a token, even if there was an error
        try {
            if (jwtToken) {
                const refreshResult = token.refresh(jwtToken);
                // refresh() returns { accessToken: "..." } or { error: "..." }
                if (refreshResult && refreshResult.accessToken) {
                    refreshedToken = refreshResult.accessToken;
                } else if (refreshResult && refreshResult.error) {
                    console.error('Token refresh error:', refreshResult.error);
                    // Only set error if operation didn't succeed and token refresh failed
                    if (!operationSuccess && !error) {
                        error = 'Token refresh failed: ' + refreshResult.error;
                    }
                }
            }
        } catch (e) {
            console.log('Token refresh exception:', e.message);
            // Only set error if operation didn't succeed
            if (!operationSuccess && !error) {
                error = 'Token refresh exception: ' + e.message;
            }
        }

        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    //still needs to be implemented
    /*istanbul ignore next*/
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

    /*istanbul ignore next*/
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

    /*istanbul ignore next*/
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
                //passwords match
                if (passwordMatch) {
                    //final check - is user verified?
                    if (results[0].isVerified === false){
                        return res.status(200).json({error: "You must verify your account before logging in."})
                    }
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

    /*istanbul ignore next*/
    app.post('/api/register', async (req, res, next) => {
        // incoming: username, email, password
        // outgoing: error

        const { username, email, password } = req.body;

        //validation checks if username or email already exists
        try {
            const db = client.db('recrd');
            
            //check if username already exists
            const existingUsername = await db.collection('Users').findOne({ username: username });
            if (existingUsername) {
                return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
            }

            //check if email already exists
            const existingEmail = await db.collection('Users').findOne({ email: email });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already registered. Please use a different email or log in.' });
            }

        } catch (e) {
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }
        //Hash the password to be put in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //Create 6 Digit OTP and then hash it for the database
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedOtp = await bcrypt.hash(otp, saltRounds);

        try {
            error = await sendVerificationEmail(email, otp);
        }
        catch (e) {
            res.status(200).json(error, e);
        }

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
        /*istanbul ignore next*/
        const sendVerificationEmail = async (email, otp, req) => {
        // Check if API key is configured
        if (!process.env.SENDGRID_EMAIL_API_KEY) {
            const errorMsg = 'SendGrid API key is not configured. Please set SENDGRID_EMAIL_API_KEY in your .env file.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const msg = {
            to: email,
            from: 'recrd@hamsterrunner.com',
            subject: 'Verifiy Your RECRD Account',
            text: "Your verification code is: " + otp + "."
                + "\nYour code will expire in " + otpExpirationTime / 60000 + " minutes.", // plain‑text body
        }
        try {
            await sgMail.send(msg);
            console.log('Email sent successfully to:', email);
        } catch (error) {
            console.error('Error sending email:', error);
            // Provide more helpful error messages
            if (error.response && error.response.body && error.response.body.errors) {
                const sendgridErrors = error.response.body.errors;
                console.error('SendGrid errors:', JSON.stringify(sendgridErrors, null, 2));
            }
            throw error; // Re-throw so calling code can handle it
        }
    };

    /*istanbul ignore next*/
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

    /*istanbul ignore next*/
    app.post('/api/resendVerification', async (req, res, next) => {
        // incoming: username
        // outgoing: error
        const { username } = req.body;
        const db = client.db('recrd');
        const results = await db.collection('Users').find({ username: username }).toArray();
        var ret = { error: '' };

        if (results.length > 0) {
            // Check if user is already verified
            if (results[0].isVerified === true) {
                ret = { error: 'User is already verified' };
            } else {
                // Generate new OTP
                const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
                const hashedOtp = await bcrypt.hash(otp, saltRounds);
                const email = results[0].email;

                // Update OTP in database - use updateOne to ensure update happens
                try {
                    const updateResult = await db.collection('Users').updateOne(
                        { username: username },
                        {
                            $set: {
                                otp: String(hashedOtp),
                                otpCreatedAt: Date.now(),
                                otpExpiresAt: Date.now() + otpExpirationTime
                            }
                        }
                    );

                    console.log(`OTP update result for ${username}:`, {
                        matchedCount: updateResult.matchedCount,
                        modifiedCount: updateResult.modifiedCount,
                        otpGenerated: otp
                    });

                    // Verify the update actually happened
                    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
                        console.error(`Failed to update OTP for user ${username}`);
                        ret = { error: 'Failed to update OTP in database' };
                    } else {
                        // Send verification email only after database update is confirmed
                        console.log(`Sending verification email to ${email} with OTP: ${otp}`);
                        try {
                            await sendVerificationEmail(email, otp);
                            console.log(`Verification email sent successfully to ${email}`);
                            ret = { error: '' }; // Success
                        } catch (e) {
                            console.error(`Failed to send verification email to ${email}:`, e);
                            ret = { error: 'Failed to send verification email' };
                        }
                    }
                } catch (e) {
                    console.error(`Error updating OTP for ${username}:`, e);
                    ret = { error: e.message };
                }
            }
        } else {
            ret = { error: 'User not found' };
        }
        res.status(200).json(ret);
    });

    /*istanbul ignore next*/
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

            try {
                error = await sendPasswordResetEmail(email, resetToken, req);
                res.status(200).json(error, e);
            }
            catch (e) {
                res.status(200).json(error, e);
            }
            

        }
        else {
            ret = { error: "User does not exist with that email" };
        }

        res.status(200).json(ret);
    });

    /*istanbul ignore next*/
    const sendPasswordResetEmail = async (email, resetToken, req) => {
        const msg = {
            to: email,
            from: 'recrd@hamsterrunner.com',
            subject: 'Reset Your RECRD Password',
            text: `Your password reset link is: http://${app_name}/reset-password/${resetToken}`
                + "\nYour link will expire in " + passwordExpirationTime / 60000 + " minutes.", // plain‑text body
        }
        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
                return 'Email sent';
            })
            .catch((error) => {
                console.error(error)
                return error;
            })
    };

    /*istanbul ignore next*/
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
        // incoming: username in URL
        // outgoing: id, username, email, toListen, topThree, followerCount, followingCount, albums, numRankings
        // albums = {title, artist, coverArtUrl, rankValue, notes, createdAt}
        // topThree = [{_id, title, artist, coverArtUrl}]

        const username = req.params.username;

        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ username: username }).toArray();

            if (userResults.length === 0) {
                return res.status(404).json({ error: "User Not Found" });
            }

            const user = userResults[0];
            const userId = user._id;
            const toListen = user.toListen;
            const topThree = user.top3;
            const followerCount = user.followers.length;
            const followingCount = user.following.length;

            // Get user's rankings
            const rankingResults = await db.collection('Rankings').find({ user: userId }).toArray();
            const numRankings = rankingResults.length;

            // Get album info for each ranking
            const albums = await Promise.all(rankingResults.map(async ranking => {
                try {
                    const albumResults = await db.collection('Albums').find({ _id: ranking.album }).toArray();
                    /*istanbul ignore next*/
                    if (albumResults.length > 0) {
                        return {
                            _id: ranking.album,
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

            // Get album details for top3
            const topThreeAlbums = [];
            if (topThree && topThree.length > 0) {
                for (const albumId of topThree) {
                    try {
                        const albumResults = await db.collection('Albums').find({ _id: albumId }).toArray();
                        /*istanbul ignore next*/
                        if (albumResults.length > 0) {
                            topThreeAlbums.push({
                                _id: albumId,
                                title: albumResults[0].title,
                                artist: albumResults[0].artist,
                                coverArtUrl: albumResults[0].coverArtUrl
                            });
                        }
                    } catch (error) {
                        console.error("Error finding top3 album: ", error);
                    }
                }
            }

            const ret = {
                id: userId,
                username: user.username,
                email: user.email,
                toListen: toListen,
                topThree: topThreeAlbums,
                followerCount: followerCount,
                followingCount: followingCount,
                albums: validAlbums,
                numRankings: numRankings
            };

            res.status(200).json(ret);

        } catch (error) {
            console.error("Error fetching user profile:", error);
            res.status(500).json({ error: "An error occurred fetching the profile" });
        }
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

    app.get('/api/albums/:id', async (req, res, next) => {
        // incoming: album ID
        // outgoing: id, artist, releaseDate, genre, coverArtUrl, averageRanking, rankings
        // rankings = { username, rankvalue, notes, createdAt }

        const albumId = req.params.id;

        console.log('Searching for album with ID:', albumId);
        const db = client.db('recrd'); // Use the actual DB name

        try {
            // Convert string ID to ObjectId
            const objectId = new ObjectId(albumId);
            const albumResults = await db.collection('Albums').find({ _id: objectId }).toArray();
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

                /*istanbul ignore next*/
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
        } catch (err) {
            console.error("API Error in /albums/:id:", err);
            res.status(400).json({ error: "Invalid album ID" });
        }
    });

    //search for albums
    app.post('/api/searchAlbums', async (req, res, next) => {
        try {

            console.log("Request body:", req.body);
            const db = client.db('recrd'); // Use the actual DB name
            const searchTerm = req.body.title;
            const limit = req.body.limit || 50; // Default to 50, can be overridden
            const skip = req.body.skip || 0; // Default to 0, can be overridden
            console.log("Searching for:", searchTerm, "limit:", limit, "skip:", skip);

            // Build the query
            const query = {
                $or: [
                    { "title": { $regex: searchTerm, $options: 'i' } },
                    { "artist": { $regex: searchTerm, $options: 'i' } }
                ]
            };

            // Get total count for pagination info
            const totalCount = await db.collection('Albums').countDocuments(query);

            // Retrieve only the albums we need (with pagination)
            const results = await db.collection('Albums')
                .find(query)
                .skip(skip)
                .limit(limit)
                .toArray();

            console.log("Results returned: ", results.length, "out of", totalCount);
            var ret;
            if (results.length > 0) {
                //calculate average ranking for each album
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

                //return list of albums with average rankings, plus pagination info
                return res.status(200).json({
                    albums: albumsWithRankings,
                    totalCount: totalCount,
                    hasMore: (skip + limit) < totalCount
                });
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

    // Leaderboard: Get users with most rankings using aggregation
    app.get('/api/leaderboard/users', async (req, res, next) => {
        try {
            const db = client.db('recrd');
            const limit = parseInt(req.query.limit) || 50;
            const skip = parseInt(req.query.skip) || 0;

            // Use aggregation pipeline to efficiently get users with most rankings
            const pipeline = [
                // Stage 1: Group rankings by user and calculate stats
                {
                    $group: {
                        _id: '$user',
                        rankingCount: { $sum: 1 },
                        averageRanking: { $avg: '$rankValue' }
                    }
                },
                // Stage 2: Sort by ranking count (descending)
                {
                    $sort: { rankingCount: -1 }
                },
                // Stage 3: Skip and limit for pagination
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                // Stage 4: Lookup user details from Users collection
                {
                    $lookup: {
                        from: 'Users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                },
                // Stage 5: Unwind user details (since lookup returns array)
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: false
                    }
                },
                // Stage 6: Reshape the output
                {
                    $project: {
                        _id: '$userDetails._id',
                        username: '$userDetails.username',
                        rankingCount: 1,
                        averageRanking: { $round: ['$averageRanking', 2] }
                    }
                }
            ];

            // Get total count of users with rankings
            const totalCountPipeline = [
                {
                    $group: {
                        _id: '$user',
                        rankingCount: { $sum: 1 }
                    }
                },
                {
                    $count: 'total'
                }
            ];

            const [results, totalCountResult] = await Promise.all([
                db.collection('Rankings').aggregate(pipeline).toArray(),
                db.collection('Rankings').aggregate(totalCountPipeline).toArray()
            ]);

            const totalCount = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

            return res.status(200).json({
                users: results,
                totalCount: totalCount,
                hasMore: (skip + limit) < totalCount
            });

        } catch (err) {
            console.error("API Error in /leaderboard/users:", err);
            return res.status(500).json({ error: "An internal database error occurred." });
        }
    });

    // Leaderboard: Get albums with most rankings using aggregation
    app.get('/api/leaderboard', async (req, res, next) => {
        try {
            const db = client.db('recrd');
            const limit = parseInt(req.query.limit) || 50;
            const skip = parseInt(req.query.skip) || 0;

            // Use aggregation pipeline to efficiently get most ranked albums
            const pipeline = [
                // Stage 1: Group rankings by album and calculate stats
                {
                    $group: {
                        _id: '$album',
                        rankingCount: { $sum: 1 },
                        averageRanking: { $avg: '$rankValue' }
                    }
                },
                // Stage 2: Sort by ranking count (descending), then by average ranking (descending) as tiebreaker
                {
                    $sort: { 
                        rankingCount: -1,
                        averageRanking: -1 
                    }
                },
                // Stage 3: Skip and limit for pagination
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                // Stage 4: Lookup album details from Albums collection
                {
                    $lookup: {
                        from: 'Albums',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'albumDetails'
                    }
                },
                // Stage 5: Unwind album details (since lookup returns array)
                {
                    $unwind: {
                        path: '$albumDetails',
                        preserveNullAndEmptyArrays: false
                    }
                },
                // Stage 6: Reshape the output
                {
                    $project: {
                        _id: '$albumDetails._id',
                        title: '$albumDetails.title',
                        artist: '$albumDetails.artist',
                        coverArtUrl: '$albumDetails.coverArtUrl',
                        releaseDate: '$albumDetails.releaseDate',
                        genre: '$albumDetails.genre',
                        rankingCount: 1,
                        averageRanking: { $round: ['$averageRanking', 2] }
                    }
                }
            ];

            // Get total count of albums with rankings
            const totalCountPipeline = [
                {
                    $group: {
                        _id: '$album',
                        rankingCount: { $sum: 1 }
                    }
                },
                {
                    $count: 'total'
                }
            ];

            const [results, totalCountResult] = await Promise.all([
                db.collection('Rankings').aggregate(pipeline).toArray(),
                db.collection('Rankings').aggregate(totalCountPipeline).toArray()
            ]);

            const totalCount = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

            return res.status(200).json({
                albums: results,
                totalCount: totalCount,
                hasMore: (skip + limit) < totalCount
            });

        } catch (err) {
            console.error("API Error in /leaderboard:", err);
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
            const limit = parseInt(req.query.limit) || 15;
            const skip = parseInt(req.query.skip) || 0;

            // Get rankings sorted by createdAt descending (newest first) with pagination
            const rankingResults = await db.collection('Rankings')
                .find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            console.log('Found rankings:', rankingResults.length, 'limit:', limit, 'skip:', skip);

            if (rankingResults.length === 0) {
                return res.status(200).json({
                    rankings: [],
                    hasMore: false
                });
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
                        _id: albumResults[0]._id,
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

            // Check if there are more rankings
            const totalCount = await db.collection('Rankings').countDocuments({});
            const hasMore = (skip + limit) < totalCount;

            return res.status(200).json({
                rankings: validRankings,
                hasMore: hasMore
            });
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
        /*istanbul ignore next*/
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
        console.log('Decoded token:', decodedToken);

        /*istanbul ignore next*/
        if (!decodedToken || !decodedToken.id) {
            return res.status(401).json({ error: 'Invalid token: missing user ID' });
        }

        const userId = new ObjectId(String(decodedToken.id));
        console.log('Looking for user with ID:', userId);
        /*istanbul ignore next*/
        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ _id: userId }).toArray();
            console.log('User results count:', userResults.length);

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
                            _id: ranking.album,
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

            // Get album details for top3
            const topThreeAlbums = [];
            if (topThree && topThree.length > 0) {
                for (const albumId of topThree) {
                    try {
                        const albumResults = await db.collection('Albums').find({ _id: albumId }).toArray();
                        if (albumResults.length > 0) {
                            topThreeAlbums.push({
                                _id: albumId,
                                title: albumResults[0].title,
                                artist: albumResults[0].artist,
                                coverArtUrl: albumResults[0].coverArtUrl
                            });
                        }
                    } catch (error) {
                        console.error("Error finding top3 album: ", error);
                    }
                }
            }

            // Refresh token so user isnt logged out
            let refreshedToken = null;
            try {
                const refreshResult = token.refresh(jwtToken);
                if (refreshResult && refreshResult.accessToken) {
                    refreshedToken = refreshResult.accessToken;
                } else if (refreshResult && refreshResult.error) {
                    console.error('Token refresh error:', refreshResult.error);
                }
            } catch (e) {
                console.log('Token refresh exception:', e.message);
            }

            const ret = {
                id: userId,
                username: user.username,
                email: user.email,
                toListen: toListen,
                topThree: topThreeAlbums,
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
        /*istanbul ignore next*/
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
        /*istanbul ignore next*/
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

    //endpoint to see specific followers from a user by username
    app.get('/api/users/:username/followers', async (req, res, next) => {
        //incoming: username in URL
        //outgoing: followersList = {_id, username}
        const username = req.params.username;

        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ username: username }).toArray();

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
            console.error("Error fetching followers:", e);
            res.status(500).json({ error: "An error occurred fetching the followers" });
        }
    });

    //endpoint to see specific following from a user by username
    app.get('/api/users/:username/following', async (req, res, next) => {
        //incoming: username in URL
        //outgoing: followingList = {_id, username}
        const username = req.params.username;

        try {
            const db = client.db('recrd');
            const userResults = await db.collection('Users').find({ username: username }).toArray();

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
            console.error("Error fetching following:", e);
            res.status(500).json({ error: "An error occurred fetching the following" });
        }
    });

    //endpoint to update user's top3 albums
    /*istanbul ignore next*/
    app.patch('/api/users/profile/top3', async (req, res, next) => {
        //incoming: JWT in header, top3 array (album IDs) in body
        //outgoing: error, jwtToken
        const jwtToken = req.headers.authorization?.split(' ')[1];
        const token = require("./createJWT.js");
        const { top3 } = req.body;

        try {
            if (!jwtToken || token.isExpired(jwtToken)) {
                return res.status(401).json({ error: 'The JWT is no longer valid' });
            }
        } catch (e) {
            console.log(e.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        var error = '';
        const decodedToken = jwt.decode(jwtToken);
        const userId = new ObjectId(String(decodedToken.id));

        try {
            const db = client.db('recrd');

            // Validate top3 array (should be max 3 items, all valid ObjectIds)
            if (!Array.isArray(top3) || top3.length > 3) {
                error = 'top3 must be an array with maximum 3 items';
            } else {
                // Convert all to ObjectIds to validate
                const validTop3 = top3.filter(id => id !== null && id !== undefined).map(id => new ObjectId(String(id)));

                await db.collection('Users').findOneAndUpdate(
                    { _id: userId },
                    { $set: { top3: validTop3 } }
                );
            }
        } catch (e) {
            error = e.toString();
        }

        var refreshedToken = null;
        try {
            const refreshResult = token.refresh(jwtToken);
            // refresh() returns { accessToken: "..." } or { error: "..." }
            if (refreshResult && refreshResult.accessToken) {
                refreshedToken = refreshResult.accessToken;
            } else if (refreshResult && refreshResult.error) {
                console.error('Token refresh error:', refreshResult.error);
            }
        } catch (e) {
            console.log('Token refresh exception:', e.message);
        }

        const ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });
}

module.exports = exports;

