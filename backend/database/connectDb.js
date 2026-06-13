const mongoose=require('mongoose')
MONGO_URL="mongodb://hemnath_db_user:hemnath28@ac-9gowhx9-shard-00-00.ss0xphx.mongodb.net:27017,ac-9gowhx9-shard-00-01.ss0xphx.mongodb.net:27017,ac-9gowhx9-shard-00-02.ss0xphx.mongodb.net:27017/?ssl=true&replicaSet=atlas-15nhdy-shard-0&authSource=admin&appName=Cluster0"
const connect=async()=>{
    let connection=await mongoose.connect(process.env.MONGO_URL).then(
    console.log("Connected to Db")
).catch((err)=>{
    console.log(err)
})
return connection
}

module.exports=connect
