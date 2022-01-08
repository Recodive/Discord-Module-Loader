"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseClass_1 = __importDefault(require("./BaseClass"));
class DiscordModule extends BaseClass_1.default {
    constructor(name) {
        super();
        this.name = name;
        this.events = new discord_js_1.Collection();
        this.commands = new discord_js_1.Collection();
        this.modules = new discord_js_1.Collection();
    }
    addEvents(events) {
        for (const [name, event] of events) {
            this.events.set(name, event);
        }
    }
    addCommands(commands) {
        for (const [name, command] of commands) {
            this.commands.set(name, command);
        }
    }
    addModules(modules) {
        for (const [name, module] of modules) {
            this.modules.set(name, module);
        }
    }
}
exports.default = DiscordModule;
//# sourceMappingURL=DiscordModule.js.map