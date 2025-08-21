"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthenticatedSession_controller_1 = require("../controllers/auth/AuthenticatedSession.controller");
const router = (0, express_1.Router)();
router.patch('/:id', AuthenticatedSession_controller_1.AuthController.update);
exports.default = router;
