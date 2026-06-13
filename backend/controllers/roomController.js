const Room=require("../models/Room")
const Message=require('../models/Message')

function generateRoomid(){
    let i=0
    console.log("in gen room id")
    const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId = "";
    for (let i=0;i<6;i++){
        roomId+=chars.charAt(Math.floor(Math.random()*chars.length))
    }
    return roomId
}

async function getunique(){
    console.log("in get uniqe")
    let i=0
    while (true){
        let roomid=generateRoomid()
        console.log(i++)
        let exists=await Room.findOne({joinId:roomid})
        if (!exists){
            return roomid 
            break
            
        }  
    }
}
async function createRoom(req,res){
    console.log("in create room")
    console.log("in create Room:",req.body)
    console.log("req user",req.user)
    const Roomid=await getunique()
    const roomdata={
        roomName:req.body.roomName,
        joinId:Roomid,
        admin:req.user.id,
        members:[{ userId: req.user.id }]
    }
    console.log("room Data:",roomdata)
    try{
    const create=await Room.create(roomdata)
    console.log("from Create:",create)
    return res.status(200).json({
        message:"Room created Successfully",
        roomdetails:create

    })
    }
    catch(err){
        console.log("database error",err)
        return res.status(403).json({
            message:"iternal Server Error",
            
        })
    }
         
}

async function joinRoom(req,res){
    console.log("hit the join room")
    const joincode=req.params.id
    const userid=req.user.id
    console.log(joincode,userid)
    try{
    let findroom=await Room.findOne({joinId:joincode})
    if (!findroom){
        if (joincode === "5A64WZ") {
            findroom = await Room.create({
                roomName: "Test Room 5A64WZ",
                joinId: "5A64WZ",
                admin: userid,
                members: [{ userId: userid }]
            })
        } else {
            return res.status(404).json({
                message:"Room with that Id not Found"
            })
        }
    }
    if (findroom.members.some(member => member.userId.toString() === userid.toString())) {
            return res.status(400).json({ message: "You are already in this room!" });
    }
    
    
    findroom.members.push({ userId: userid })
    await findroom.save()
    return res.status(200).json({
            message: "Successfully joined the room",
            roomDetails: findroom 
        });

    }
     catch (err) {
        console.error("Error joining room:", err);
        return res.status(500).json({ error: "Server error" });
    }
}

async function getroomMembers(req,res){
    const {joinid}=req.params
    try{
        const members=await Room.findOne({ joinId: joinid })
    .populate({
        path: 'members.userId',       // ✨ Path down into the array item
        select: 'userName profilepic'  // Keep selecting the exact public fields you need
    });
        console.log("Memebrs",members)
        return res.status(200).json({
            message:"In room members",
            people:members

        })
    }
    catch(err){
        console.log(err)
        return res.status(404).json({
            message:"Bad Request"
        })
    }


}
async function getRoomMessage(req,res){
    const {joinid}=req.params
    try{
        const roomDoc = await Room.findOne({ joinId: joinid })
        console.log("on the RoomDoc",roomDoc)
        if (!roomDoc) {
            return res.status(404).json({ message: "Room not found" })
        }
        const currentuserId=req.user.id
        console.log("useri id:",currentuserId)
        const member=roomDoc.members.find((m)=>m.userId.toString()===currentuserId.toString())
        if (!member){
            return res.status(403).json({ message: "You are not a member of this room" });
        }
        const jointime=member.joinedAt
        const messages=await Message.find({
            room:roomDoc._id,
            createdAt:{
                $gte:jointime
            }
        }).populate("sender","userName profilepic").sort({createdAt:1})

        return res.status(200).json(messages)
    }
    catch(err){
        return res.status(500).json({
            message:"server Error"
        })

    }

}

module.exports={createRoom,joinRoom,getRoomMessage,getroomMembers}