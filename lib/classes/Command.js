"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = __importDefault(require("./BaseClass"));
class Command extends BaseClass_1.default {
    constructor(options) {
        super();
        this.global = false;
        this.name = options.name;
        this.description = options.description;
        this.defaultPermission = options.defaultPermission;
        this.type = options.type;
        this.options = options.options;
        this.cooldown = options.cooldown;
        this.channelAllowlist = options.channelAllowlist;
        this.channelDenylist = options.channelDenylist;
        this.permissions = options.permissions;
        this.hasUserCommand = options.hasUserCommand;
        this.execute = options.execute;
    }
}
exports.default = Command;
//# sourceMappingURL=Command.js.map