const express=require("express")
const passport=require('passport')
const LocalStratergy=require('passport-local').Strategy
const bcrypt=require('bcrypt')
const User=require("../models/user")
const GoogleStratergy=require("passport-google-oauth20").Strategy
require('dotenv').config()
const jwt=require('jsonwebtoken')
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

passport.use(new GoogleStratergy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:process.env.CALLBACK_URL
},async (accessToken,refreshToken,profile,done)=>{
    console.log("Access Token:",accessToken)
    console.log("Refresh Token:",refreshToken)
    console.log(profile)
    try{
        let user=await User.findOne({googleId:profile.id})

        if (!user){
            user=new User({
                usergmail:profile.emails[0].value,
                userName:profile.displayName,
                profilepic:profile.photos[0]?.value,
                provider:"Google",
                googleId:profile.id
            })
        await user.save()
        }

        return done(null,user)
    }
    catch(err){
        console.log(err)
        return done(err)
    }
}
))

const signup=async (req,res)=>{
    const gmail=req.body.username
    const pass=req.body.password
   
    const usernameFromEmail = gmail.split('@')[0];

    
    try{
         const hashedpass=await bcrypt.hash(pass,10)  
            //Hasing Password salt 10 Rounds
        const existinguser=await User.findOne({usergmail:gmail})  
        //If existing User return 400 bad request Error
        if (existinguser){
            return res.status(400).json({
                message:"Email is already Registered in Database"
            })

        }
        // New user creating Temportyl saving username afterthat giving ability to Modify IT
        const newuser=new User({
            usergmail:gmail,
            password:hashedpass,
            provider:"Local",
            userName:usernameFromEmail

        })
            // Saving User
            await newuser.save()
            return res.status(201).json({
                message:"User Created Successfully",
                name:usernameFromEmail
            })
    }
    catch(err){
        console.log("Unable to Write in Database",err)
        return res.status(500).json({
            message:"Internal server database Error"
        })
    }      
}
const login = (req, res, next) => {
    passport.authenticate(
        "local",
        (err, user, info) => {

            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(401).json({
                    message: info.message
                });
            }
            const token=jwt.sign(
                {
                    id:user._id,
                    name:user.userName,
                    provider:user.provider
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:'30m'
                }
            );

            return res.status(200).json({
                token,
                user
               
            });
        }
    )(req, res, next);
};
module.exports={signup,login}
