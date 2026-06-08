import React from 'react'
import {useState,useEffect} from 'react'
import axios from 'axios'
function Profile() {
  const [prof,setprof]=useState("null")
  const token=localStorage.getItem("token")
  console.log(token)
  useEffect(() => {
    
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/user/Profile",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setprof(response.data.user);
        console.log(response) 
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    // 3. Call the function if a token exists
    if (token) {
      fetchProfile();
    }
  }, [token]); 
 
 
 
  return (
    <>
    <div>Profile</div>
    <h1>
      {prof.userName} 
    </h1></>
    
    
  )
}

export default Profile