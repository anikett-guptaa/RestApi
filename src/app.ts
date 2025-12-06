/* eslint-disable @typescript-eslint/no-unused-vars */
import express, {NextFunction,Request,Response} from 'express'
import connectDB from './config/db';
import globalErrorHandler from './middlewares/globalErrorHandler';
import userRouter from './user/userRouter';
import bookRouter from './book/bookRouter';

const app=express();
connectDB()
app.use(express.json());

app.get('/',(req,res,next)=>{
    
    
    res.json(`message:"hey we are testing"`)
})


app.use("/api/users",userRouter);
app.use('/api/books',bookRouter);


app.use(globalErrorHandler);

export default app;