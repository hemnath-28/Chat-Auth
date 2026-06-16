const jwt=require('jsonwebtoken')
require('dotenv').config()
function verifyToken(req,res,next){
    const authHeader=req.headers.authorization
    console.log("In the JWT verify Token ")
    if (!authHeader){
        console.warn(`[BACKEND] Auth verification failed: Authorization header is missing for route ${req.originalUrl || req.url}`);
        return res.status(401).json({
            message:"Invalid User Token is Missing"
        })
    }
    // Bearer "token_" ->We just need Token
    const token=authHeader.split(" ")[1];

    try{
        const decoded=jwt.verify(
            token,
            process.env.JWT_SECRET
        )
        // Attaching the decoded id,name,provider to req.user
        req.user=decoded
        console.log(`[BACKEND] Auth verification success for User ID: ${req.user.id}, Name: ${req.user.name}`);
        // Passing the request to next Controller/function in the Router 
        next()
    }
    catch(e){
        // Leave a message so it tries to fetch the refresh token and atttach it on token expiry
        console.warn(`[BACKEND] Auth verification failed: Invalid/Expired token for route ${req.originalUrl || req.url}. Error: ${e.message}`);
        res.status(403).json({
            message:"User not Authenticated Authentaction Error"
        })
    }
}

module.exports=verifyToken