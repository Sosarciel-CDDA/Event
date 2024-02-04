import { AnyString, JObject } from "@zwa73/utils";
import { AnyHook, HookObj, HookOpt } from "./EventInterface";
import { Eoc, EocEffect, EocID } from "cdda-schema";
export declare class EventManager {
    private _hookMap;
    private _effectsMap;
    private _prefix;
    constructor(prefix: string, opt?: Partial<HookOpt>);
    /**导出 */
    build(): JObject[];
    /**添加事件
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param effects - 触发效果
     */
    addEvent(hook: AnyHook | AnyString, weight: number, effects: EocEffect[]): void;
    /**添加调用eocid事件
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param eocids - 触发效果id
     */
    addInvokeID(hook: AnyHook | AnyString, weight: number, ...eocids: EocID[]): void;
    /**添加调用eoc事件
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param eocs - 触发效果对象
     */
    addInvokeEoc(hook: AnyHook | AnyString, weight: number, ...eocs: Eoc[]): void;
    /**添加自定义的Hook */
    addHook(hook: string, eoc: HookObj): void;
    /**获得hook设定 */
    getHookObj(hook: string): HookObj;
    /**验证hook是否存在 */
    private verifyHook;
    /**获取前缀 */
    getPrefix(): string;
}
