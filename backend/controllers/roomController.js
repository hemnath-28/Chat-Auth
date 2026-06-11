const Room=require("../models/Room")

function generateRoomid(){
    let i=0
    console.log("in gen room id")
    const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId = "";
    for (let i=0;i<6;i++){
        roomId+=chars.charAt(Math.random()*chars.length)
    }
    return roomId
}

async function getunique(){
    console.log("in get uniqe")
    let i=0
    while (true){
        let roomid=generateRoomid()
        console.log(i++)
        let exists=await Room.findOne({roomId:roomid})
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
        admin:req.body.admin,
        members:[req.body.member]
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
    const userid=req.user._id
    try{
        const findroom=await Room.findOne({joinId:joincode})
    if (!findroom){
        return res.status(404).json({
            message:"Room with that Id not Found"
        })
    }
    if (findroom.members.includes(userid)) {
            return res.status(400).json({ message: "You are already in this room!" });
    }
    findroom.members.push(userid)
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


module.exports={createRoom,joinRoom}