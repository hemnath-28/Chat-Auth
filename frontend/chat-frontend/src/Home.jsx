import React, { useContext, useEffect, useState } from 'react'
import api from './api'
import {UserContext} from "./User"
import { useNavigate } from 'react-router-dom'
import './index.css'

function Home() {
    const token=localStorage.getItem('token')
    const [name,setname]=useState("")
    const [roomname,setroomname]=useState("")
    const navigate=useNavigate();
    const [joinid,setjoinid]=useState("5A64WZ")
    const [roomsjoined,setroomsjoined]=useState({ userRooms: [] })
    const { user, loading } = useContext(UserContext)
    
    useEffect(() => {
        if (!loading && !user) {
            navigate("/");
        }
    }, [user, loading, navigate]);

    const getroomsjoined=async ()=>{
        if (!token || !user?._id) return;
        try{
            const joinedroom=await api.get(`/room/getrooms/${user._id}`)
            setroomsjoined(joinedroom.data)
            console.log("rooms joined:",joinedroom.data)
        } catch(err) {
            console.log(err)
        }
    }

    useEffect(() => {
        getroomsjoined()
    }, [token, user]);

    if (loading || !user) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border"></div>
            </div>
        );
    }
    
    async function roomcreate(e){
        e.preventDefault()
        try{
            const response=await api.post("/room/create",
                {
                    roomName:roomname,
                    admin:user._id,
                    member:user._id 
                }
            )
            console.log(response)
            if (response.status==200){
                alert("Room created Successfully")
                getroomsjoined() // refresh the list of rooms in sidebar
            }
        }
        catch(err){
            console.log(err)
        }
    }

    async function handlejoinRoom(e){
        e.preventDefault()
        if (!joinid.trim()) return;
        try{
            console.log("Joining room:", joinid)
            const response=await api.post("/room/join/"+joinid, {})
            console.log("response room:", response)
            // Navigate to the chat page on success
            navigate(`/${joinid}/Chat`)
        }
        catch(err){
            console.log("handle room error in Home.jsx:", err)
            // If the user is already in the room, the server returns 400. Still navigate to the chat page.
            if (err.response && (err.response.status === 400 || err.response.data.message === "You are already in this room!")) {
                navigate(`/${joinid}/Chat`)
            } else {
                alert(err.response?.data?.message || "Failed to join room")
            }
        }
    }

    return (
        <div className="container-fluid p-0 d-flex" style={{ minHeight: '100vh' }}>
            
            {/* Left Sidebar */}
            <div className="bg-dark text-white p-3 d-flex flex-column" style={{ width: '260px', minHeight: '100vh', borderRight: '1px solid #343a40' }}>
                {/* Top Left Profile Section */}
                <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom border-secondary">
                    <img 
                        src={user.profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.userName}`} 
                        alt={user.userName} 
                        className="rounded-circle border border-secondary" 
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                    />
                    <div className="d-flex flex-column overflow-hidden">
                        <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.95rem' }}>{user.userName}</span>
                        <small className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{user.usergmail}</small>
                    </div>
                </div>

                {/* Rooms List */}
                <div className="flex-grow-1 overflow-auto">
                    <h6 className="text-uppercase text-secondary fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                        My Rooms
                    </h6>
                    <div className="d-flex flex-column gap-1">
                        {(roomsjoined.userRooms || []).map((room) => (
                            <div 
                                key={room._id} 
                                className="p-2 rounded text-light cursor-pointer hover-sidebar-item text-truncate d-flex align-items-center gap-2"
                                onClick={() => navigate(`/${room.joinId}/Chat`)}
                            >
                                <span className="text-secondary">#</span>
                                <span className="text-truncate">{room.roomName}</span>
                            </div>
                        ))}
                        {(!roomsjoined.userRooms || roomsjoined.userRooms.length === 0) && (
                            <small className="text-muted text-center py-3">No rooms joined yet.</small>
                        )}
                    </div>
                </div>

                {/* Profile Navigation Footer */}
                <div className="pt-3 border-top border-secondary mt-auto">
                    <button 
                        className="btn btn-outline-light w-100 btn-sm"
                        onClick={() => navigate("/profile")}
                    >
                        View Profile
                    </button>
                </div>
            </div>

            {/* Right Main Content Panel */}
            <div className="flex-grow-1 p-4 bg-light d-flex flex-column justify-content-start align-items-stretch">
                 <div>
                    <h2 className="mb-4">Dashboard</h2>
                    {user && (
                        <div className="alert alert-success shadow-sm">
                            Welcome back, <strong>{user.userName}</strong>! You are logged in as <em>{user.usergmail}</em>.
                        </div>
                    )}
                 </div>

                 <div className="row mt-4">
                     {/* Create Room Card */}
                     <div className="col-md-6 mb-4">
                         <div className="card shadow-sm h-100">
                             <div className="card-body d-flex flex-column">
                                 <h5 className="card-title fw-bold mb-3 text-primary">Create a New Room</h5>
                                 <form onSubmit={roomcreate} className="d-flex flex-column gap-3 mt-auto">
                                     <div>
                                         <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Room Name</label>
                                         <input 
                                             type="text" 
                                             className="form-control" 
                                             placeholder="e.g. General Discussion"
                                             value={roomname}
                                             onChange={(e) => setroomname(e.target.value)}
                                         />
                                     </div>
                                     <button type="submit" className="btn btn-primary w-100">
                                         Create Room
                                     </button>
                                 </form>
                             </div>
                         </div>
                     </div>

                     {/* Join Room Card */}
                     <div className="col-md-6 mb-4">
                         <div className="card shadow-sm h-100">
                             <div className="card-body d-flex flex-column">
                                 <h5 className="card-title fw-bold mb-3 text-danger">Join an Existing Room</h5>
                                 <form onSubmit={handlejoinRoom} className="d-flex flex-column gap-3 mt-auto">
                                     <div>
                                         <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Room ID / Join Code</label>
                                         <input 
                                             type="text" 
                                             className="form-control" 
                                             placeholder="e.g. 5A64WZ"
                                            
                                             onChange={(e) => setjoinid(e.target.value)}
                                         />
                                     </div>
                                     <button type="submit" className="btn btn-danger w-100">
                                         Join Room
                                     </button>
                                 </form>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>

        </div>
    )
}

export default Home
