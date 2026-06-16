const cloudinary = require('cloudinary').v2
const fs = require('fs')
require('dotenv').config()
const path = require('path')

// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name:process.env.CLOUD_NAME , 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET,
  secure:true
});



async function uploadimage(req,res){
    console.log("[BACKEND]  Action: Image upload requested");
    // If no file inform the Frontend 
    if (!req.file) {
        console.warn("[BACKEND] ⚠️ Image upload failed: No file was attached to the request");
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
        console.log(`[BACKEND] ☁️ Uploading file "${req.file.originalname}" (${req.file.mimetype}) to Cloudinary...`);
        const result=await cloudinary.uploader.upload(imagePath,options)  //Upload image to the uRL
        console.log(`[BACKEND] ✅ Cloudinary upload successful. URL: ${result.secure_url}`);
        fs.unlinkSync(imagePath)  //To remove from the tmp multer directory
        return res.status(200).json(result)
    }catch(err){
        console.error("[BACKEND] ❌ Cloudinary upload error:", err);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
        }
        return res.status(404).json("error in cloudinary")
    }
}

module.exports=uploadimage