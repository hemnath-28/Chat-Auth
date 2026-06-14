const express=require('express')
const RoomRoutes=express.Router()
const multer = require('multer')
const os = require('os')
const https = require('https')
const http = require('http')
const upload = multer({ dest: os.tmpdir() })
const {createRoom,joinRoom,getRoomMessage,getroomMembers,getactivemembers,getRoom,leaveroom,memberremove}=require("../controllers/roomController")
const jwtverify=require("../middleware/VerifyToken")
const imageupload=require("../services/cloudinary")
RoomRoutes.get("/getrooms/:id",jwtverify,getRoom)
RoomRoutes.post("/create",jwtverify,createRoom)
RoomRoutes.post("/join/:id",jwtverify,joinRoom)
RoomRoutes.get("/:joinid/message",jwtverify,getRoomMessage)
RoomRoutes.get("/:joinid/members",jwtverify,getroomMembers)
RoomRoutes.get("/:joinid/activemember",jwtverify,getactivemembers)
RoomRoutes.delete("/:joinid/leave",jwtverify,leaveroom)
RoomRoutes.delete("/:joinid/remove/:delid",jwtverify,memberremove)
RoomRoutes.post("/upload",upload.single('image'),imageupload)

// Helper: follows HTTP redirects (Cloudinary raw URLs redirect to CDN)
function fetchWithRedirect(url, res, filename, maxRedirects = 5) {
    if (maxRedirects === 0) {
        return res.status(500).json({ message: 'Too many redirects' });
    }
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (fileStream) => {
        // Follow redirects
        if (fileStream.statusCode >= 300 && fileStream.statusCode < 400 && fileStream.headers.location) {
            return fetchWithRedirect(fileStream.headers.location, res, filename, maxRedirects - 1);
        }
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
        res.setHeader('Content-Type', fileStream.headers['content-type'] || 'application/octet-stream');
        if (fileStream.headers['content-length']) {
            res.setHeader('Content-Length', fileStream.headers['content-length']);
        }
        fileStream.pipe(res);
    }).on('error', (err) => {
        console.error('Download proxy error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to download file' });
        }
    });
}

// Proxy route: fetches file from Cloudinary server-side and sends it to the browser with correct download headers
// No jwtverify here — browser link clicks can't send Authorization headers
RoomRoutes.get("/download", (req, res) => {
    const { url, filename } = req.query;
    if (!url) return res.status(400).json({ message: "URL is required" });
    const decodedUrl = decodeURIComponent(url);
    fetchWithRedirect(decodedUrl, res, filename);
})

module.exports=RoomRoutes

