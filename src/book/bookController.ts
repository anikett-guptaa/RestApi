/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import cloudinary from '../config/cloudinary'
import path from 'path'
import createHttpError from 'http-errors'
import bookModel from './bookModel'
import * as fs from 'node:fs';
import { AuthRequest } from '../middlewares/authenticate'


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

  const bookFileName = files.file[0].filename 

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

  const _req = req as AuthRequest;
  const newBook = await bookModel.create({
    title ,
    genre ,
    author: _req.userId,
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

type MulterFiles = { [fieldname: string]: Express.Multer.File[] };

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, genre } = req.body;
    const bookId = req.params.bookId;

    try {
        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            return next(createHttpError(404, "Book not found"));
        }
        
       
        const _req = req as AuthRequest;
        if (book.author.toString() !== _req.userId) {
            return next(createHttpError(403, "You can not update others book."));
        }

        
        const files = (req.files as MulterFiles | undefined) || {};

        
        let completeCoverImage = "";
        if (files.coverImage && files.coverImage.length > 0) {
            
            const coverFile: Express.Multer.File = files.coverImage[0]!; 
            const filename = coverFile.filename;
            
            
            const converMimeType = coverFile.mimetype.split("/").at(-1) ?? 'jpeg'; 
            
            
            const filePath = path.resolve(
                __dirname,
                "../../public/data/uploads/" + filename
            );
            completeCoverImage = filename;
            
            // Upload to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(filePath, {
                filename_override: completeCoverImage,
                folder: "book-covers",
                format: converMimeType,
            });

            completeCoverImage = uploadResult.secure_url;
            await fs.promises.unlink(filePath); // Clean up local file
        }

        // Handle Book File Upload
        let completeFileName = "";
        if (files.file && files.file.length > 0) {
            
            const bookFile: Express.Multer.File = files.file[0]!; 
            const bookFileName = bookFile.filename;
            completeFileName = bookFileName;
            
            const bookFilePath = path.resolve(
                __dirname,
                "../../public/data/uploads/" + bookFileName
            );
            
            // Upload to Cloudinary
            const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
                resource_type: "raw", 
                filename_override: completeFileName,
                folder: "book-pdfs",
                format: "pdf",
            });

            completeFileName = uploadResultPdf.secure_url;
            await fs.promises.unlink(bookFilePath); 
        }

        // Update the Book in the Database
        const updatedBook = await bookModel.findOneAndUpdate(
            { _id: bookId },
            {
                title: title,
                description: description,
                genre: genre,
                
                coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
                file: completeFileName ? completeFileName : book.file,
            },
            { new: true }
        );

        res.json(updatedBook);

    } catch (err) {
        console.error("Error in updateBook:", err);
        return next(createHttpError(500, "Error while updating the book."));
    }
};


 const listBooks = async (req: Request, res: Response, next: NextFunction) => {
   
    try {
        const books = await bookModel.find().populate("author", "name");
        res.json(books);
    } catch (err) {
        console.error("Error in listBooks:", err);
        return next(createHttpError(500, "Error while getting books list"));
    }
};


const getSingleBook = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const bookId = req.params.bookId;

    try {
        const book = await bookModel
            .findOne({ _id: bookId })
            .populate("author", "name");

        if (!book) {
            return next(createHttpError(404, "Book not found."));
        }

        return res.json(book);
    } catch (err) {
        console.error("Error in getSingleBook:", err);
        return next(createHttpError(500, "Error while getting a book"));
    }
};


 const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
    const bookId = req.params.bookId;

    try {
        const book = await bookModel.findOne({ _id: bookId });
        if (!book) {
            return next(createHttpError(404, "Book not found"));
        }

        
        const _req = req as AuthRequest;
      
        if (book.author.toString() !== _req.userId) {
            return next(createHttpError(403, "You can not delete others book."));
        }
        
       
        const coverFileSplits = book.coverImage.split("/");
        
       
        const lastPart = coverFileSplits.at(-1)!; 
        const folderName = coverFileSplits.at(-2)!;

        
        const coverImagePublicId = folderName + "/" + lastPart.split(".").at(-2)!;
        
        const bookFileSplits = book.file.split("/");
        
        const bookFilePublicId = 
             bookFileSplits.at(-2)! + "/" + bookFileSplits.at(-1)!;
        
       
        try {
            await cloudinary.uploader.destroy(coverImagePublicId);
            await cloudinary.uploader.destroy(bookFilePublicId, {
                resource_type: "raw", 
            });
        } catch (cloudinaryErr) {
            
            console.error("Cloudinary deletion failed:", cloudinaryErr);
        }
        
        
        await bookModel.deleteOne({ _id: bookId });

        return res.sendStatus(204); 
        
    } catch (err) {
        console.error("Error in deleteBook:", err);
        return next(createHttpError(500, "Error while deleting the book."));
    }
};


export { createBook, updateBook, listBooks, getSingleBook, deleteBook };