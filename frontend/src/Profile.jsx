import React, { useEffect, useContext, useState } from "react";
import {useNavigate} from "react-router-dom"
import {UserContext} from "./User"
import api from './api'
function Profile() {
  const navigate = useNavigate();
  
  const { user, setUser, loading } = useContext(UserContext)
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.userName || "");
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [picUrl, setPicUrl] = useState(user?.profilepic || "");
  const token=localStorage.getItem('token')

  useEffect(() => {
    if (user) {
      setNewUsername(user.userName || "");
      setPicUrl(user.profilepic || "");
    }
  }, [user]);
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border"></div>
      </div>
    );
  }

  const prof = user;

  async function handlelogout(){
    try {
      await api.post("/auth/logout");
      console.log("[FRONTEND] Backend session and cookie cleared.");
    } catch (err) {
      console.error("[FRONTEND] Failed to clear backend session on logout:", err);
    }
    localStorage.removeItem("token")
    console.log("log-out Success")
    setUser(null)
    navigate("/")
  }

  const handleUpdateClick = async () => {
    // UI-only for now, we will add the fetching logic in the next step
    console.log("Update clicked with new username:", newUsername);
    const id=user._id
    console.log(user)
    const newuser=await api.post(`/user/Profile/${id}`,{
      updatename:newUsername,
    })
    console.log("user:",newuser)
    console.log(newuser)
    setUser(newuser.data)
    setIsEditing(false);
    navigate("/Profile")
  };

  const handleCancelClick = () => {
    setNewUsername(user?.userName || "");
    setIsEditing(false);
  };

  const handleUpdatePicClick = async () => {
    console.log("Update picture URL clicked:", picUrl);
    const id = user._id;
    try {
      const response = await api.post(`/user/Profile/${id}`, {
        profilepic: picUrl,
      });
      setUser(response.data);
      setIsEditingPic(false);
    } catch (err) {
      console.error("Failed to update profile pic:", err);
      alert("Failed to update profile picture.");
    }
  };

  const handleCancelPicClick = () => {
    setPicUrl(user?.profilepic || "");
    setIsEditingPic(false);
  };

  const profileStyles = `
  body {
      background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%) !important;
      background-attachment: fixed !important;
  }
  .glass-card {
      background: rgba(255, 255, 255, 0.45) !important;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.55) !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
      border-radius: 16px;
  }
  .glass-header {
      background: rgba(255, 255, 255, 0.25) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
  }
  .profile-avatar {
      border: 3px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      object-fit: cover;
  }
  .glass-item {
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  .btn-glass-home {
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(5px);
      transition: all 0.2s ease;
      font-weight: 500;
  }
  .btn-glass-home:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: translateY(-1px);
  }
  `;

  return (
    <>
      <style>{profileStyles}</style>
      <div className="container mt-4">
        {/* Navigation Link to Home */}
        <div className="mb-4 d-flex justify-content-start">
          <button 
            className="btn btn-glass-home d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
            onClick={() => navigate("/Home")}
          >
            <span>🏠</span> Back to Dashboard
          </button>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card glass-card border-0">
              
              {/* Header */}
              <div className="card-header glass-header text-center py-4">
                <div className="position-relative d-inline-block">
                  <img
                    src={prof.profilepic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${prof.userName}`}
                    alt="avatar"
                    className="rounded-circle profile-avatar"
                    width="120"
                    height="120"
                  />
                  {!isEditingPic && (
                    <button 
                      className="btn btn-sm btn-light position-absolute bottom-0 end-0 rounded-circle shadow-sm p-1 d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', border: '1px solid #ddd', cursor: 'pointer' }}
                      onClick={() => setIsEditingPic(true)}
                      title="Edit Profile Picture"
                    >
                      📷
                    </button>
                  )}
                </div>

                {isEditingPic && (
                  <div className="mt-3 px-4 d-flex flex-column align-items-center gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Paste Image URL here..."
                      value={picUrl}
                      onChange={(e) => setPicUrl(e.target.value)}
                      style={{ maxWidth: '300px', borderRadius: '8px' }}
                    />
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={handleUpdatePicClick}>
                        Save Pic
                      </button>
                      <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={handleCancelPicClick}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <h3 className="mt-3 fw-bold text-dark">{prof.userName}</h3>
                <p className="text-secondary mb-0">{prof.usergmail}</p>
              </div>

              {/* Details Body */}
              <div className="card-body p-4">
                
                <div className="glass-item flex-column align-items-stretch">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-secondary d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong>
                      {!isEditing ? (
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-dark">{prof.userName}</span>
                          <button 
                            className="btn p-0 border-0" 
                            style={{ background: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                            onClick={() => setIsEditing(true)}
                            title="Edit Username"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2 mt-1">
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={newUsername} 
                            onChange={(e) => setNewUsername(e.target.value)}
                            style={{ maxWidth: '220px', borderRadius: '8px' }}
                            placeholder="Enter new username"
                          />
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={()=>{
                              handleUpdateClick()
                            }
                          }>
                              Update
                            </button>
                            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={()=>{handleCancelClick()}}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!isEditing && <span className="text-muted fs-5">👤</span>}
                  </div>
                </div>

                <div className="glass-item">
                  <div>
                    <strong className="text-secondary d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</strong>
                    <span className="fw-semibold text-dark">{prof.usergmail}</span>
                  </div>
                  <span className="text-muted fs-5">✉️</span>
                </div>

                <div className="glass-item">
                  <div>
                    <strong className="text-secondary d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Type</strong>
                    <span className="badge bg-secondary-subtle text-dark-emphasis fw-bold" style={{ fontSize: '0.85rem' }}>{prof.provider}</span>
                  </div>
                  <span className="text-muted fs-5">🛡️</span>
                </div>

                <div className="glass-item">
                  <div>
                    <strong className="text-secondary d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                    <span className="badge bg-success shadow-sm" style={{ fontSize: '0.85rem' }}>Active</span>
                  </div>
                  <span className="text-muted fs-5">🟢</span>
                </div>

                <hr className="my-4" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />

                <button
                  className="btn btn-danger w-100 py-2 fw-semibold rounded-pill shadow-sm"
                  style={{ letterSpacing: '0.5px' }}
                  onClick={() => handlelogout()}
                >
                  Logout from Session
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
