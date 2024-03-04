"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.array_combine = exports.completeUrl = exports.fixPath = exports.sleep = exports.white = exports.cyan = exports.magenta = exports.blue = exports.yellow = exports.green = exports.red = exports.black = exports.clearForFilesystem = exports.clearForFilesystemDirOrFileName = exports.downloadFile = void 0;
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
const downloadFile = async (url, filename) => {
    try {
        const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        const fileData = Buffer.from(response.data, 'binary');
        return (0, fs_1.writeFile)(filename, fileData, () => { });
    }
    catch (err) {
        console.error(err);
    }
    return null;
};
exports.downloadFile = downloadFile;
const clearForFilesystemDirOrFileName = (path) => {
    return (0, exports.clearForFilesystem)(path).replace(/[\/]/g, '');
};
exports.clearForFilesystemDirOrFileName = clearForFilesystemDirOrFileName;
const clearForFilesystem = (path) => {
    return path.replace(/[^a-zA-Z0-9_\/. \(\),:-]/g, '');
};
exports.clearForFilesystem = clearForFilesystem;
const text_color = (str, color) => {
    const colors = {
        default: '\x1b[0m',
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m'
    };
    return `${colors[color]}${str}${colors['default']}`;
};
const black = (str) => text_color(str, 'black');
exports.black = black;
const red = (str) => text_color(str, 'red');
exports.red = red;
const green = (str) => text_color(str, 'green');
exports.green = green;
const yellow = (str) => text_color(str, 'yellow');
exports.yellow = yellow;
const blue = (str) => text_color(str, 'blue');
exports.blue = blue;
const magenta = (str) => text_color(str, 'magenta');
exports.magenta = magenta;
const cyan = (str) => text_color(str, 'cyan');
exports.cyan = cyan;
const white = (str) => text_color(str, 'white');
exports.white = white;
const sleep = (time) => new Promise((resolve, reject) => {
    setTimeout(resolve, time);
});
exports.sleep = sleep;
const fixPath = (path) => {
    return path.map(part => {
        return (0, exports.clearForFilesystemDirOrFileName)(part).substring(0, 200);
    });
};
exports.fixPath = fixPath;
const completeUrl = (url, host) => url.startsWith('http') ? url : `${host}${url}`;
exports.completeUrl = completeUrl;
const array_combine = (arr1, arr2) => {
    const obj = {};
    for (const i in arr1) {
        obj[arr1[i]] = arr2[i];
    }
    return obj;
};
exports.array_combine = array_combine;
