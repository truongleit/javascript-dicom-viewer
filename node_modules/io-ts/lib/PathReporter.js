"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
function stringify(v) {
    return typeof v === 'function' ? index_1.getFunctionName(v) : JSON.stringify(v);
}
function getContextPath(context) {
    return context.map(function (_a) {
        var key = _a.key, type = _a.type;
        return key + ": " + type.name;
    }).join('/');
}
function getMessage(e) {
    return e.message !== undefined
        ? e.message
        : "Invalid value " + stringify(e.value) + " supplied to " + getContextPath(e.context);
}
/**
 * @since 1.0.0
 */
function failure(es) {
    return es.map(getMessage);
}
exports.failure = failure;
/**
 * @since 1.0.0
 */
function success() {
    return ['No errors!'];
}
exports.success = success;
/**
 * @since 1.0.0
 */
exports.PathReporter = {
    report: function (validation) { return validation.fold(failure, success); }
};
