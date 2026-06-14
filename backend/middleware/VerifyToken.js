const jwt=require('jsonwebtoken')
require('dotenv').config()
function verifyToken(req,res,next){
    const authHeader=req.headers.authorization
    console.log(req.headers.authorization)

    if (!authHeader){
        return res.status(401).json({
            message:"Invalid User Token is Missing"
        })
    }
    const token=authHeader.split(" ")[1];

    try{
        const decoded=jwt.verify(
            token,
        process.env.JWT_SECRET)
        
        req.user=decoded
        console.log("req user",req.user)
        next()
    }
    catch(e){
        console.log("in web Token:",e)
        res.status(403).json({
            message:"User not Authenticated Authentaction Error"
        })
        
    }
}


module.exports=verifyToken