/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import cloudinary from '../config/cloudinary'
import path from 'path'
import createHttpError from 'http-errors'
import bookModel from './bookModel'
import * as fs from 'node:fs';


const createBook = async (req: Request, res: Response, next: NextFunction) => {
   const {title,genre} =req.body;

  console.log('files', req.files)

  const files = req.files as { [fieldname: string]: Express.Multer.File[] }

  if (!files?.coverImage?.[0]?.filename) {
    throw new Error('Cover image is required')
  }

  const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1)!
  const fileName = files.coverImage[0].filename 
  const filePath = path.resolve(
    __dirname,
    '../../public/data/uploads',
    fileName
  )

  try{

  const uploadResult = await cloudinary.uploader.upload(filePath, {
    filename_override: fileName,
    folder: 'book-cover',
    format: coverImageMimeType,
  })

  if (!files?.file?.[0]?.filename) {
    throw new Error('Book file is required')
  }

  const bookFileName = files.file[0].filename // now guaranteed string

  const bookFilePath = path.resolve(
    __dirname,
    '../../public/data/uploads',
    bookFileName
  )

  const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath,{
    resource_type: 'raw',
    filename_override: bookFileName,
    folder: "book-pdfs",
    format: "pdf",
  });

  console.log('bookFileUploadResult',bookFileUploadResult);

  console.log('UploadResult', uploadResult)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  console.log('userId', req.userId);
  const newBook = await bookModel.create({
    title ,
    genre ,
    author: "69300a84341cc39fea81f1a5",
    coverImage: uploadResult.secure_url,
    file: bookFileUploadResult.secure_url,
  })

  //delete temp files
  await fs.promises.unlink(filePath);
  await fs.promises.unlink(bookFilePath);
  return res.status(201).json({id: newBook._id});

} catch(err){
      console.log(err)
      return next(createHttpError(500,'error while uploading the files'));
}

}

export { createBook }
