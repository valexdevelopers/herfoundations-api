"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRoutes = void 0;
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
// import userRoutes from './user.routes';
// import postRoutes from './post.routes';
const loadRoutes = (app) => {
    app.use('/api/v1/auth', auth_1.default);
    app.use('/api/v1/user', user_1.default);
    // app.use('/api/users', userRoutes);
    // app.use('/api/posts', postRoutes);
};
exports.loadRoutes = loadRoutes;
