import React, { useContext } from 'react'
import api from "./api"
import {io} from 'socket.io-client'
import {useParams, useNavigate} from 'react-router-dom'
import {UserContext} from "./User"
import { useEffect,useState,useRef } from 'react'
const socket=io("http://localhost:3000", { autoConnect: false })
  function Chat() {
    const [typingUsers, setTypingUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const {roomid}=useParams()
    const navigate=useNavigate();
    const token=localStorage.getItem('token')
    const {user, loading}=useContext(UserContext)
    const [messages, setMessages] = useState([]);
    const [typedText, setTypedText] = useState("");
    const [activeMembers, setActiveMembers] = useState([]);
    const [totalMembers, setTotalMembers] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);      // true if current user is room admin
    const [adminId, setAdminId] = useState(null);        // stores the admin's user ID
    const [copied, setCopied] = useState(false);        // true when join code is copied to clipboard
    const typingTimer = useRef(null)
    console.log(user)
    useEffect(() => {
        if (!loading && !user) {
            navigate("/");
        }
    }, [user, loading, navigate]);

    useEffect(()=>{
      if (loading || !user){
        return 
      }
     
      socket.connect()
      socket.emit("user_connected",{
        id:user._id,
        name:user.userName
      }) 
      socket.emit("join_room", roomid);

      const fetchhistory=async ()=>{
        try{
          console.log(`http://localhost:3000/room/${roomid}/message`)
          const response=await api.get(`/room/${roomid}/message`)
          setMessages(response.data)

          // Fetch all room members
          const membersResponse=await api.get(`/room/${roomid}/members`)
          console.log("total Members:", membersResponse)
          setTotalMembers(membersResponse.data.people.members || [])

          // Admin is already returned in the members response — no extra API call needed
          const roomAdminId = membersResponse.data.people.admin?._id
          setAdminId(roomAdminId)
          setIsAdmin(roomAdminId === user?._id)

          // Fetch online active members
          const activeusers=await api.get(`/room/${roomid}/activemember`)
          console.log("Active Users:", activeusers)
          setActiveMembers(activeusers.data);
        }
        catch(err){
          console.log("error while fetching message",err)
        }
      }

      fetchhistory()
      socket.on("alert",(msg)=>{
        console.log("in the alert section",msg)
        alert(msg.message)
      })
      socket.on('receive_message',(incomingMessage)=>{
        setMessages((prev)=>[...prev,incomingMessage])
      });
      socket.on("user-joined",(msg)=>{
        console.log("User joined:", msg)
        fetchhistory()
      })

      socket.on("user-left",(msg)=>{
        console.log("User left:", msg)
        fetchhistory()
      })
        socket.on("UserTyping", (username) => {
            console.log("in user typing", username)
            setTypingUsers((prev) => {
                if (prev.includes(username)) return prev;
                return [...prev, username];
            });
        });

        socket.on("UserStopped", (username) => {
            console.log("user stopped typing", username)
            setTypingUsers((prev) => prev.filter((name) => name !== username));
        });

        // If this user was removed by admin, navigate them to Home
        socket.on("you_were_removed", ({ removedUserId }) => {
            if (user && removedUserId === user._id) {
                alert("You have been removed from this room by the admin.")
                navigate("/Home")
            } else {
                // Refresh member list for others in the room
                setTotalMembers(prev => prev.filter(m => m.userId?._id !== removedUserId))
                setActiveMembers(prev => prev.filter(m => m.userId?._id !== removedUserId))
            }
        })

      return () => {
        console.log("Cleaning up socket listeners...");
        socket.disconnect();
        socket.off("alert");
        socket.off("receive_message");
        socket.off("user-joined");
        socket.off("user-left");
        socket.off("UserTyping");
        socket.off("UserStopped");
        socket.off("you_were_removed");
      }
    },[roomid,user,token])

    // Backend proxy download — avoids CORS issues with Cloudinary raw files
    const handleDownload = (url, filename) => {
        const proxyUrl = `http://localhost:3000/room/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'download')}`;
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Admin: remove a member from the room
    const handleRemoveMember = async (memberId) => {
        try {
            await api.delete(`/room/${roomid}/remove/${memberId}`)
            // Notify the removed user via socket to navigate home
            socket.emit("remove_member", { roomid, removedUserId: memberId })
            // Remove from local state immediately
            setTotalMembers(prev => prev.filter(m => m.userId?._id !== memberId))
            setActiveMembers(prev => prev.filter(m => m.userId?._id !== memberId))
        } catch (err) {
            console.error("Failed to remove member:", err)
            alert("Failed to remove member. Make sure you are the admin.")
        }
    };

    const handleCopyJoinCode = () => {
        navigator.clipboard.writeText(roomid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!typedText.trim() && !selectedFile) return;

        let uploadfileurl = null;
        let uploadfiletype = null;

        // Clear typing indicator instantly when sending a message
        clearTimeout(typingTimer.current);
        socket.emit("stoptyping", {
            roomid: roomid,
            username: user.userName
        });

        if (selectedFile){
            const formData=new FormData()
            formData.append('image',selectedFile)
            try{
                const Response=await api.post("/room/upload",formData,{
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                })
                const uploadResult = Response.data.message || Response.data;
                uploadfileurl = uploadResult.url;
                uploadfiletype = selectedFile.type.startsWith('image/') ? 'image' : 'file';
            }
            catch(err){
                console.log(err)
            }
        }

        let messagePayload;

        if (!selectedFile){
            messagePayload = {
                joinid: roomid,
                sender: user?._id,
                content: typedText,
                fileUrl: null,
                fileType: null  
            };
            socket.emit("send_message", messagePayload);
            setTypedText("");
            return;
        } else {
            messagePayload = {
                joinid: roomid,
                sender: user?._id,
                content: typedText || selectedFile.name,
                fileUrl: uploadfileurl,
                fileType: uploadfiletype  
            };
        }

        socket.emit("send_message", messagePayload);
        setTypedText("");
        setSelectedFile(null); // Clear selected file after sending
    };

    if (loading || !user) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border"></div>
            </div>
        );
    }
    async function handleleaveroom(){
        try{
            const leave=await api.delete(`/room/${roomid}/leave`)
            console.log(leave)
            navigate("/Home")
        }
        catch(err){
            console.error("Error leaving room:", err)
            alert(err.response?.data?.message || "Failed to leave the room")
            
        }
    }

    const sidebarStyles = `
    body {
        background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%) !important;
        background-attachment: fixed !important;
    }
    .members-sidebar {
        width: 60px;
        height: 100%;
        overflow: hidden;
        transition: width 0.3s ease;
        background: rgba(255, 255, 255, 0.45);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.55) !important;
        border-right: 1px solid rgba(255, 255, 255, 0.4) !important;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        white-space: nowrap;
    }
    .members-sidebar:hover {
        width: 280px;
        background: rgba(255, 255, 255, 0.75);
    }
    .chat-box-glass {
        background: rgba(255, 255, 255, 0.45) !important;
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.55) !important;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
    }
    .members-collapsed-title {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 20px 0;
        cursor: default;
    }
    .vertical-text {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        letter-spacing: 3px;
        font-size: 0.85rem;
        font-weight: 700;
        color: #6c757d;
        text-transform: uppercase;
        margin-top: 12px;
    }
    .members-sidebar:hover .members-collapsed-title {
        display: none;
    }
    .members-expanded-content {
        display: none;
        width: 100%;
        height: 100%;
    }
    .members-sidebar:hover .members-expanded-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 15px;
        white-space: normal;
    }
    .members-scroll-area {
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 10px;
        padding-right: 4px;
    }
    .members-scroll-area::-webkit-scrollbar {
        width: 4px;
    }
    .members-scroll-area::-webkit-scrollbar-track {
        background: transparent;
    }
    .members-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
    }
    .members-scroll-area::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
    }
    .member-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 6px;
        transition: background-color 0.2s;
    }
    .member-item:hover {
        background-color: rgba(255, 255, 255, 0.5);
    }
    .avatar-container {
        position: relative;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
    }
    .avatar-img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status-badge {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid #fff;
    }
    .status-online {
        background-color: #198754;
    }
    .status-offline {
        background-color: #6c757d;
    }
    `;

    return (
        <div className="container-fluid mt-4 d-flex gap-4 px-4" style={{ height: '80vh' }}>
            <style>{sidebarStyles}</style>

            {/* Left Side: Hoverable Members Drawer */}
            <div className="members-sidebar rounded border">
                {/* Collapsed state display */}
                <div className="members-collapsed-title">
                    {/* Home Link (Collapsed) */}
                    <button 
                        className="btn btn-sm btn-outline-secondary mb-3 rounded-circle" 
                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => navigate("/Home")}
                        title="Go to Home"
                    >
                        🏠
                    </button>
                    
                    <span style={{ fontSize: '1.4rem' }}>👥</span>
                    <span className="badge bg-success rounded-circle px-2 py-1" style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                        {activeMembers.length}
                    </span>
                    <div className="vertical-text">Members</div>

                    {/* Copy Join Code Button (Collapsed) */}
                    <div className="mt-auto">
                        <button 
                            className={`btn btn-sm ${copied ? 'btn-success text-white' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`} 
                            style={{ width: '36px', height: '36px', transition: 'all 0.2s' }}
                            onClick={handleCopyJoinCode}
                            title="Copy Room Join Code"
                        >
                            {copied ? '✓' : '🔗'}
                        </button>
                    </div>
                </div>

                {/* Expanded hover state display */}
                <div className="members-expanded-content">
                    {/* Home Link (Expanded) */}
                    <button 
                        className="btn btn-outline-dark btn-sm w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => 
                            navigate("/Home")
                        }
                    >
                        <span>🏠</span> Go to Home
                    </button>

                    {/* Scrollable members list */}
                    <div className="members-scroll-area">
                        {/* Active members */}
                        <div className="mb-4">
                            <h5 className="border-bottom pb-2 text-success" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                Active Members ({activeMembers.length})
                            </h5>
                            <div className="d-flex flex-column gap-2">
                                {activeMembers.map((member) => {
                                    const u = member.userId;
                                    if (!u) return null;
                                    return (
                                        <div key={u._id} className="member-item">
                                            <div className="avatar-container">
                                                <img 
                                                    src={u.profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.userName}`} 
                                                    alt={u.userName} 
                                                    className="avatar-img"
                                                />
                                                <span className="status-badge status-online"></span>
                                            </div>
                                            <span className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>
                                                {u.userName}
                                            </span>
                                        </div>
                                    );
                                })}
                                {activeMembers.length === 0 && (
                                    <small className="text-muted text-center py-2">No active members</small>
                                )}
                            </div>
                        </div>

                        {/* Total members */}
                        <div>
                            <h5 className="border-bottom pb-2 text-secondary" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                All Members ({totalMembers.length})
                            </h5>
                            <div className="d-flex flex-column gap-2">
                                {totalMembers.map((member) => {
                                    const u = member.userId;
                                    if (!u) return null;
                                    const isOnline = activeMembers.some(active => active.userId?._id === u._id);
                                    const isMemberAdmin = u._id === adminId;           // is this member the admin?
                                    const isCurrentUser = u._id === user?._id;         // is this member the logged-in user?
                                    return (
                                        <div key={u._id} className="member-item" style={{ justifyContent: 'space-between' }}>
                                            <div className="d-flex align-items-center gap-2" style={{ overflow: 'hidden' }}>
                                                <div className="avatar-container">
                                                    <img 
                                                        src={u.profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.userName}`} 
                                                        alt={u.userName} 
                                                        className="avatar-img"
                                                    />
                                                    <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}></span>
                                                </div>
                                                <div className="d-flex flex-column overflow-hidden">
                                                    <span className="fw-semibold text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                                                        {u.userName}
                                                        {/* 👑 Crown badge for admin */}
                                                        {isMemberAdmin && (
                                                            <span 
                                                                title="Room Admin"
                                                                style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg,#f6d365,#fda085)', color: '#fff', borderRadius: '4px', padding: '0px 5px', fontWeight: '700', letterSpacing: '0.3px', flexShrink: 0 }}
                                                            >
                                                                👑 Admin
                                                            </span>
                                                        )}
                                                    </span>
                                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            </div>

                                            {/* 🔴 Remove button — only visible to admin, hidden on themselves and on the admin row */}
                                            {isAdmin && !isCurrentUser && !isMemberAdmin && (
                                                <button
                                                    className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                                                    style={{ width: '26px', height: '26px', padding: 0, borderRadius: '6px', flexShrink: 0 }}
                                                    title={`Remove ${u.userName}`}
                                                    onClick={() => handleRemoveMember(u._id)}
                                                >
                                                    <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>✕</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                {totalMembers.length === 0 && (
                                    <small className="text-muted text-center py-2">No members</small>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Copy Join Code Button (Expanded) */}
                    <div className="mt-auto border-top pt-3">
                        <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Room Join Code</small>
                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                            <code className="text-primary fw-bold" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>{roomid}</code>
                            <button 
                                onClick={handleCopyJoinCode} 
                                className={`btn btn-sm ${copied ? 'btn-success text-white' : 'btn-outline-primary'} d-flex align-items-center justify-content-center p-0`}
                                title="Copy Room Join Code"
                                style={{ width: '28px', height: '28px', borderRadius: '4px', transition: 'all 0.2s' }}
                            >
                                <span style={{ fontSize: '0.85rem' }}>{copied ? '✓' : '📋'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Main Chat Feed and Input */}
            <div className="d-flex flex-column flex-grow-1" style={{ height: '100%' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="m-0">Chat Room</h3>
                    <button 
                        className="btn btn-danger btn-sm px-3"
                        onClick={() =>
                            handleleaveroom()
                        }
                    >
                        Leave Room
                    </button>
                </div>
                
                {/* Messages Feed Container */}
                <div className="flex-grow-1 overflow-auto border rounded p-3 chat-box-glass mb-3" style={{ minHeight: '400px' }}>
                    {messages.map((msg) => (
                        <div 
                            key={msg._id} 
                            className={`d-flex mb-2 ${user && msg.sender._id === user._id ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                            <div className={`p-2 rounded max-w-75 ${user && msg.sender._id === user._id ? 'bg-primary text-white' : 'bg-secondary-subtle text-dark'}`}>
                                <small className="d-block fw-bold border-bottom pb-1 mb-1" style={{ fontSize: '0.75rem' }}>
                                    {msg.sender.userName}
                                </small>
                                {msg.fileUrl ? (
                                    // Ensure documents (PDF, Doc, Txt) are not treated as images even if they have an image fileType
                                    !/\.(pdf|doc|docx|txt)$/i.test(msg.fileUrl) &&
                                    !/\.(pdf|doc|docx|txt)$/i.test(msg.content) &&
                                    (msg.fileType === 'image' || 
                                     (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(msg.fileUrl)) ||
                                     (msg.content && /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(msg.content))) ? (
                                        <div className="mt-1">
                                            <img 
                                                src={msg.fileUrl} 
                                                alt="Uploaded file" 
                                                className="img-fluid rounded mb-1" 
                                                style={{ maxHeight: '200px', objectFit: 'contain', cursor: 'pointer' }}
                                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                            />
                                            {msg.content && <p className="mb-0 small">{msg.content}</p>}
                                        </div>
                                    ) : (
                                        <div className="mt-1">
                                            <button 
                                                onClick={() => handleDownload(msg.fileUrl, msg.content)}
                                                className={`btn btn-sm ${user && msg.sender._id === user._id ? 'btn-light text-dark' : 'btn-outline-primary'} d-inline-flex align-items-center gap-1`}
                                            >
                                                📄 Download {msg.content}
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <p className="mb-0">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="text-muted small mb-2 px-1" style={{ transition: 'opacity 0.2s' }}>
                        ✍️ <em>
                            {typingUsers.length === 1 
                                ? `${typingUsers[0]} is typing...` 
                                : typingUsers.length === 2 
                                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...` 
                                : "Several people are typing..."
                            }
                        </em>
                    </div>
                )}

                {/* Staged File Preview */}
                {selectedFile && (
                    <div className="d-flex align-items-center gap-2 mb-2 p-2 bg-light border rounded" style={{ maxWidth: 'fit-content' }}>
                        <span>📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        <button 
                            type="button" 
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            onClick={() => setSelectedFile(null)}
                            style={{ lineHeight: '1', fontSize: '0.8rem', padding: '1px 5px' }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} className="d-flex gap-2 align-items-center">
                    <input 
                        type="file" 
                        id="fileInput" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {setSelectedFile(e.target.files[0])
                            console.log(selectedFile)
                        }}
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.txt,.pdf,.doc,.docx,.py,.java,.c,.cpp,.js,.ts,.json,.xml,.csv,.html,.css"
                    />
                    <input 
                        type="text" 
                        className="form-control flex-grow-1"
                        placeholder="Write a message..."
                        value={typedText}
                        onChange={(e) => {
                            setTypedText(e.target.value)
                            
                            socket.emit("typing",({
                                roomid:roomid,
                                username:user.userName
                            }))
                            clearTimeout(typingTimer.current)
                            typingTimer.current = setTimeout(() => {
                                socket.emit("stoptyping",{
                                    roomid:roomid,
                                    username:user.userName
                                });
                            }, 3000);
                        }}
                    />
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                        onClick={() => document.getElementById('fileInput').click()}
                        title="Upload file or image"
                    >
                        📎
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ height: '40px', borderRadius: '8px' }}>Send</button>
                </form>
            </div>
        </div>
    );
}

export default Chat