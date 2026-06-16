const express=require('express')
const cors = require('cors');
const passport=require('passport')
const cookieParser = require('cookie-parser')
const http=require('http')
const { Server }=require("socket.io")

require('dotenv').config()

const Room=require("./models/Room")
const Message=require("./models/Message")
const connectDb=require("./database/connectDb")
const connect=connectDb()  //calling the ConnectDb function to connect to Database

const authRoutes=require("./routes/authRoutes")
const userRoutes=require("./routes/userRoutes")
const roomRoutes=require("./routes/roomRoutes");
const User = require('./models/user');

const app=express()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true // Crucial to allow sharing of cookies from frontend to backend
}))
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())

// Global request logger middleware
app.use((req, res, next) => {
    console.log(`\n[BACKEND] 🚀 HIT Endpoint: ${req.method} ${req.originalUrl || req.url}`);
    next();
});

const onlineUsers=new Map();  //Using it instead of Redis to Keep people who are Online
app.set('onlineUsers', onlineUsers);

const Port=process.env.PORT



app.use("/auth",authRoutes)
app.use("/user",userRoutes)
app.use("/room",roomRoutes)
app.get("/",(req,res)=>{
    res.send("In the Home page")
})

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
    // on User Connected attach id and username to it
    socket.on("user_connected",(msg)=>{
        socket.userid=msg.id
        socket.username=msg.name || "A user"
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
                message: `${socket.username} has joined the room`
            });
        }
        console.log(`Socket ${socket.id} joined room: ${roomid}`);
    })
    // Using UseRef in Frontend so that state does not clear after reloading it send message every 5 Seconds
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
        // Adding the Username // Profile Pic ->Sender
        const populatemessage=await newMessage.populate("sender", "userName profilepic")
        io.emit("receive_message",populatemessage)
    })
    // On user disconnect remove from map and emit user-left
    socket.on("disconnect",()=>{
        onlineUsers.delete(socket.userid)
        io.to(globalroomid).emit("user-left",{
            userId:socket.userid,status:"offline"
        })
        if (globalroomid) {
            socket.broadcast.to(globalroomid).emit("alert",{
                message: `${socket.username || "A user"} has left the room`
            });
        }
    })

    // Admin removes a member — notify that specific user to navigate home
    socket.on("remove_member",async  ({ roomid, removedUserId }) => {
        console.log(`Admin removed user ${removedUserId} from room ${roomid}`)
        // Emit to all sockets in this room — the frontend checks if it's the removed user
        const user=await User.findOne({_id:removedUserId})
        io.to(roomid).emit("you_were_removed", { removedUserId })
    })
})


server.listen(Port,()=>{
    console.log(`Server is Listening on Port ${Port}`)
})

