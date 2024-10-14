"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
const utils_1 = require("@zwa73/utils");
const EventInterface_1 = require("./EventInterface");
class EventManager {
    _hookMap;
    _effectsMap = {};
    _prefix;
    constructor(prefix, opt) {
        this._hookMap = (0, EventInterface_1.genDefineHookMap)(prefix, opt);
        this._prefix = prefix;
    }
    /**导出 */
    build() {
        const jsonMap = {};
        //加入effect
        for (const key in this._hookMap) {
            const fixkey = key;
            const hookObj = this._hookMap[fixkey];
            //加入effect
            const elist = this._effectsMap[fixkey] ?? [];
            elist.sort((a, b) => b.weight - a.weight);
            //格式化为effect
            const eventeffects = [];
            elist.forEach((e) => eventeffects.push(...e.effects));
            //合并if
            function mergeIf(effects) {
                const merges = [];
                effects.forEach((curre) => {
                    const laste = merges[merges.length - 1];
                    if (typeof laste == "object" && 'if' in laste && Array.isArray(laste.then) &&
                        typeof curre == "object" && 'if' in curre && Array.isArray(curre.then) &&
                        (0, utils_1.stringifyJToken)(laste.if) == (0, utils_1.stringifyJToken)(curre.if)) {
                        laste.then.push(...curre.then);
                        laste.then = mergeRuneocs(laste.then);
                    }
                    else
                        merges.push(curre);
                });
                return merges;
            }
            //合并runeocs
            function mergeRuneocs(effects) {
                const merges = [];
                effects.forEach((curre) => {
                    const laste = merges[merges.length - 1];
                    if (typeof laste == "object" && 'run_eocs' in laste && Array.isArray(laste.run_eocs) &&
                        typeof curre == "object" && 'run_eocs' in curre && Array.isArray(curre.run_eocs)) {
                        laste.run_eocs.push(...curre.run_eocs);
                    }
                    else
                        merges.push(curre);
                });
                return merges;
            }
            //合并
            const mergeeffects = mergeRuneocs(mergeIf(eventeffects));
            const eoc = {
                type: "effect_on_condition",
                ...hookObj.base_setting,
                id: `${this._prefix}_${key}_EVENT`,
                effect: [
                    ...hookObj.before_effects ?? [],
                    ...mergeeffects,
                    ...hookObj.after_effects ?? [],
                ],
                "//": {
                    isUsed: mergeeffects.length >= 1,
                    require: hookObj.require_hook,
                }
            };
            //整合eoc数组
            jsonMap[key] = (eoc);
        }
        const vaildMap = {};
        //删除无效eoc
        Object.entries(jsonMap).forEach(([k, v]) => {
            if (!v["//"].isUsed)
                return;
            vaildMap[k] = v;
            const req = v["//"].require ?? [];
            for (const hook of req)
                vaildMap[hook] = jsonMap[hook];
        });
        //删除无效eoc调用
        function delRunEocs(obj, param) {
            //console.log(param);
            if (typeof obj == 'string')
                return;
            if (typeof obj != 'object')
                return;
            for (const k in obj) {
                const sobj = obj[k];
                if (Array.isArray(sobj)) {
                    obj[k] = sobj.filter(ssobj => {
                        if (typeof ssobj == 'object' && 'run_eocs' in ssobj && ssobj.run_eocs == param)
                            return false;
                        return true;
                    });
                    obj[k].forEach((ssobj) => delRunEocs(ssobj, param));
                }
                if (typeof sobj == 'object')
                    delRunEocs(sobj, param);
            }
        }
        Object.keys(jsonMap)
            .filter(k => !Object.keys(vaildMap).includes(k))
            .forEach(k => delRunEocs(vaildMap, jsonMap[k].id));
        //删除builddata
        for (const k in vaildMap)
            delete vaildMap[k]["//"];
        return Object.values(vaildMap);
    }
    /**添加事件
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param effects - 触发效果
     */
    addEvent(hook, weight, effects) {
        this.verifyHook(hook);
        this._effectsMap[hook] = this._effectsMap[hook] ?? [];
        const list = this._effectsMap[hook];
        list?.push({ effects, weight });
    }
    /**添加调用eocid事件
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param eocids - 触发效果id
     */
    addInvokeID(hook, weight, ...eocids) {
        this.verifyHook(hook);
        this._effectsMap[hook] = this._effectsMap[hook] ?? [];
        const list = this._effectsMap[hook];
        list?.push({ effects: [{ run_eocs: eocids }], weight });
    }
    /**添加调用eoc事件
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param eocs - 触发效果对象
     */
    addInvokeEoc(hook, weight, ...eocs) {
        return this.addInvokeID(hook, weight, ...eocs.map((item) => item.id));
    }
    /**添加自定义的Hook */
    addHook(hook, eoc) {
        this._hookMap[hook] = eoc;
    }
    /**获得hook设定 */
    getHookObj(hook) {
        this.verifyHook(hook);
        return this._hookMap[hook];
    }
    /**验证hook是否存在 */
    verifyHook(hook) {
        if (this._hookMap[hook] == null)
            throw `hook:${hook} 不存在`;
    }
    /**获取前缀 */
    getPrefix() {
        return this._prefix;
    }
}
exports.EventManager = EventManager;
