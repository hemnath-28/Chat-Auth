const mongoose=require('mongoose')


const RoomSchema=new mongoose.Schema(
    {
    roomName: {    
    type: String,
    required: true,
    unique: true
  },
   joinId: {
    type: String,   //Share id to let Other Join
    required: true,
    unique: true
  },

  admin:{
        type:mongoose.Schema.Types.ObjectId,   //Admin Id
        ref:"User",
        required:true
    },

    members: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        },
        joinedAt:{     //Used to filter Messsage after they have Joined Instead of Offset Approach
            type:Date,
            default:Date.now
        }
    }],
    

},
{ timestamps: true }
);

const Room=mongoose.model("Room",RoomSchema)

module.exports=Room
    