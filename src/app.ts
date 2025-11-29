/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express'

const app=express();


app.get('/',(req,res,next)=>{
    res.json(`message:"hey we are testing"`)
})


export default app;