const express=require('express')
const passport=require('passport')
const user=require("./models/user")

const GoogleStratergy=require('passport-google-oauth20').Stratergy;

passport.use(new GoogleStratergy(
    {
        clientID:process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        callbackURL:"/auth/google/callback",
        scope:['profile']
    },
    (accessToken,refreshToken,profile,done)=>{
        return done(null,profile)
    }
))


