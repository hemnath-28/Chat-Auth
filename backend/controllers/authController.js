const express=require("express")
const passport=require('passport')
const LocalStratergy=require('passport-local').Strategy
const db=require("./database/connectDb")
const bcrypt=require('bcrypt')
const User=require("./models/user")

passport.use(new LocalStratergy (
     async (gmail,password,done)=>{
        try{
            const user=await user.findOne({usergmail:gmail})
            // If User is Not Present
            if (!user){
                return done(null,false,{message : "Gmail Not Found Try Signup First"})

            }
        }
        catch(err){
            return done(err)
        }
     }
))

const signup=async (req,res)=>{
    const gmail=req.body.username
    const pass=req.body.password
    const hashedpass=await bcrypt.hash(pass,10)  //Hasing Password salt 10 Rounds
    const usernameFromEmail = gmail.split('@')[0];

    
    try{
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
            username:usernameFromEmail

        })
            // Saving User
            await newuser.save()
            res.status(201).json({
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


module.exports={signup}