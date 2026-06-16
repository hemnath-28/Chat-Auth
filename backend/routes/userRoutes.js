const express=require('express')
const userRoutes=express.Router()
const verify=require("../middleware/VerifyToken")
const {getuser,updprofile }=require("../controllers/userController")


userRoutes.get("/Profile",verify,getuser)     //To get the User Profile Details
userRoutes.post("/Profile/:id",verify,updprofile)   //Endpoint to Update Username && Profile

module.exports=userRoutes