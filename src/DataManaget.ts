import { JArray, JObject, JToken, UtilFT } from "@zwa73/utils";
import * as path from 'path';
import * as  fs from 'fs';
import { EventManager } from "./EventManager";
import { AnyHook, HelperEocID, HookOpt } from "./EventInterface";
import { Eoc, EocEffect, EocID } from "@sosarciel-cdda/schema";
import { HookObj } from "./EventInterface";


/**数据管理器 */
export class DataManager{
    /**资源目录 ├ ─ └  
     *  dataPath  
     *  └── StaticData //静态数据文件夹  
     */
    _dataPath?:string;
    /**输出目录 */
    _outPath?:string;// = path.join(process.cwd(),'CustomNPC');
    /**事件管理器 */
    _em?:EventManager;

    /**输出的静态数据表 */
    private _staticTable:Record<string,JArray>={};
    /**共用资源表 */
    private _sharedTable:Record<string,Record<string,JObject>>={};

    //———————————————————— 初始化 ————————————————————//
    /**
     * @param dataPath - 输入数据路径 默认为执行路径/data  
     * @param outPath  - 输出数据路径 默认无输出  
     * @param emPrefix - 事件框架前缀 未设置则无事建框架
     */
    constructor(dataPath?:string,outPath?:string,emPrefix?:string,opt?:Partial<HookOpt>){
        //初始化资源io路径
        this._outPath  = outPath;
        this._dataPath = dataPath;
        if(emPrefix!=null)
            this._em = new EventManager(emPrefix,opt);
    }
    /**添加共享资源 同filepath+key会覆盖  
     * 出现与原数据不同的数据时会提示  
     * @param key      - 共享资源的键
     * @param val      - 共享资源的值
     * @param filePath - 输出路径
     */
    addSharedRes(key:string,val:JObject,filePath:string,...filePaths:string[]){
        const fixPath = path.join(filePath,...filePaths);
        const table = this._sharedTable[fixPath] =
            this._sharedTable[fixPath] ?? {};
        //获取旧值
        const oval = table[key];
        table[key]=val;
        if(oval!=null){
            if(JSON.stringify(oval)!=JSON.stringify(val))
                console.log(`addSharedRes 出现了一个不相同的数据 \n原数据:${JSON.stringify(oval)}\n新数据:${JSON.stringify(val)}`);
        }
    }
    /**添加资源  
     * @param arr      - 资源对象数组
     * @param filePath - 输出路径
     */
    addData(arr:JObject[],filePath:string,...filePaths:string[]){
        this._staticTable[path.join(filePath,...filePaths)] = arr;
    }
    /**输出数据到主目录  
     * @param filePath - 输出路径
     * @param obj      - 输出对象
     */
    async saveToFile(filePath:string,obj:JToken,opt?:Parameters<typeof UtilFT.writeJSONFile>[2]){
        if(this._outPath==null) return;
        return UtilFT.writeJSONFile(path.join(this._outPath,filePath),obj,opt);
    }
    /**添加自定义的Hook */
    addHook(hook:string,eoc:HookObj){
        if(this._em===undefined) throw "未定义事件框架ID前缀"
        this._em.addHook(hook,eoc);
    }
    /**获得Hook设定 */
    getHookObj(hook:string){
        if(this._em===undefined) throw "未定义事件框架ID前缀"
        return this._em.getHookObj(hook);
    }
    /**添加事件 */
    addEvent(hook: AnyHook, weight: number, effects: EocEffect[]): void {
        if(this._em===undefined) throw "未定义事件框架ID前缀"
        return this._em.addEvent(hook,weight,effects);
    }
    /**添加调用eocid事件 */
    addInvokeID(hook: AnyHook, weight: number, ...eocids: EocID[]): void {
        if(this._em===undefined) throw "未定义事件框架ID前缀"
        return this._em.addInvokeID(hook,weight,...eocids);
    }
    /**添加调用eoc事件 */
    addInvokeEoc(hook: AnyHook, weight: number, ...eocs: Eoc[]): void {
        if(this._em===undefined) throw "未定义事件框架ID前缀"
        return this._em.addInvokeEoc(hook,weight,...eocs);
    }
    /**获取helper */
    getHelperEoc(id: HelperEocID): Eoc {
        if(this._em===undefined) throw "未定义事件框架ID前缀"
        return this._em.getHelperEoc(id);
    }
    /**输出所有数据  
     * 并复制 dataPath/StaticData/** 静态资源  
     */
    async saveAllData(){
        if(this._outPath==null) return;
        if(this._dataPath!=null){
            //复制静态数据
            const staticDataPath = path.join(this._dataPath,"StaticData");
            await UtilFT.ensurePathExists(staticDataPath,{dir:true});
            await UtilFT.ensurePathExists(this._outPath,{dir:true});
            //await
            fs.promises.cp(staticDataPath,this._outPath,{ recursive: true });
        }

        //导出js静态数据
        const staticData = this._staticTable;
        for(const filePath in staticData){
            const obj = staticData[filePath];
            //await
            //console.log(this._outPath)
            //console.log(filePath)
            //console.log(path.parse(path.join(this._outPath,filePath)).dir)
            await UtilFT.ensurePathExists(path.parse(path.join(this._outPath,filePath)).dir,{dir:true});
            this.saveToFile(filePath,obj,{compress:true,compressThreshold:60});
        }

        //导出共用资源
        for(const filePath in this._sharedTable){
            await UtilFT.ensurePathExists(path.parse(path.join(this._outPath,filePath)).dir,{dir:true});
            this.saveToFile(filePath,Object.values(this._sharedTable[filePath]),{compress:true,compressThreshold:60});
        }

        //导出event框架
        if(this._em)
            this.saveToFile(`${this._em.getPrefix()}_event_frame`,this._em.build(),{compress:true,compressThreshold:60});
    }
}