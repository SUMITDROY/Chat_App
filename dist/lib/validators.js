"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHandle = exports.registerValidator = void 0;
const { body, validationResult, ValidationChain, Request, Response, NextFunction, } = require("express-validator");
/**
 * Register Validator - validates registration inputs
 */
// @ts-ignore
const registerValidator = () => [
    body("username", "Please Enter UserName").notEmpty(),
    body("name", "Please Enter Name").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
    body("bio", "Please Enter Bio").notEmpty(),
];
exports.registerValidator = registerValidator;
/**
 * Middleware to handle validation results
 */
const validateHandle = (req, res, 
// @ts-ignore
next) => {
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
exports.validateHandle = validateHandle;
