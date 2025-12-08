"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJSON = exports.readJSON = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../data');
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
const readJSON = (filename) => {
    const filepath = path_1.default.join(DATA_DIR, filename);
    if (!fs_1.default.existsSync(filepath)) {
        return [];
    }
    const data = fs_1.default.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
};
exports.readJSON = readJSON;
const writeJSON = (filename, data) => {
    const filepath = path_1.default.join(DATA_DIR, filename);
    fs_1.default.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
};
exports.writeJSON = writeJSON;
