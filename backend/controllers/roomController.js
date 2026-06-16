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
        // Generating unique roomid with Hashes
        let roomid=generateRoomid()
        console.log(i++)
        // If the joinid already exits try Again or Break return joinid
        let exists=await Room.findOne({joinId:roomid})
        if (!exists){
            return roomid  
        }  
    }
}

//Function to CreateRoom
async function createRoom(req,res){
    console.log(`[BACKEND]  Action: Creating room "${req.body.roomName}" by User ID: ${req.user.id}`);
    // To get the Unique joinId 
    const joinid=await getunique() 
    const roomdata={
        roomName:req.body.roomName,
        joinId:joinid,
        admin:req.user.id,
        members:[{ userId: req.user.id }]
    }
    try{
        // Creating the Private Room
        const create=await Room.create(roomdata)
        console.log(`[BACKEND] Room created successfully. Name: "${create.roomName}", Join Code: ${create.joinId}, Admin ID: ${create.admin}`);
        return res.status(200).json({
            message:"Room created Successfully",
            roomdetails:create
        })
    }
    catch(err){
        console.error("[BACKEND] Database error creating room:", err);
        return res.status(403).json({
            message:"internal Server Error",
        })
    }
}

// Function to Join the Private Room
async function joinRoom(req,res){
    const joincode=req.params.id
    const userid=req.user.id
    console.log(`[BACKEND] Action: User ID ${userid} is trying to join room with Code: ${joincode}`);
    try{
        // Find the room with joinCode
        let findroom=await Room.findOne({joinId:joincode})
        if (!findroom){
            console.warn(`[BACKEND] Join failed: Room with Code: ${joincode} not found`);
            return res.status(404).json({
                message:"Room with joinId not Found"
            })
        }
        // Check if the Member is Already present
        if (findroom.members.some(member => member.userId.toString() === userid.toString())) {
            console.warn(`[BACKEND] join failed: User ID ${userid} is already a member of room "${findroom.roomName}"`);
            return res.status(400).json({ message: "You are already in this room!" });
        }
        // Pushing the newuser id in the Members[]
        findroom.members.push({ userId: userid })
        await findroom.save()
        console.log(`[BACKEND] join success: User ID ${userid} joined room "${findroom.roomName}"`);
        return res.status(200).json({
            message: "Successfully joined the room",
            roomDetails: findroom 
        });
    }
    catch (err) {
        console.error("[BACKEND] ❌ Error joining room:", err);
        return res.status(500).json({ error: "Server error" });
    }
}

// Function to get all Room Members
async function getroomMembers(req,res){
    const {joinid}=req.params
    console.log(`[BACKEND] 💬 Action: Fetching room members list for room Code: ${joinid}`);
    try{
        const members=await Room.findOne({ joinId: joinid })
        .populate([{
            path: 'members.userId',
            select: 'userName profilepic' //Population the id with {username,profilepic}
        },{
            path:'admin',
            select:'userName profilepic'  //Population the adminId with {username,profilepic}
        }]);
        if (!members) {
            console.warn(`[BACKEND] ⚠️ Room members lookup failed: Room Code: ${joinid} not found`);
            return res.status(404).json({ message: "Room not found" });
        }
        console.log(`[BACKEND] ✅ Fetched ${members.members.length} members for room "${members.roomName}"`);
        return res.status(200).json({
            message:"In room members",
            people:members
        })
    }
    catch(err){
        console.error("[BACKEND] ❌ Error fetching room members:", err);
        return res.status(404).json({
            message:"Bad Request"
        })
    }
}
// Get the Room Message with Offset after the time they Joined
async function getRoomMessage(req,res){
    const {joinid}=req.params 
    const currentuserId=req.user.id
    console.log(`[BACKEND] Action: Fetching room messages for room Code: ${joinid} for User ID: ${currentuserId}`);
    try{
        // Finding the room to fetch the details and get roomid
        const roomDoc = await Room.findOne({ joinId: joinid })
        if (!roomDoc) {
            console.warn(`[BACKEND] Message lookup failed: Room Code: ${joinid} not found`);
            return res.status(404).json({ message: "Room not found" })
        }
        // Finding the member to get thier id and joined Time to display the message after they Joined
        const member=roomDoc.members.find((m)=>m.userId.toString()===currentuserId.toString())
        if (!member){
            console.warn(`[BACKEND] ⚠️ Message lookup forbidden: User ID: ${currentuserId} is not a member of room "${roomDoc.roomName}"`);
            return res.status(403).json({ message: "You are not a member of this room" });
        }
        // Join time of the User
        const jointime=member.joinedAt
        // Fetches all Message from message Schema using room id and jointime >
        const messages=await Message.find({
            room:roomDoc._id,
            createdAt:{
                $gte:jointime
            }
        }).populate("sender","userName profilepic").sort({createdAt:1})
        // Sorted in Ascending Order

        console.log(`[BACKEND] ✅ Fetched ${messages.length} messages since join time (${jointime}) for room "${roomDoc.roomName}"`);
        return res.status(200).json(messages)
    }
    catch(err){
        console.error("[BACKEND] ❌ Error fetching room messages:", err);
        return res.status(500).json({
            message:"server Error"
        })
    }
}

async function getactivemembers(req, res) {
    const { joinid } = req.params; 
    console.log(`[BACKEND] 💬 Action: Fetching active (online) members for room Code: ${joinid}`);
    const onlineUsers = req.app.get("onlineUsers")  //Fetch from Map setting using App.set that is that is availabe in req.app
    try {
        const room = await Room.findOne({ joinId: joinid }).populate({  //It stores the list of people present in Room
            path: "members.userId",
            select: "userName profilepic"
        });
        
        if (!room) {
            console.warn(`[BACKEND] Active members lookup failed: Room Code: ${joinid} not found`);
            return res.status(404).json({ message: "Room not found" });
        }
        
        const onlinemembers = room.members.filter((member) => {
            if (!member.userId || !member.userId._id) return false;
            const memberid = member.userId._id.toString();
            return onlineUsers.has(memberid);      //Check if the memberid is present in OnlineUsers
        });
        
        console.log(`[BACKEND] Active members fetched for room "${room.roomName}": Found ${onlinemembers.length} online out of ${room.members.length} total members`);
        return res.status(200).json(onlinemembers);  //Send the Online Members
    } catch (err) {
        console.error("[BACKEND] ❌ Error in getactivemembers:", err); 
        return res.status(500).json({
            message: "Internal server error. Try again.",
            error: err.message
        });
    }
}

// To get all the Room User is Present 
async function getRoom(req,res){
    const {id}=req.params;
    console.log(`[BACKEND] 💬 Action: Fetching all rooms for User ID: ${id}`);
    try{
        const userRooms = await Room.find(
            {
                "members.userId": id
            },
            {
                _id: 1,
                roomName: 1,
                joinId: 1,
                admin: 1
            }
        );
        console.log(`[BACKEND]  Fetched ${userRooms.length} rooms for User ID: ${id}`);
        return res.status(200).json({
            userRooms
        })
    }
    catch(err){
        console.error("[BACKEND]  Error in getRoom:", err);
        return res.status(500).json({
            message:"Bad server Error Try Again"
        })
    }
}

// Function to Leave the Room if the User is not Admin
async function leaveroom(req,res){
    const {joinid}=req.params
    const userid=req.user.id
    console.log(`[BACKEND] Action: User ID: ${userid} attempting to leave room Code: ${joinid}`);
    try{
        const checkadmin=await Room.findOne({admin:userid,joinId:joinid})
        if (checkadmin){
            console.warn(`[BACKEND] Leave room failed: User ID: ${userid} is the Admin of room Code: ${joinid} and cannot leave`);
            return res.status(403).json({
                message:"You are admin unable to Leave the Room"
            })
        }
        // Returning the room Details after removing Members
        const leaveroom=await Room.findOneAndUpdate({
            joinId:joinid
        },{$pull:{members:{userId:userid} }},
            {new:true}
        ).populate("members.userId")
        if (!leaveroom){
            console.warn(`[BACKEND] ⚠️ Leave room failed: Room Code: ${joinid} not found or user already left`);
            return res.status(404).json({
                message:"User already left "
            })
        }
        // Returng the Updated Room Details
        console.log("leave Room",leaveroom)
        console.log(`[BACKEND] ✅ Leave room success: User ID ${userid} has left room "${leaveroom.roomName}"`);
        return res.status(200).json({
            message:"User has left the room",
            details:leaveroom
        })
    }
    catch(err){
        console.error("[BACKEND] ❌ Error leaving room:", err);
    }
}

// Room Admin to Give ability to Remove people
async function memberremove(req,res){
    const id=req.user.id
    const {joinid}=req.params
    const {delid}=req.params
    console.log(`[BACKEND] 💬 Action: Admin ID: ${id} attempting to remove member ID: ${delid} from room Code: ${joinid}`);
    // Find the Room Details
    const roomDetails = await Room.findOne({ joinId: joinid });
    if (!roomDetails) {
        console.warn(`[BACKEND] ⚠️ Remove member failed: Room Code: ${joinid} not found`);
        return res.status(404).json("Room not found");
    }
    // Check if the user is Admin in that Room
    const checkadmin=await Room.findOne({
        joinId:joinid,
        admin:id
    })

    if (checkadmin){
        // delete the userid that admin selects
        const memberdeleted=await Room.findOneAndUpdate({joinId:joinid},
            {$pull:{
                members:{
                    userId:delid
                }
            }},
            { new: true }   
        )
        console.log(`[BACKEND] Remove member success: Admin ID: ${id} removed member ID: ${delid} from room "${roomDetails.roomName}"`);
        return res.status(200).json({
            message:"true",
            deldetails:memberdeleted
        })
    }

    console.warn(`[BACKEND] Remove member failed: User ID: ${id} is not the Admin of room "${roomDetails.roomName}"`);
    return res.status(403).json("User is not this Room Admin")
}
    

module.exports={createRoom,joinRoom,getRoomMessage,getroomMembers,getactivemembers,getRoom,leaveroom,memberremove}