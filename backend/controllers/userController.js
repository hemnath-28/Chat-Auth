
const User=require("../models/user")
async function getuser(req,res){
    console.log("profiel hit")
        const user=req.user;
        try{
            const reguser=await User.findById(user.id)
            console.log(reguser)
            return res.status(200).json({
                message:"Verified Successfully",
                user:reguser
            })
        }
        catch(err){
            console.log("profile error hit")
            return res.status(401).json({
                message:"Unauthorized Access"
            })
    
        }

}

async function updprofile(req,res){
    console.log("in the upd profile")
    const {id}=req.params
    const { updatename, profilepic } = req.body
    console.log("in the upd profile")
    console.log("ID:", id, "Name:", updatename, "Pic:", profilepic)
    
    const updateData = {};
    if (updatename !== undefined) updateData.userName = updatename;
    if (profilepic !== undefined) updateData.profilepic = profilepic;

    try{
        const user=await User.findOneAndUpdate({_id:id}, updateData, {
            new:true
        })
        return res.status(200).json(user)
    }
    catch(err){
        console.log("in the Update Profile",err)
        return res.status(500).json({ message: "Failed to update profile" })
    }
}

module.exports={getuser,updprofile}