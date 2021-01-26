import j from "jscodeshift";
import { PointInfo, Base } from "./interface";
import { getSourcesInfo, writeFile, error, FileInfo } from "./utils";

export class ModifyTsxAST extends Base {
  /**
   * 用于生成埋点的tag
   * @param {*} j
   * @param {number} point 埋点符号
   */
  private genTzTag(point: number) {
    const data = j.jsxIdentifier(this.option.tagName);
    const str = j.stringLiteral("" + point);
    return j.jsxAttribute(data, str);
  }
  /**
   * 判断这个element是否是埋点tag
   */
  private JSXElementIsTzTag(p: any, path: string) {
    const openingElement = p.value.openingElement;
    try {
      const attributes = openingElement.attributes || [];
      const index = attributes.findIndex(attr => attr?.name?.name === this.option.tagName) || -1
      // @ts-ignore
      if (!this.option.force && index > -1) {
        // 如果已经埋点了，就不需要再埋点了
        return false;
      }
      if (!this.option.force && index > -1) {
        // 如果是强制更新的情况下，对节点进行加工
        attributes.splice(index,1)
        return true
      }

      // 传入的事件名，默认是onclick|onsubmit
      // @ts-ignore
      if (attributes.find(attr => attr?.name?.name.match(this.data.regEvent))) {
        return true;
      }

      // 传入的组件名，默认是a|link|route
      if (openingElement.name?.name?.match(this.data.regElement)) {
        return true;
      }

      return false;
    } catch (err) {
      error(path);
      console.log(err);
      return false;
    }
  }
  private insertPoint(root: any, path: string) {
    // 对没有埋点的节点进行埋点
    root
      .find(j.JSXElement)
      .filter(p => this.JSXElementIsTzTag(p, path))
      .forEach(p => {
        const value = this.data.nextPoint++;

        p.node.openingElement.attributes.push(this.genTzTag(value));
      });
    return root.toSource();
  }
  /**
   * 寻找所有符合tag要求的节点
   */
  private findTags(root: any) {
    return root
      .find(j.JSXAttribute)
      .filter(p => p.value.name.name === this.option.tagName);
  }

  /**
   *
   *  check项目中有没有重复的tag，并且做一定程度的预处理
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
        const value = p.value.value.value;
        points.push({
          value,
          line: p.value.loc
            ? p.value.loc.start.line
            : p.parentPath.parentPath.value.loc.start.line,
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
      let nextPoint = this.option.min;
      fileSources.forEach(item => {
        // 查找符合条件（this.option.tagName）的组件
        const root = this.findTags(item.root);
        root.forEach(p => {
          const value = p.value.value.value;
          // 获取最大埋点
          if (value > nextPoint && value < this.option.max) {
            nextPoint = value;
          }
        });
      });
      
      this.data.nextPoint = Number(nextPoint + 1);
    
      //3. 依次遍历file，然后插入埋点
      for (let i = 0; i < fileSources.length; i++) {
        const f = fileSources[i];
        // 开始对其自动埋点
        const source = this.insertPoint(f.root, f.path);
        // 写入结果
        await writeFile(f.path, source);
      }

      // 4. 
      const map = this.totalTag(await getSourcesInfo(
        this.files,
        this.option.type,
      ));

      // 5.
      const checkData = this.checkedTag(map);

      // const oldData = await readJson(this.option.resultFile);
      const newData = {
        ...checkData,
        map,
        nextPoint: this.data.nextPoint,
      };
      writeFile(this.option.resultFile, JSON.stringify(newData, null, 2));
      return newData;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
