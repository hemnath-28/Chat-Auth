const mongoose=require('mongoose')


// Exporting Mongo Db Connection to Server.js
const connect=async()=>{
    let connection=await mongoose.connect(process.env.MONGO_URL).then(
    console.log("Connected to Db")
).catch((err)=>{
    console.log(err)
})
return connection
}

module.exports=connect
