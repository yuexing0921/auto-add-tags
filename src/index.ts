import { Glob }  from "glob";
import { ModifyTsxAST } from "./tsx";
import { ModifyVueAST } from "./vue";
import { success, log, warning, error,isFile } from "./utils";
import { Option } from  "./interface"

/**
 * 
 * @param check 是否直接check有重复的标签
 * @param options 
 * @param dir // 需要查找的代码目录, 也可以是直接某个代码文件
 */
export async function main(check: boolean, options: Option, dir = "src" ) {
    
    const files = await getFiles(dir, options.type)

	let modifyAST = options.type === 'react' ? new ModifyTsxAST(options, files): new ModifyVueAST(options, files)
	
	if (check) {
		log("Detecting duplicate tags！！！");
		console.time("checking tags");
		const result = await modifyAST.checkRepeatedTag();
		console.timeEnd("checking tags");
		if (Object.keys(result).length > 0) {
			error("There are duplicate tags。。。。");
			console.log(result);
		} else {
			success("No repeated tag！！！");
		}
		return result
	} else {
		log("Start to implement insert point");

		console.time("Insertion time");
		
		const result = await modifyAST.run();
		
		if (result) {
			console.timeEnd("Insertion time");
			success(`Specific data view ${options.resultFile}`);
			success("execution succeed");
			if(Object.keys(result.repeatedTag).length > 0){
				warning("There are duplicate tags")
				console.log(result.repeatedTag)
			}
		} else {
			error("execution error");
		}
		return result
	}
}

export function getFiles(dir: string, type: Option['type']): Promise<string[]> {
    return new Promise((resolve, reject) =>{
        if (isFile(dir)) {
            resolve([dir]);
    
        } else {
            let pattern = "";
            switch (type) {
                case "vue":
                    pattern = dir + "/**/*.*(vue)";
                    break;
                default :
                    pattern = dir + "/**/*.*(tsx|jsx)";
                    break;
            }
            new Glob(pattern, { mark: true, sync: false }, (err, files) => {
                if (err) {
                    console.error("Glob error: ", err);
                    return err;
                }
                resolve(files);
            });
        }
    })
}