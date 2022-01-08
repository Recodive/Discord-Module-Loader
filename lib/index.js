"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordEvent = exports.DiscordCommand = void 0;
require("source-map-support/register");
const Command_1 = __importDefault(require("./classes/Command"));
exports.DiscordCommand = Command_1.default;
const Event_1 = __importDefault(require("./classes/Event"));
exports.DiscordEvent = Event_1.default;
const ModuleLoader_1 = __importDefault(require("./classes/ModuleLoader"));
exports.default = ModuleLoader_1.default;
//# sourceMappingURL=index.js.map