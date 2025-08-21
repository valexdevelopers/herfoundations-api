"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = exports.UserStatus = exports.UserType = exports.ErrorCodes = void 0;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCodes["MISING_DATA"] = "MISING_DATA";
    ErrorCodes["EMAIL_ALREADY_EXISTS"] = "EMAIL_ALREADY_EXISTS";
    ErrorCodes["GOOGLE_AUTH_FAILED"] = "GOOGLE_AUTH_FAILED";
    ErrorCodes["AUTH_FAILED"] = "AUTH_FAILED";
    ErrorCodes["ACCOUNT_NOT_VERIFIED"] = "ACCOUNT_NOT_VERIFIED";
    ErrorCodes["ACCOUNT_RESTRICTED"] = "ACCOUNT_RESTRICTED";
    ErrorCodes["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCodes["TOKEN_INVALID"] = "TOKEN_INVALID";
    // general
    ErrorCodes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    // baserepository errors
    ErrorCodes["RETRY_MAXEDOUT"] = "RETRY_MAXEDOUT";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
var UserType;
(function (UserType) {
    UserType["admin"] = "admin";
    UserType["doctor"] = "doctor";
    UserType["patient"] = "patient";
})(UserType || (exports.UserType = UserType = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["active"] = "active";
    UserStatus["restricted"] = "restricted";
    UserStatus["deleted"] = "deleted";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["pending"] = "pending";
    VerificationStatus["approved"] = "approved";
    VerificationStatus["rejected"] = "rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
