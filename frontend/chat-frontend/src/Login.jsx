import React, { useState, useContext } from 'react';
import axios from 'axios'
import {useNavigate} from 'react-router-dom'
import {UserContext} from "./User"

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [gmail,setgmail]=useState(null)
  const [pass,setpass]=useState(null)
  const navigate=useNavigate()
  const { setUser } = useContext(UserContext)


  async function checkSignUp (e){ 
    e.preventDefault()
    try{
        const data=await axios.post("http://localhost:3000/auth/signup",
          {
          username:gmail,
          password:pass
          }
          
        )
        console.log(data)
        if (data.status===201){
          alert("Account Created Succcessfully")
          navigate("/")
        }
  
        }
    catch(err){
      console.log(err)
    }
  }
     
  

  async function Signin(e){
    e.preventDefault()

    try{
        const data=await axios.post("http://localhost:3000/auth/login",
          {usergmail:gmail,
          password:pass
          }
        )
        if (data.status===200){
          localStorage.setItem(
            "token",
            data.data.token
        );
          setUser(data.data.user);
          alert("Logging you in")
          navigate("/Profile")
         
        }
        
        console.log(data)
          
        }
    catch(err){
      console.log(err)
    }
  }
  

  return (
    <center>
      <div className="m-3">

        {/* Toggle Bar */}
        <div
          style={{
            display: "flex",
            width: "300px",
            marginBottom: "20px",
            border: "1px solid #ccc",
            borderRadius: "25px",
            overflow: "hidden"
          }}
        >
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: "10px",
              background: isLogin ? "#ddd" : "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: "10px",
              background: !isLogin ? "#ddd" : "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={Signin}>
            <h1>Login</h1>

            <section>
              <label>Username</label>
              <br />
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                onChange={(e)=>{
                  setgmail(e.target.value)
                  console.log(gmail)
                }}
              />
            </section>

            <section>
              <label>Password</label>
              <br />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                onChange={(e)=>{
                  setpass(e.target.value)
                  console.log(pass)

                }}
              />
            </section>

            <button type="submit" >Login</button>
          </form>
        ) : (
          <form onSubmit={checkSignUp}>
            <h1>Sign Up</h1>

            <section>
              <label>Username</label>
              <br />
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                onChange={(e)=>{
                  setgmail(e.target.value)
                  console.log(gmail)
                }}
              />
            </section>

            <section>
              <label>Password</label>
              <br />
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                required
                onChange={(e)=>{
                  setpass(e.target.value)
                  console.log(pass)

                }}
              />
            </section>

            <button type="submit" >
             Sign Up</button>
          </form>
        )}
        <div>
          <button className="btn btn-primary"
          onClick={() => {
                window.location.href =
                  "http://localhost:3000/auth/google";
  }}>Login With Google</button>
        </div>

      </div>
    </center>
  );
}

export default Login;