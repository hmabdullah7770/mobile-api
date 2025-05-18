import 'dotenv/config'
import { DB_CONNECTTION } from "./db/index.js";
//import express from 'express'
import app from './app.js'


// const app = express()

DB_CONNECTTION().then(() =>
    app.listen(process.env.PORT || 4000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
)
    .catch((error) => {
        console.log('ERROR :', error)
        process.exit(1)


    })


app.get('/',(req,res) =>{
    res.send('hello ')
})