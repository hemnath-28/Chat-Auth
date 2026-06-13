import React, { useContext } from 'react'
import axios from "axios"
import {io} from 'socket.io-client'
import {useParams, useNavigate} from 'react-router-dom'
import {UserContext} from "./User"
import { useEffect,useState } from 'react'
const socket=io("http://localhost:3000", { autoConnect: false })
  function Chat() {

    const {roomid}=useParams()
    const navigate=useNavigate();
    const token=localStorage.getItem('token')
    const {user, loading}=useContext(UserContext)
    const [messages, setMessages] = useState([]);
    const [typedText, setTypedText] = useState("");
    const [activeMembers, setActiveMembers] = useState([]);
    const [totalMembers, setTotalMembers] = useState([]);

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
      socket.emit("user_connected",user._id) 
      socket.emit("join_room", roomid);

      const fetchhistory=async ()=>{
        try{
          console.log(`http://localhost:3000/room/${roomid}/message`)
          const response=await axios.get(`http://localhost:3000/room/${roomid}/message`,{
            headers:{
              Authorization: `Bearer ${token}`
            }
          })
          setMessages(response.data)

          // Fetch all room members
          const membersResponse=await axios.get(`http://localhost:3000/room/${roomid}/members`,{
            headers:{
              Authorization: `Bearer ${token}`
            }
          })
          console.log("total Members:", membersResponse)
          setTotalMembers(membersResponse.data.people.members || [])

          // Fetch online active members
          const activeusers=await axios.get(`http://localhost:3000/room/${roomid}/activemember`,{
            headers:{
              Authorization: `Bearer ${token}`
            }
          })
          console.log("Active Users:", activeusers)
          setActiveMembers(activeusers.data);
        }
        catch(err){
          console.log("error while fetching message",err)
        }
      }

      fetchhistory()

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

      return ()=>{
        socket.disconnect();
        socket.off("receive_message")
        socket.off("user-joined")
        socket.off("user-left")
      }
    },[roomid,user,token])

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!typedText.trim()) return;

        const messagePayload = {
            joinid: roomid,
            sender: user?._id,
            content: typedText
        };

        socket.emit("send_message", messagePayload);
        setTypedText("");
    };

    if (loading || !user) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border"></div>
            </div>
        );
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
        overflow-y: auto;
        white-space: normal;
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
                    <span style={{ fontSize: '1.4rem' }}>👥</span>
                    <span className="badge bg-success rounded-circle px-2 py-1" style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                        {activeMembers.length}
                    </span>
                    <div className="vertical-text">Members</div>
                </div>

                {/* Expanded hover state display */}
                <div className="members-expanded-content">
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
                                return (
                                    <div key={u._id} className="member-item">
                                        <div className="avatar-container">
                                            <img 
                                                src={u.profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.userName}`} 
                                                alt={u.userName} 
                                                className="avatar-img"
                                            />
                                            <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}></span>
                                        </div>
                                        <div className="d-flex flex-column overflow-hidden">
                                            <span className="fw-semibold text-truncate" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                                                {u.userName}
                                            </span>
                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })}
                            {totalMembers.length === 0 && (
                                <small className="text-muted text-center py-2">No members</small>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Main Chat Feed and Input */}
            <div className="d-flex flex-column flex-grow-1" style={{ height: '100%' }}>
                <h3>Chat Room</h3>
                
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
                                <p className="mb-0">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <input 
                        type="text" 
                        className="form-control"
                        placeholder="Write a message..."
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Send</button>
                </form>
            </div>
        </div>
    );
}

export default Chat