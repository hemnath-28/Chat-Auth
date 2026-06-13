
const mongoose=require('mongoose')


const userSchema = new mongoose.Schema(
    {
        
        userName:{
            type:String,
            required:true
        },
        usergmail:{
            type:String,
            required:true
        }
        ,
        profilepic:{
            type:String
        },
        password:{
            type:String
        },
        provider:{
            type:String,
            enum:['Google','Local'],
            default:'Local'
        },
        googleId:{
            type:String
        }
},
{ timestamps: true }
)
const User = mongoose.model("User", userSchema)
module.exports=User