
// import  body from "express-validator";
// import validationResult from "express-validator";
// const  {  ValidationChain } = require("express-validator");
import {
  body,
  validationResult,
  type ValidationChain,
} from "express-validator";
import { Request, Response, NextFunction } from "express";


/**
 * Register Validator - validates registration inputs
 */


export const registerValidator = (): ValidationChain[] => [
  body("username", "Please enter username").notEmpty(),
  body("name", "Please enter name").notEmpty(),
  body("password", "Please enter password").notEmpty(),
  body("bio", "Please enter bio").notEmpty(),
];

/**
 * Middleware to handle validation results
 */
export const validateHandle = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  res.status(400).json({ status: "error", message: errorMessages });
};
