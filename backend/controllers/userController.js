
const User=require("../models/user")

// user details {
//   id: '6a26453f99c624f2cede187c',
//   name: 'Sunraku',
//   provider: 'Google',
//   iat: 1781523975,
//   exp: 1781524875
// }

// To get the user Profile
async function getuser(req,res){
        const user=req.user;  
        console.log(`Action: Retrieving profile data for User ID: ${user.id}`);
        try{
            const reguser=await User.findById(user.id)   //Find the Id by  User id decoded from jwt and attaching it to req.user
            if (!reguser) {
                console.warn(`[BACKEND] ⚠️ User ID: ${user.id} not found in database`);
                return res.status(404).json({ message: "User not found" });
            }
            console.log(`[BACKEND] ✅ Profile data retrieved successfully for user: ${reguser.userName} (${reguser.usergmail})`);
            return res.status(200).json({         //Return the successfuly retrived
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
// To Update the Profile Section Name && Profile
async function updprofile(req,res){
    const {id}=req.params   //Id from Dynamic Routing
    const { updatename, profilepic } = req.body
    console.log(`[BACKEND] Action: Updating profile for User ID: ${id}. Fields to update: userName="${updatename}", profilepic="${profilepic}"`);
    
    const updateData = {};
    if (updatename !== undefined) updateData.userName = updatename;
    if (profilepic !== undefined) updateData.profilepic = profilepic;

    try{
        const user=await User.findOneAndUpdate({_id:id}, updateData, {
            new:true  //For retruung the New Updated information
        })
        if (!user) {
            console.warn(`[BACKEND] Profile update failed: User ID ${id} not found`);
            return res.status(404).json({ message: "User not found" });
        }
        console.log(`[BACKEND] Profile updated successfully for user: ${user.userName}`);
        return res.status(200).json(user)
    }
    catch(err){
        console.error(`[BACKEND] ❌ Profile update failed for User ID ${id}:`, err);
        return res.status(500).json({ message: "Failed to update profile" })
    }
}

module.exports={getuser,updprofile}
// Exporting Both User Profile and Updating Profile Sections