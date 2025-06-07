import { JObject, JToken, UtilFT } from "@zwa73/utils";
import { EventManager } from "./EventManager";
import { AnyHook, HookOpt } from "./EventInterface";
import { Eoc, EocEffect, EocID } from "@sosarciel-cdda/sclema";
import { HookObj } from "./EventInterface";
/**数据管理器 */
export declare class DataManager {
    /**资源目录 ├ ─ └
     *  dataPath
     *  └── StaticData //静态数据文件夹
     */
    _dataPath?: string;
    /**输出目录 */
    _outPath?: string;
    /**事件管理器 */
    _em?: EventManager;
    /**输出的静态数据表 */
    private _staticTable;
    /**共用资源表 */
    private _sharedTable;
    /**
     * @param dataPath - 输入数据路径 默认为执行路径/data
     * @param outPath  - 输出数据路径 默认无输出
     * @param emPrefix - 事件框架前缀 未设置则无事建框架
     */
    constructor(dataPath?: string, outPath?: string, emPrefix?: string, opt?: Partial<HookOpt>);
    /**添加共享资源 同filepath+key会覆盖
     * 出现与原数据不同的数据时会提示
     * @param key      - 共享资源的键
     * @param val      - 共享资源的值
     * @param filePath - 输出路径
     */
    addSharedRes(key: string, val: JObject, filePath: string, ...filePaths: string[]): void;
    /**添加资源
     * @param arr      - 资源对象数组
     * @param filePath - 输出路径
     */
    addData(arr: JObject[], filePath: string, ...filePaths: string[]): void;
    /**输出数据到主目录
     * @param filePath - 输出路径
     * @param obj      - 输出对象
     */
    saveToFile(filePath: string, obj: JToken, opt?: Parameters<typeof UtilFT.writeJSONFile>[2]): Promise<void>;
    /**添加自定义的Hook */
    addHook(hook: string, eoc: HookObj): void;
    /**获得Hook设定 */
    getHookObj(hook: string): HookObj;
    /**添加事件 */
    addEvent(hook: AnyHook, weight: number, effects: EocEffect[]): void;
    /**添加调用eocid事件 */
    addInvokeID(hook: AnyHook, weight: number, ...eocids: EocID[]): void;
    /**添加调用eoc事件 */
    addInvokeEoc(hook: AnyHook, weight: number, ...eocs: Eoc[]): void;
    /**输出所有数据
     * 并复制 dataPath/StaticData/** 静态资源
     */
    saveAllData(): Promise<void>;
}
