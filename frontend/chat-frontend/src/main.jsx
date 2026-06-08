import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from "./Login"
import { BrowserRouter,createBrowserRouter,RouterProvider } from 'react-router-dom'
import Profile from './Profile'
import OAuthSuccess from "./OAuthSuccess"
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
}
  
])
createRoot(document.getElementById('root')).render(
  
    <RouterProvider router={router}/>
  
)
