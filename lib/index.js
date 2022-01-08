"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordModule = exports.DiscordEvent = exports.DiscordCommand = void 0;
require("source-map-support/register");
const DiscordCommand_1 = __importDefault(require("./classes/DiscordCommand"));
exports.DiscordCommand = DiscordCommand_1.default;
const DiscordEvent_1 = __importDefault(require("./classes/DiscordEvent"));
exports.DiscordEvent = DiscordEvent_1.default;
const DiscordModule_1 = __importDefault(require("./classes/DiscordModule"));
exports.DiscordModule = DiscordModule_1.default;
const ModuleLoader_1 = __importDefault(require("./classes/ModuleLoader"));
exports.default = ModuleLoader_1.default;
//# sourceMappingURL=index.js.map