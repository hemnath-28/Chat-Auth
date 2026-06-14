const mongoose=require('mongoose')

const messageSchema=new mongoose.Schema({
     room:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Room",
        required:true
    },
     sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    content:{
        type:String,
        required:false
    },
    fileUrl: {
        type: String,   // 🟢 Stores the Cloudinary URL
        default: null
    },
    fileType: {
        type: String,   // 🟢 e.g., 'image', 'video', 'pdf', 'raw'
        default: null
    }
},
{
    timestamps:true
})

const Message=mongoose.model("message",messageSchema)

module.exports=Message