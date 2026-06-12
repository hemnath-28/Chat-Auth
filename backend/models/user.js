
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
        },
        rooms:
           {
            type:[String],
            default:[]
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
}
)
const User = mongoose.model("User", userSchema)
module.exports=User