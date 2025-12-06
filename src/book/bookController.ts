/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import cloudinary from '../config/cloudinary'
import path from 'path'

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  // const {} =req.body;

  console.log('files', req.files)

  const files = req.files as { [fieldname: string]: Express.Multer.File[] }

  if (!files?.coverImage?.[0]?.filename) {
    throw new Error('Cover image is required')
  }

  const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1)!
  const fileName = files.coverImage[0].filename // now guaranteed string
  const filePath = path.resolve(
    __dirname,
    '../../public/data/Uploads',
    fileName
  )

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
    '../../public/data/Uploads',
    fileName
  )

  const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath,{
    resource_type: 'raw',
    filename_override: bookFileName,
    folder: "book-pdfs",
    format: "pdf",
  })

  console.log('UploadResult', uploadResult)
  res.json({})
}

export { createBook }
