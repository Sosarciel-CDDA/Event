"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
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
        const json = [];
        //加入effect
        for (const key in this._hookMap) {
            const fixkey = key;
            const hookObj = this._hookMap[fixkey];
            //加入effect
            let elist = this._effectsMap[fixkey] || [];
            elist.sort((a, b) => b.weight - a.weight);
            const eventeffects = [];
            elist.forEach((e) => eventeffects.push(...e.effects));
            const mergeeffects = [];
            eventeffects.forEach((e) => {
                const lastobj = mergeeffects[mergeeffects.length - 1];
                if (typeof lastobj == "object" && 'run_eocs' in lastobj && Array.isArray(lastobj.run_eocs) &&
                    typeof e == "object" && 'run_eocs' in e && Array.isArray(e.run_eocs)) {
                    lastobj.run_eocs.push(...e.run_eocs);
                }
                else
                    mergeeffects.push(e);
            });
            const eoc = {
                type: "effect_on_condition",
                ...hookObj.base_setting,
                id: `${this._prefix}_${key}_EVENT`,
                effect: [...hookObj.before_effects ?? [], ...mergeeffects, ...hookObj.after_effects ?? []]
            };
            //整合eoc数组
            json.push(eoc);
        }
        return json;
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
