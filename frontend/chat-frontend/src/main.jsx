import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from "./Login"
import { BrowserRouter,createBrowserRouter,RouterProvider } from 'react-router-dom'
import Profile from './Profile'

const router=createBrowserRouter([{
  path:"/",
  element:<Login/>
},
{
  path:"/Profile",
  element:<Profile/>
}
])
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
