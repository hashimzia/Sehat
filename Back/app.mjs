import express from 'express'
import mongoose from 'mongoose';
import './config.mjs';
import './db.mjs';


const app = express()
const port = 3000


console.log(mongoose.connection.readyState);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`backend listening on port ${port}`)
})