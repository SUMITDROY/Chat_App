const {
  body,
  validationResult,
  ValidationChain,
  Request,
  Response,
  NextFunction,
} = require ("express-validator");

/**
 * Register Validator - validates registration inputs
 */
// @ts-ignore
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
  // @ts-ignore
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const errorMessages = errors
    .array()
    // @ts-ignore
    .map((error) => error.msg)
    .join(", ");
  // @ts-ignore
  res.status(400).json({ status: "error", message: errorMessages });
};
