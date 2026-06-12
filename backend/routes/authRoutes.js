const express=require('express')
const router=express.Router()
const passport=require('passport')
const {signup,login}=require("../controllers/authController")
const jwt=require('jsonwebtoken')
router.post("/signup",signup)
router.post("/login",login)
router.get("/google",passport.authenticate('google',
    {
        scope:['profile','email']
    }
   
))

router.get("/callback",passport.authenticate(
    'google',
    {
        session:false
    }
    ),(req,res)=>{
    const token=jwt.sign(
                    {
                        id:req.user._id,
                        name:req.user.userName,
                        provider:req.user.provider
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn:'30m'
                    }
                );
     res.redirect(
            `http://localhost:5173/oauth-success?token=${token}`
        );
}
  )


module.exports=router