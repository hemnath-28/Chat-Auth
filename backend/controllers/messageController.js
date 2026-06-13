// const express=require('express')
// const Message=require('../models/Message')
// const Room=require('../models/Room')

// async function getmessage(req,res){
//     const {joinid}=req.params
//     try{
//         const roomDoc = await Room.findOne({ joinId: joinid })
//         console.log("on the RoomDoc",roomDoc)
//         if (!roomDoc) {
//             return res.status(404).json({ message: "Room not found" })
//         }
//         const currentuserId=req.user.id
//         console.log("useri id:",currentuserId)
//         const member=roomDoc.members.find((m)=>m.userId.toString()===currentuserId.toString())
//         if (!member){
//             return res.status(403).json({ message: "You are not a member of this room" });
//         }
//         const jointime=member.joinedAt
//         const messages=await Message.find({
//             room:roomDoc._id,
//             createdAt:{
//                 $gte:jointime
//             }
//         }).populate("sender","userName profilepic").sort({createdAt:1})

//         return res.status(200).json(messages)
//     }
//     catch(err){
//         return res.status(500).json({
//             message:"server Error"
//         })

//     }

// }

// module.exports=getmessage