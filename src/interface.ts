export interface Option {
  type: "react" | "vue" | "miniprogram";
  tagName: string;
  elementNames: string[]; // 组件名
  eventNames: string[]; // 事件名
  resultFile: string;
  projectId: number;
}

export interface TagInfo {
  path: string;
  line: number;
}
// 重复的
export interface RepeatedTag {
  [tagKey: number]: TagInfo[];
}

export interface PointInfo {
  value: number;
  line: number;
  path?: string;
}
export interface AutoPointData {
  maxPoint: number;
  regEvent?: RegExp;
  regElement?: RegExp;
  map: { [path: string]: PointInfo[] };
}

export abstract class Base {
  option: Option;
  files: string[];
  data: AutoPointData = {
    maxPoint: -1,
    map: {},
  };
  constructor(option: Option,files: string[]) {
    this.option = option;
    this.files = files;
  }
  /**
   * 遍历重复埋点的数据，防止重复埋点
   * @param map
   */
  protected getRepeatedTag(map: { [path: string]: PointInfo[] }) {
    const repeatedTag: RepeatedTag = {};
    const temp: any = {};
    // 第一层单个文件循环
    Object.keys(map).forEach(path => {
      // 第二层获取文件内的埋点
      map[path].forEach(k => {
        const tempObj = temp[k.value] || [];
        if (tempObj.length > 0) {
          repeatedTag[k.value] = tempObj
        } 
        tempObj.push({
          line: k.line,
          path: path,
        });
        temp[k.value] = tempObj
      });
    });
    return repeatedTag;
  }
  abstract run();
  abstract checkRepeatedTag();
}
