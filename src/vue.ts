import {
  traverseEvery,
  stringify,
  createSimpleExpression,
} from "@vuedx/template-ast-types";
import { AttributeNode } from "@vue/compiler-dom";
import {  PointInfo, Base } from "./interface";
import { getSourcesInfo, writeFile, error, FileInfo } from "./utils";

export class ModifyVueAST extends Base {
  
  /**
   * 用于生成埋点的tag
   * @param {*} j
   * @param {number} point 埋点符号
   */
  private genTzTag(point: number) {
    const tag = this.option.tagName;
    const str = "" + point;

    return createSimpleExpression(tag + "=" + str, false);
  }

  //
  private insertPoint(ast: any, path: string) {
    try {
      let isPoint = false;
      // 对没有埋点的节点进行埋点
      traverseEvery(ast, n => {
        const node: any = n;
        if (node.tag && node.tag === "script") {
          return false;
        }
        const index = node?.props?.findIndex(p => p.name === this.option.tagName) || -1
        // 把已经埋点的的节点进行过滤
        if (!this.option.force && index > -1) {
          return false;
        }
        // 如果需要强制更新节点的值
        if(this.option.force &&  index > -1){
          node.props.splice(index,1)
          const value = this.data.maxPoint++;
          node.props.push(this.genTzTag(value));
          isPoint = true;
        }else if (
          node?.props?.find(p => p?.arg?.content?.match(this.data.regEvent))
        ) {
          // 符合条件的事件
          const value = this.data.maxPoint++;
          node.props.push(this.genTzTag(value));
          isPoint = true;
        } else if (node?.tag?.match(this.data.regElement)) {
          // 符合条件的组件
          const value = this.data.maxPoint++;
          node.props.push(this.genTzTag(value));
          isPoint = true;
        }

        return true;
      });

      return isPoint ? stringify(ast) : "";
    } catch (err) {
      error(path);
      console.log(err);
      return "";
    }
  }
  /**
   * 寻找所有符合tag要求的节点
   */
  private findTags(ast: any) {
    const nodes: AttributeNode[] = [];
    traverseEvery(ast, n => {
      const node: AttributeNode = <AttributeNode>n;

      // @ts-ignore
      if (node.tag && node.tag === "script") {
        return false;
      }

      if (node.name === this.option.tagName) {
        nodes.push(node);
      }
      return true;
    });
    return nodes;
  }

  /**
   * 检查是否有重复埋点的数据
   */
  public async checkRepeatedTag() {
    const { type } = this.option;
    try {
      // 获取所有的代码
      const fileSources = await getSourcesInfo(this.files, type);

      const map = this.totalTag(fileSources);

      return this.checkedTag(map);
    } catch (err) {
      throw err;
    }
  }
  /**
   * 按照source路径生成埋点的代码的map
   * @param fileSources
   */
  private totalTag(fileSources: FileInfo[]) {
    const map: { [path: string]: PointInfo[] } = {};
    // 为了代码的可读性，单独把埋点统计结果放到这里进行
    fileSources.forEach(item => {
      // 查找符合条件（this.option.tagName）的组件
      const root = this.findTags(item.root);
      const points = map[item.path] || [];
      root.forEach(p => {
        const value = p.value?.content || -1;
        points.push({
          value: Number(value),
          line: p.loc.start.line,
        });
        if (points.length > 0) {
          map[item.path] = points;
        }
      });
    });
    return map;
  }
  /**
   * 1. 读取所有的file，加载她们的ast
   * 2. 查找已经埋点的代码的最大值
   * 3. 依次遍历file，然后插入埋点
   * 4. 按照source路径，生成对应的埋点map
   */
  public async run() {
    try {
      // 1.
      const fileSources = await getSourcesInfo(
        this.files,
        this.option.type,
      );

      // 2.
      let maxPoint = this.option.min;
      fileSources.forEach(item => {
        // 查找符合条件（this.option.tagName）的组件
        const root = this.findTags(item.root);
        root.forEach(p => {
          const value = Number(p.value?.content) || -1;
          // 获取最大埋点
          if (value > maxPoint && value < this.option.max) {
            maxPoint = value;
          }
        });
      });
      
      this.data.maxPoint = Number(maxPoint);

      //3. 依次遍历file，然后插入埋点
      for (let i = 0; i < fileSources.length; i++) {
        const f = fileSources[i];
        // 开始对其自动埋点
        const source = this.insertPoint(f.root, f.path);
        // 写入结果
        source && (await writeFile(f.path, source));
      }

      // 4.
      const map = this.totalTag(await getSourcesInfo(
        this.files,
        this.option.type,
      ));
      // 5.
      const checkData = this.checkedTag(map);

      const newData = {
        ...checkData,
        map,
        maxPoint: this.data.maxPoint,
      };
      writeFile(this.option.resultFile, JSON.stringify(newData, null, 2));
      return newData;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
