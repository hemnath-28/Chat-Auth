const express=require('express')
const userRoutes=express.Router()
const verify=require("../middleware/VerifyToken")
const {getuser,updprofile }=require("../controllers/userController")
userRoutes.get("/Profile",verify,getuser)
userRoutes.post("/Profile/:id",verify,updprofile)

module.exports=userRoutes