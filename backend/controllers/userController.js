
const User=require("../models/user")
async function getuser(req,res){
        const user=req.user;
        console.log(`[BACKEND] 👤 Action: Retrieving profile data for User ID: ${user.id}`);
        try{
            const reguser=await User.findById(user.id)
            if (!reguser) {
                console.warn(`[BACKEND] ⚠️ User ID: ${user.id} not found in database`);
                return res.status(404).json({ message: "User not found" });
            }
            console.log(`[BACKEND] ✅ Profile data retrieved successfully for user: ${reguser.userName} (${reguser.usergmail})`);
            return res.status(200).json({
                message:"Verified Successfully",
                user:reguser
            })
        }
        catch(err){
            console.error(`[BACKEND] ❌ Profile retrieval error for User ID ${user.id}:`, err);
            return res.status(401).json({
                message:"Unauthorized Access"
            })
        }
}

async function updprofile(req,res){
    const {id}=req.params
    const { updatename, profilepic } = req.body
    console.log(`[BACKEND] 👤 Action: Updating profile for User ID: ${id}. Fields to update: userName="${updatename}", profilepic="${profilepic}"`);
    
    const updateData = {};
    if (updatename !== undefined) updateData.userName = updatename;
    if (profilepic !== undefined) updateData.profilepic = profilepic;

    try{
        const user=await User.findOneAndUpdate({_id:id}, updateData, {
            new:true
        })
        if (!user) {
            console.warn(`[BACKEND] ⚠️ Profile update failed: User ID ${id} not found`);
            return res.status(404).json({ message: "User not found" });
        }
        console.log(`[BACKEND] ✅ Profile updated successfully for user: ${user.userName}`);
        return res.status(200).json(user)
    }
    catch(err){
        console.error(`[BACKEND] ❌ Profile update failed for User ID ${id}:`, err);
        return res.status(500).json({ message: "Failed to update profile" })
    }
}

module.exports={getuser,updprofile}