const cloudinary = require('cloudinary').v2
const fs = require('fs')

// Return "https" URLs by setting secure: true
cloudinary.config({
  
  cloud_name: "intervue", 
  api_key: "642531739433753", 
  api_secret: "_6jVkr5rm3aslPCbFSp945fgK3c",
});

// Log the configuration
console.log("config:",cloudinary.config());

async function uploadimage(req,res){
    console.log("in the image Upload")
    console.log("req body",req.file)
    
    const options = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: "auto"
    };
    const imagePath = req.file.path;
    try{
       
        const result=await cloudinary.uploader.upload(imagePath,options)
        console.log("image upload",result)
        fs.unlinkSync(imagePath)
        return res.status(200).json({message:result})
    }catch(err){
        console.log(err)
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
        }
        return res.status(404).json("error in cloudinary")
    }

}

module.exports=uploadimage