const express=require('express')
const cors = require('cors');
const passport=require('passport')
require('dotenv').config()
const Room=require("./models/Room")
const connectDb=require("./database/connectDb")
const http=require('http')
const { Server }=require("socket.io")
const authRoutes=require("./routes/authRoutes")
const userRoutes=require("./routes/userRoutes")
const roomRoutes=require("./routes/roomRoutes")
const messageRoutes=require("./routes/messageRoutes")
const Message=require("./models/Message")
const app=express()
app.use(cors())
app.use(express.json())
app.use(passport.initialize())

const onlineUsers=new Map();
app.set('onlineUsers', onlineUsers);
const connect=connectDb()
const Port=process.env.PORT
const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin: "http://localhost:5173", // Your React frontend port
        methods: ["GET", "POST","DELETE","PUT"]
    }
})

io.on("connection",(socket)=>{
    let globalroomid=null
    console.log("A user is Connected via web Socket",socket.id)
    // on User Connected attach id to it and emit to everyone user-connected
    socket.on("user_connected",(msg)=>{
        socket.userid=msg.id
        onlineUsers.set(socket.userid,socket.id)
    })
    
    socket.on("join_room",(roomid)=>{
        globalroomid=roomid
        socket.join(roomid)
        io.to(roomid).emit("user-joined",{
            userId:socket.userid,status:"online"
        })
        if (globalroomid){
            socket.broadcast.to(globalroomid).emit("alert", {
        message: "New user has been Joined "
    });

        }
        console.log(`Socket ${socket.id} joined room room: ${roomid}`);
    })
    socket.on("typing",(msg)=>{
        socket.broadcast.to(msg.roomid).emit("UserTyping",msg.username)
    })
    socket.on("stoptyping",(msg)=>{
        socket.broadcast.to(msg.roomid).emit("UserStopped",msg.username)
    })
    socket.on("send_message",async (msg)=>{
        console.log("in the send_message")
        const { joinid, sender, content } = msg;
        console.log("message:",msg)
        const roomDoc = await Room.findOne({ joinId: joinid });
        if (!roomDoc) {
            console.log("Room not found for joinId:", joinid);
            return;
        }
        const newMessage = await Message.create({
            room: roomDoc._id,     // Room ObjectID
            sender: sender, // User ObjectID
            content: content,
            fileUrl: msg.fileUrl || null,    // 🟢 Save the file URL
            fileType: msg.fileType || null   // 🟢 Save the file type
        });
        console.log("message fontend:",newMessage)
        console.log("message Saved")
        const populatemessage=await newMessage.populate("sender", "userName profilepic")
        io.emit("receive_message",populatemessage)
    })
    // On user disconnect remove from map and emit user-left
    socket.on("disconnect",()=>{
        onlineUsers.delete(socket.userid)
        io.to(globalroomid).emit("user-left",{
            userId:socket.userid,status:"offline"
        })
        socket.broadcast.to(globalroomid).emit("alert",{
            message:"User has been left"
        })
    })

    // Admin removes a member — notify that specific user to navigate home
    socket.on("remove_member", ({ roomid, removedUserId }) => {
        console.log(`Admin removed user ${removedUserId} from room ${roomid}`)
        // Emit to all sockets in this room — the frontend checks if it's the removed user
        io.to(roomid).emit("you_were_removed", { removedUserId })
    })
})



app.use("/message",messageRoutes)

app.use("/auth",authRoutes)

app.get("/",(req,res)=>{
    res.send("In the Home page")
})

app.use("/user",userRoutes)

app.use("/room",roomRoutes)
server.listen(Port,()=>{
    console.log(`Server is Listening on Port ${Port}`)
})

