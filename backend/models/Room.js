const mongoose=require('mongoose')


const RoomSchema=new mongoose.Schema(
    {
    roomName: {
    type: String,
    required: true,
    unique: true
  },
   joinId: {
    type: String,
    required: true,
    unique: true
  },

  admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]

},
{ timestamps: true }
);

const Room=mongoose.model("Room",RoomSchema)

module.exports=Room
    