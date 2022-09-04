const MONGO_CLIENT = require('mongodb').MongoClient

const state = {
    db : null
}

module.exports = {
    connect : (done)=>{
        const URL = 'mongodb+srv://ajeer:ajeer123@cluster0.un8yp.mongodb.net/?retryWrites=true&w=majority'
        const DB_NAME = "EMARALD"

        MONGO_CLIENT.connect(URL,(err,data)=>{
            if(err){
                return done(err)
            }else{
                state.db = data.db(DB_NAME)
                done()
            }
        })
    },

    get : ()=>{
        return state.db
    }
}

