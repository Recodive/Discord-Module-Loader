"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClass_1 = __importDefault(require("./BaseClass"));
class DiscordEvent extends BaseClass_1.default {
    constructor(event, listener) {
        super();
        this.event = event;
        this.listener = listener;
    }
}
exports.default = DiscordEvent;
//# sourceMappingURL=DiscordEvent.js.map