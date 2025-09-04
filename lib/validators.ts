import {
  body,
  validationResult,
  ValidationChain,
  Request,
  Response,
  NextFunction,
} from "express-validator";

/**
 * Register Validator - validates registration inputs
 */
export const registerValidator = (): ValidationChain[] => [
  body("username", "Please Enter UserName").notEmpty(),
  body("name", "Please Enter Name").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  body("bio", "Please Enter Bio").notEmpty(),
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
