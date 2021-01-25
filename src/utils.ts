import chalk from "chalk";
import * as fse from "fs-extra";
import j from "jscodeshift";
import getParser from "jscodeshift/src/getParser";
import { Option } from "./interface";
import { parse } from "@vue/compiler-dom";
import { format as prettify } from "prettier";

import Path from "path";

export const error = msg => {
  console.log(chalk.red(msg));
};
export const warning = msg => {
  console.log(chalk.yellow(msg));
};
export const log = msg => {
  console.log(chalk.blue(msg));
};
export const success = msg => {
  console.log(chalk.green(msg));
};

export const sleep = (time = 1000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
};

export interface FileInfo {
  root: any;
  source: string;
  path: string;
}

export const isFile = (path: string) => {
  const stats = fse.statSync(Path.resolve(path));
  return stats.isFile();
};

function getRootTsx(code: string, path: string) {
  try {
    return j(code, { parser: getParser("tsx") });
  } catch (err) {
    console.log(err);
    throw chalk.red(path) + "\n" + err;
  }
}
function getRootVue(code: string, path: string) {
  try {
    return parse(code);
  } catch (err) {
    console.log(err);
    throw chalk.red(path) + "\n" + err;
  }
}
/**
 * 读取source代码
 */
export const getSourcesInfo = async (
  files: string[],
  type: Option["type"],
): Promise<FileInfo[]> => {
  // 获取所有的代码
  const promises = files.map(path => fse.readFile(path));

  const fileSources = await Promise.all(promises);

  return fileSources.map((f, index) => {
    const source = f.toString();

    const path = files[index];
    return {
      root:
        type === "react" ? getRootTsx(source, path) : getRootVue(source, path),
      source,
      path,
    };
  });
};

export const writeFile = (file: string, out: string) => {
  return new Promise((resolve, reject) => {
    fse.writeFile(file, out, err => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

export const readJson = (file: string) => {
  if (fse.pathExistsSync(file)) {
    return fse.readJson(Path.resolve(file));
  }
  return Promise.resolve({});
};

export function format(code: string, optionFile: string): string {
  let option = {
    printWidth: 80,
    singleQuote: true,
    semi: true,
    tabWidth: 2,
    insertPragma: true,
    bracketSpacing: true,
    useTabs: false,
  };
  if (fse.pathExistsSync(optionFile)) {
    const file = fse.readFileSync(optionFile);
    option = JSON.parse(file.toString());
  }
  return prettify(code, option);
}
