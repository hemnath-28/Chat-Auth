import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom"
import {UserContext} from "./User"
function Profile() {
  const [prof, setprof] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  
  const {setUser} =useContext(UserContext)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/user/Profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          
        );

        setprof(response.data.user);
        setUser(response.data.user);
        
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (!prof) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border"></div>
      </div>
    );
  }

  function handlelogout(){
    localStorage.removeItem("token")
    console.log("log-out Succeess")
    setUser(null)
    navigate("/")
  }

  return (
    <>
    <div>
      <p onClick={()=>{
        navigate("/Home")
      }}>Home Page</p>
    </div>
    <div className="container mt-5">
  <div className="row justify-content-center">
    <div className="col-md-6">

      <div className="card shadow border-0">

        {/* Header */}
        <div className="card-header bg-primary text-white text-center py-4">

          <img
            src={prof.profilepic || "https://ui-avatars.com/api/?name=Hemnath"}
            alt="avatar"
            className="rounded-circle border border-3 border-white"
            width="120"
            height="120"
          />

          <h3 className="mt-3">{prof.userName}</h3>
          <p className="mb-0">{prof.usergmail}</p>

        </div>

        {/* Details */}
        <div className="card-body">

          <div className="mb-3">
            <strong>Username</strong>
            <div className="text-muted">
              {prof.userName}
            </div>
          </div>

          <hr />

          <div className="mb-3">
            <strong>Email</strong>
            <div className="text-muted">
              {prof.usergmail}
            </div>
          </div>

          <hr />

          <div className="mb-3">
            <strong>Account Type</strong>
            <div className="text-muted">
              {prof.provider}
            </div>
          </div>

          <hr />

          <div className="mb-3">
            <strong>Rooms Joined</strong>
            <div className="text-muted">
              {prof.rooms?.length || 0}
            </div>
          </div>

          <hr />

          <div className="mb-4">
            <strong>Status</strong>
            <div>
              <span className="badge bg-success">
                Active
              </span>
            </div>
          </div>

          <button
            className="btn btn-danger w-100"
            onClick={()=>{
              handlelogout()
              }
            }
          >
            Logout
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
