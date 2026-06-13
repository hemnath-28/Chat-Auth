const express=require('express')
const RoomRoutes=express.Router()
const {createRoom,joinRoom,getRoomMessage,getroomMembers}=require("../controllers/roomController")
const jwtverify=require("../middleware/VerifyToken")

RoomRoutes.post("/create",jwtverify,createRoom)
RoomRoutes.post("/join/:id",jwtverify,joinRoom)
RoomRoutes.get("/:joinid/message",jwtverify,getRoomMessage)
RoomRoutes.get("/:joinid/members",jwtverify,getroomMembers)

module.exports=RoomRoutes

