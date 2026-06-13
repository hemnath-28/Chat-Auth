const express=require('express')
const RoomRoutes=express.Router()
const {createRoom,joinRoom,getRoomMessage,getroomMembers,getactivemembers,getRoom}=require("../controllers/roomController")
const jwtverify=require("../middleware/VerifyToken")
RoomRoutes.get("/getrooms/:id",jwtverify,getRoom)
RoomRoutes.post("/create",jwtverify,createRoom)
RoomRoutes.post("/join/:id",jwtverify,joinRoom)
RoomRoutes.get("/:joinid/message",jwtverify,getRoomMessage)
RoomRoutes.get("/:joinid/members",jwtverify,getroomMembers)
RoomRoutes.get("/:joinid/activemember",jwtverify,getactivemembers)

module.exports=RoomRoutes

