export interface Option {
  type: "react" | "vue" | "miniprogram";
  tagName: string;
  elementNames: string[]; // 组件名
  eventNames: string[]; // 事件名
  resultFile: string;
  min: number;
  max: number;
}

export interface TagInfo {
  path: string;
  line: number;
}
// 重复的
export interface RepeatedTag {
  [tagKey: number]: TagInfo[];
}

export interface IllegalTagInfo extends TagInfo {
  msg: string; //错误信息
}
export interface IllegalTag {
  [tagKey: number]: IllegalTagInfo[];
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
    this.data.regEvent = new RegExp(
      `^(${this.option.eventNames.join("|")})+$`,
      "i",
    );
    this.data.regElement = new RegExp(
      `^(${this.option.elementNames.join("|")})+$`,
      "i",
    );

  }
  /**
   * 遍历重复埋点的数据，防止重复埋点
   * @param map
   */
  protected checkedTag(map: { [path: string]: PointInfo[] }) {
    const repeatedTag: RepeatedTag = {};
    const illegalTag: IllegalTag = {}
    const temp: any = {};
    const {max,min} = this.option
    // 第一层单个文件循环
    Object.keys(map).forEach(path => {
      // 第二层获取文件内的埋点
      map[path].forEach(k => {
        const tempObj = temp[k.value] || [];
        if (tempObj.length > 0) {
          repeatedTag[k.value] = tempObj
        }
        if(k.value < min || k.value > max){
          const t = illegalTag[k.value] || []
          t.push({
            line: Number(k.line),
            path: path,
            msg: "Exceeded the maximum and minimum limits"  + " max:" + max + " min:" + min
          })
          illegalTag[k.value] = t
        }
        tempObj.push({
          line: k.line,
          path: path,
        });
        temp[k.value] = tempObj
      });
    });
    return {
      repeatedTag,
      illegalTag
    };
  }
  abstract run();
  abstract checkRepeatedTag();
}
