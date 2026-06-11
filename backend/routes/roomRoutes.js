const express=require('express')
const RoomRoutes=express.Router()
const {createRoom,joinRoom}=require("../controllers/roomController")
const jwtverify=require("../middleware/VerifyToken")

RoomRoutes.post("/create",jwtverify,createRoom)
RoomRoutes.post("/join/:id",jwtverify,joinRoom)


module.exports=RoomRoutes

