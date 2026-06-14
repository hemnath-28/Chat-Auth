const cloudinary = require('cloudinary').v2
const fs = require('fs')

const path = require('path')

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
    
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    
    // Extract original extension and name
    const ext = path.extname(req.file.originalname); // e.g. '.pdf'
    const nameWithoutExt = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_.-]/g, '_');
    
    const options = {
      public_id: isImage ? undefined : `${nameWithoutExt}_${Date.now()}${ext}`, // Preserve extension for PDFs/raw documents
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: isImage ? "image" : "raw"
    };
    const imagePath = req.file.path;
    try{
       
        const result=await cloudinary.uploader.upload(imagePath,options)
        console.log("image upload",result)
        fs.unlinkSync(imagePath)
        return res.status(200).json(result)
    }catch(err){
        console.log(err)
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
        }
        return res.status(404).json("error in cloudinary")
    }

}

module.exports=uploadimage