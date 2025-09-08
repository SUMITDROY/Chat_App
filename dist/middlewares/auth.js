"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthenticator = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
/**
 * Middleware to authenticate normal HTTP requests
 */
const isAuthenticated = (req, res, next) => {
    var _a;
    try {
        // Extract token from Bearer token header
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ status: "error", message: "Please login first" });
            return;
        }
        // Verify and decode JWT
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userID = decoded._id;
        next();
    }
    catch (error) {
        res
            .status(401)
            .json({ status: "error", message: error.message || "Invalid token" });
    }
};
exports.isAuthenticated = isAuthenticated;
/**
 * Middleware to authenticate socket connections
 */
const socketAuthenticator = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract token from socket handshake query
        const token = socket.handshake.query.userToken;
        if (!token) {
            return next(new Error("Please login to access this socket"));
        }
        // Verify and decode JWT
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield user_1.default.findById(decoded._id);
        if (!user) {
            return next(new Error("User not found. Please login again"));
        }
        socket.user = user;
        next();
    }
    catch (error) {
        next(new Error(error.message));
    }
});
exports.socketAuthenticator = socketAuthenticator;
