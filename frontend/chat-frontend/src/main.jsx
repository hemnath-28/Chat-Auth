import { StrictMode, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter,createBrowserRouter,RouterProvider } from 'react-router-dom'

import Login from "./Login"
import Profile from './Profile'
import OAuthSuccess from "./OAuthSuccess"
import Home from "./Home"


import {UserProvider} from "./User"


const router=createBrowserRouter([{
  path:"/",
  element:<Login/>
},
{
  path:"/Profile",
  element:<Profile/>
},
{
    path: "/oauth-success",
    element: <OAuthSuccess />
},
{
  path:"/Profile",
  element:<Profile/>
},
{
  path:"/Home",
  element:<Home/>
}
  
])
createRoot(document.getElementById('root')).render(
    <UserProvider >
      <RouterProvider router={router} />
    </UserProvider>
)
