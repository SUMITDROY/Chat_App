"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHandle = exports.registerValidator = void 0;
// import  body from "express-validator";
// import validationResult from "express-validator";
// const  {  ValidationChain } = require("express-validator");
const express_validator_1 = require("express-validator");
/**
 * Register Validator - validates registration inputs
 */
const registerValidator = () => [
    (0, express_validator_1.body)("username", "Please enter username").notEmpty(),
    (0, express_validator_1.body)("name", "Please enter name").notEmpty(),
    (0, express_validator_1.body)("password", "Please enter password").notEmpty(),
    (0, express_validator_1.body)("bio", "Please enter bio").notEmpty(),
];
exports.registerValidator = registerValidator;
/**
 * Middleware to handle validation results
 */
const validateHandle = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty()) {
        return next();
    }
    const errorMessages = errors
        .array()
        .map((error) => error.msg)
        .join(", ");
    res.status(400).json({ status: "error", message: errorMessages });
};
exports.validateHandle = validateHandle;
