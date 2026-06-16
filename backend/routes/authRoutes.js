const express=require('express')
const router=express.Router()
const passport=require('passport')
const {signup,login,refresh,logout,generateTokensAndSetCookie}=require("../controllers/authController")

router.post("/signup",signup)     //SignupRoute
router.post("/login",login)      //Login Route
router.post("/refresh",refresh)  //401 or 403 Error access token Exprired axios interceptor make request to refresh endpoint
router.post("/logout",logout)

router.get("/google",passport.authenticate('google',{scope:['profile','email']}))

router.get("/callback",passport.authenticate(
    'google',
    {
        session:false
    }
    ),async (req,res)=>{
        try {
            console.log("in the Callback from google",req.user)
            // Generating refresh token attaching it to cookie and getting the accestoken
            const token = await generateTokensAndSetCookie(req.user, res);
            res.redirect(
                `http://localhost:5173/oauth-success?token=${token}`
            );
        } catch (error) {
            console.error("Google OAuth token generation error:", error);
            res.redirect("http://localhost:5173/login?error=auth_failed");
        }
    }
)

module.exports=router