"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = __importDefault(require("./BaseClass"));
class DiscordModule extends BaseClass_1.default {
    constructor(name) {
        super();
        this.name = name;
    }
}
exports.default = DiscordModule;
//# sourceMappingURL=Module.js.map