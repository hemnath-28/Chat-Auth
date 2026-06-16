
const multer = require('multer')
const os = require('os')
const https = require('https')
const http = require('http')
const upload = multer({ dest: os.tmpdir() })

const express=require('express')
const RoomRoutes=express.Router()

const jwtverify=require("../middleware/VerifyToken")
const imageupload=require("../services/cloudinary")
const {createRoom,joinRoom,getRoomMessage,getroomMembers,getactivemembers,getRoom,leaveroom,memberremove}=require("../controllers/roomController")

RoomRoutes.get("/:joinid/message",jwtverify,getRoomMessage)     //To get all the Room Messages after the User has Joined using joinedAt has offset
RoomRoutes.get("/:joinid/members",jwtverify,getroomMembers)     //To get the list of all people present in Room to display it in sidebar member list
RoomRoutes.get("/:joinid/activemember",jwtverify,getactivemembers)  //To get Active members present in room from List of All People
RoomRoutes.get("/getrooms/:id",jwtverify,getRoom)    // To get all the list of  Room User is Present {user id}

RoomRoutes.post("/create",jwtverify,createRoom)   //Function to Create the Private Room with Sharable Joinid
RoomRoutes.post("/join/:id",jwtverify,joinRoom)   //To join the Private Room
RoomRoutes.post("/upload",upload.single('image'),imageupload)

RoomRoutes.delete("/:joinid/leave",jwtverify,leaveroom)     //To leave the Room if the User is Not Admin
RoomRoutes.delete("/:joinid/remove/:delid",jwtverify,memberremove)  //Giving the Admin option to remove members 


// Helper: follows HTTP redirects (Cloudinary raw URLs redirect to CDN)
function fetchWithRedirect(url, res, filename, maxRedirects = 5) {
    if (maxRedirects === 0) {
        console.error("[BACKEND] ❌ Download proxy failed: Too many redirects");
        return res.status(500).json({ message: 'Too many redirects' });
    }
    const protocol = url.startsWith('https') ? https : http;
    console.log(`[BACKEND] ⬇️ Download proxy requesting: ${url}`);
    protocol.get(url, (fileStream) => {
        // Follow redirects
        if (fileStream.statusCode >= 300 && fileStream.statusCode < 400 && fileStream.headers.location) {
            console.log(`[BACKEND] ⬇️ Redirecting download to: ${fileStream.headers.location}`);
            return fetchWithRedirect(fileStream.headers.location, res, filename, maxRedirects - 1);
        }
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
        res.setHeader('Content-Type', fileStream.headers['content-type'] || 'application/octet-stream');
        if (fileStream.headers['content-length']) {
            res.setHeader('Content-Length', fileStream.headers['content-length']);
        }
        fileStream.pipe(res);
        console.log(`[BACKEND] ✅ Download proxy successful for filename: ${filename}`);
    }).on('error', (err) => {
        console.error('[BACKEND] ❌ Download proxy error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to download file' });
        }
    });
}

// Proxy route: fetches file from Cloudinary server-side and sends it to the browser with correct download headers
// No jwtverify here — browser link clicks can't send Authorization headers
RoomRoutes.get("/download", (req, res) => {
    const { url, filename } = req.query;
    console.log(`[BACKEND] 📥 Action: File download requested for filename: "${filename}", URL: "${url}"`);
    if (!url) {
        console.warn("[BACKEND] ⚠️ Download failed: URL is required");
        return res.status(400).json({ message: "URL is required" });
    }
    const decodedUrl = decodeURIComponent(url);
    fetchWithRedirect(decodedUrl, res, filename);
})

module.exports=RoomRoutes

