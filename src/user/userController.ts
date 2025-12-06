/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import userModel from './userModel'
import bcrypt from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { config } from '../config/config'
import { User } from './userTypes'

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body
  //validation
  if (!name || !email || !password) {
    const error = createHttpError(400, 'All the fields are required')
    return next(error)
  }

  //DB call
  try {
    const user = await userModel.findOne({ email })

    if (user) {
      const error = createHttpError(400, 'User already exists with this email.')
      return next(error)
    }
  } catch (err) {
    return next(createHttpError(500, 'Error while getting user'))
  }

  //password-hash
  const hashedPassword = await bcrypt.hash(password, 10)

  let newUser: User

  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    })
  } catch (err) {
    return next(createHttpError(500, 'Error while creating user'))
  }

  //token generation

  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: '7d',
      algorithm: 'HS256',
    })

    res.status(201).json({ accessToken: token })
  } catch (err) {
    return next(createHttpError(500, 'Error while signing the jwt token'))
  }
}

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  //validation

  if (!email || !password) {
    const error = createHttpError(400, 'All the fields are required')
    return next(error)
  }

  try {
  const user = await userModel.findOne({ email })

  if (!user) {
    return next(createHttpError(404, 'User does not exist with this email.'))
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return next(createHttpError(400, 'Username or password incorrect'))
  }

  const token = sign(
    { sub: user._id },
    config.jwtSecret as string,
    { expiresIn: '7d', algorithm: 'HS256' }
  )

  return res.status(200).json({ accessToken: token })
} catch (err) {
  console.error(err)
  return next(createHttpError(500, 'Internal server error'))
}
}

export { createUser }
export { loginUser }
