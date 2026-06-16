const passport=require('passport')
const bcrypt=require('bcrypt')

require('dotenv').config()
const User=require("../models/user")

const GoogleStratergy=require("passport-google-oauth20").Strategy
const LocalStratergy=require('passport-local').Strategy

const jwt=require('jsonwebtoken')

// Passport Stratergy for Local Users
passport.use(new LocalStratergy ({
            usernameField: "usergmail",
            passwordField: "password"
        },
     async (usergmail,password,done)=>{
        try{
            const user=await User.findOne({usergmail:usergmail})
            // If User is Not Present
            if (!user){
                return done(null,false,{message : "Gmail Not Found Try Signup First"})

            }
            // if password Matched
            const ismatch=await bcrypt.compare(password,user.password)

            if (!ismatch){
                return done(null,false,{
                    message:"Wrong Password"
                })
            }
            // Return profile of User
            return done(null,user)
        }
        catch(err){
            return done(err)
        }
     }
))
// PassPort Stratergy for google Users
passport.use(new GoogleStratergy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:process.env.CALLBACK_URL
},async (accessToken,refreshToken,profile,done)=>{
    console.log(`[BACKEND] Google OAuth callback processing for user: ${profile.displayName} (${profile.emails[0]?.value})`);
    try{
        console.log("profile request from Google",profile)
        let user=await User.findOne({googleId:profile.id})  //Check whether the user is already login using profile that  is returned from Google

        if (!user){
            console.log(`[BACKEND]  Google user not found in database. Creating new record for: ${profile.displayName}`);
            user=new User({
                usergmail:profile.emails[0].value,
                userName:profile.displayName,
                profilepic:profile.photos[0]?.value,
                provider:"Google",
                googleId:profile.id
            })
            await user.save()
            console.log(`[BACKEND]  New Google user record saved successfully: ${user.usergmail}`);
        } else {
            console.log(`[BACKEND] Google user matched database record: ${user.usergmail}`);
        }

        return done(null,user)
    }
    catch(err){
        console.error("[BACKEND] Error in Google Strategy callback:", err);
        return done(err)
    }
}
))
// Sign up function with local gmail and pass
const signup=async (req,res)=>{
    const gmail=req.body.username
    const pass=req.body.password
   
    const usernameFromEmail = gmail.split('@')[0];
    console.log(`[BACKEND] Action: Attempting signup for email: ${gmail}`);
    
    try{
         //Hasing Password salt 10 Rounds
         const hashedpass=await bcrypt.hash(pass,10)  
        const existinguser=await User.findOne({usergmail:gmail})  
        //If existing User return 400 bad request Error
        if (existinguser){
            console.warn(`[BACKEND] Signup failed: Email ${gmail} is already registered.`);
            return res.status(409).json({
                message:"Email is already Registered in Database"
            })

        }
        // New user creating Temporarly saving username after that giving ability to Modify IT
        const newuser=new User({
            usergmail:gmail,
            password:hashedpass,
            provider:"Local",
            userName:usernameFromEmail

        })
            // Saving User
            await newuser.save()
            console.log(`[BACKEND] Signup success: Created user ${usernameFromEmail} (${gmail})`);
            return res.status(201).json({
                message:"User Created Successfully",
                name:usernameFromEmail
            })
    }
    catch(err){
        console.error("[BACKEND] ❌ Unable to write new user to Database:", err);
        return res.status(500).json({
            message:"Internal server database Error"
        })
    }      
}
const generateTokensAndSetCookie = async (user, res) => {
    console.log(`[BACKEND] 🔑 Action: Generating Access (15m) & Refresh (7d) tokens for user: ${user.userName} (ID: ${user._id})`);
    const accessToken = jwt.sign(
        {
            id: user._id,
            name: user.userName,
            provider: user.provider
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '15m'
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user._id,
            name: user.userName,
            provider: user.provider
        },
        process.env.JWT_REFRESH || 'mySuperRefreshSecretKey',
        {
            expiresIn: '7d'
        }
    );

    // Save refresh token to user model
    user.refreshToken = refreshToken;
    await user.save();
    console.log(`[BACKEND] Saved refresh token to database for user: ${user.userName}`);

    // Set HTTP-only secure cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    console.log(`[BACKEND] Set secure httpOnly cookie 'refreshToken' for user: ${user.userName}`);

    return accessToken;
};

// Login using Local Gmail and Password
const login = (req, res, next) => {
    console.log(`[BACKEND] 🔑 Action: Attempting local authentication for email: ${req.body.usergmail}`);
    passport.authenticate(
        "local",
        async (err, user, info) => {

            if (err) {
                console.error(`[BACKEND] ❌ Login passport authentication error: ${err.message}`);
                return next(err);
            }

            if (!user) {
                console.warn(`[BACKEND] ⚠️ Login authentication failed for email: ${req.body.usergmail}. Reason: ${info.message}`);
                return res.status(401).json({
                    message: info.message
                });
            }

            try {
                console.log(`[BACKEND] ✅ Login authentication success for user: ${user.userName} (${user.usergmail})`);
                const token = await generateTokensAndSetCookie(user, res);
                return res.status(200).json({
                    token,
                    user
                });
            } catch (error) {
                console.error("[BACKEND] ❌ Login token generation error:", error);
                return res.status(500).json({ message: "Internal server error during login" });
            }
        }
    )(req, res, next);
};




const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        console.warn("[BACKEND] Token refresh failed: Refresh token cookie is missing!");
        return res.status(401).json({ message: "Refresh Token Missing" });
    }

    try {
        console.log("[BACKEND] 🔄 Action: Verifying refresh token...");
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH);
        console.log(`[BACKEND] Refresh token verified for User ID: ${decoded.id}, Name: ${decoded.name}`);

        const user = await User.findOne({ _id: decoded.id, refreshToken: refreshToken });
        if (!user) {
            console.warn("[BACKEND] Token refresh failed: Refresh token does not match database record!");
            return res.status(403).json({ message: "Invalid Refresh Token" });
        }

        console.log("[BACKEND] Refresh token matched database. Generating new access token...");
        const newAccessToken = jwt.sign(
            {
                id: user._id,
                name: user.userName,
                provider: user.provider
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '15m'
            }
        );

        console.log(`[BACKEND] Token refresh success: Generated new access token for user: ${user.userName}`);
        return res.status(200).json({
            token: newAccessToken,
            user
        });
    } catch (e) {
        console.error("[BACKEND] Token refresh verification failed:", e.message);
        return res.status(403).json({ message: "Invalid or Expired Refresh Token" });
    }
};

const logout = async (req, res) => {
    // Getting Accesstoken from cookies
    const refreshToken = req.cookies.refreshToken;
    console.log("[BACKEND] Action: Logging out user session...");
    if (refreshToken) {
        try {

            const decoded = jwt.decode(refreshToken);
            if (decoded && decoded.id) {
                console.log(`[BACKEND] Clearing refresh token from DB for User ID: ${decoded.id}`);
                // Revoking the decoded id refresh token from database
                await User.findOneAndUpdate({ _id: decoded.id }, { refreshToken: null });
            }
        } catch (e) {
            console.error("[BACKEND] Error clearing refresh token from DB during logout:", e);
        }
    }
    console.log("[BACKEND] Action: Clearing 'refreshToken' HTTP-only cookie");
    // Clearing the Cookie 
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    console.log("[BACKEND] Logout complete");
    return res.status(200).json({ message: "Logged out successfully" });
};

module.exports={signup,login,refresh,logout,generateTokensAndSetCookie}
