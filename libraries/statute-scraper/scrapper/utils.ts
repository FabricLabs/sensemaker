import { writeFile } from "fs";
import axios from "axios";

export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fileData = Buffer.from(response.data, 'binary');
    return writeFile(filename, fileData, () => { });
  } catch (err) {
    console.error(err);
  }
  return null;
}

export const clearForFilesystemDirOrFileName = (path: string) => {
  return clearForFilesystem(path).replace(/[\/]/g, '');
}
export const clearForFilesystem = (path: string) => {
  return path.replace(/[^a-zA-Z0-9_\/. \(\),:-]/g, '');
}

const text_color = (str: string, color: string) => {
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
}

export const black = (str: string) => text_color(str, 'black');
export const red = (str: string) => text_color(str, 'red');
export const green = (str: string) => text_color(str, 'green');
export const yellow = (str: string) => text_color(str, 'yellow');
export const blue = (str: string) => text_color(str, 'blue');
export const magenta = (str: string) => text_color(str, 'magenta');
export const cyan = (str: string) => text_color(str, 'cyan');
export const white = (str: string) => text_color(str, 'white');

export const sleep = (time: number) => new Promise((resolve, reject) => {
  setTimeout(resolve, time);
});


export const fixPath = (path: string[]): string[] => {
  return path.map(part => {
    return clearForFilesystemDirOrFileName(part).substring(0, 200);
  })
}

export const completeUrl = (url, host) => url.startsWith('http') ? url : `${host}${url}`;

export const array_combine = (arr1, arr2) => {
  const obj = {};
  for(const i in arr1) {
    obj[arr1[i]] = arr2[i];
  }
  return obj;
}