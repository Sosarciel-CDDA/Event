import { AnyString, JObject } from "@zwa73/utils";
import { AnyHook, HookObj } from "./EventInterface";
import { Eoc, EocEffect, EocID } from "cdda-schema";
export declare class EventManager {
    private _hookMap;
    private _effectsMap;
    private _prefix;
    constructor(prefix: string);
    /**导出 */
    build(): JObject[];
    /**添加事件 */
    addEvent(hook: AnyHook | AnyString, weight: number, effects: EocEffect[]): void;
    /**添加调用eocid事件 */
    addInvokeID(hook: AnyHook | AnyString, weight: number, ...eocids: EocID[]): void;
    /**添加调用eoc事件 */
    addInvokeEoc(hook: AnyHook | AnyString, weight: number, ...eocs: Eoc[]): void;
    /**添加自定义的Hook */
    addHook(hook: string, eoc: HookObj): void;
    /**验证hook是否存在 */
    private verifyHook;
    /**获取前缀 */
    getPrefix(): string;
}
