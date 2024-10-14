import { AnyString, JObject, PRecord, stringifyJToken, UtilFT, UtilFunc } from "@zwa73/utils";
import { AnyEventTypeList, AnyHook, genDefineHookMap, HookObj, HookOpt} from "./EventInterface";
import { Eoc, EocEffect, EocID } from "cdda-schema";


/**事件效果 */
type EventEffect = {
    /**eoc效果 */
    effects:EocEffect[];
    /**排序权重 */
    weight:number;
}
export class EventManager {
    private _hookMap:Record<AnyHook|AnyString,HookObj>;
    private _effectsMap:Partial<Record<AnyHook|AnyString,EventEffect[]>> = {};
    private _prefix:string;
    constructor(prefix:string,opt?:Partial<HookOpt>){
        this._hookMap=genDefineHookMap(prefix,opt);
        this._prefix = prefix;
    }
    /**导出 */
    build(){
        const jsonMap:PRecord<AnyHook,BuildData> = {};
        type BuildData = Eoc&{
            "//":{
                isUsed:boolean;
                require?:AnyHook[];
            }
        };
        //加入effect
        for(const key in this._hookMap){
            const fixkey = key as AnyHook;
            const hookObj = this._hookMap[fixkey];
            //加入effect
            const elist = this._effectsMap[fixkey]??[];
            elist.sort((a,b)=>b.weight-a.weight);

            //格式化为effect
            const eventeffects:EocEffect[] = [];
            elist.forEach((e)=>eventeffects.push(...e.effects));

            //合并if
            function mergeIf(effects:EocEffect[]){
                const merges:EocEffect[]=[];
                effects.forEach((curre)=>{
                    const laste = merges[merges.length-1];
                    if( typeof laste == "object" && 'if' in laste && Array.isArray(laste.then) &&
                        typeof curre == "object" && 'if' in curre && Array.isArray(curre.then) &&
                        stringifyJToken(laste.if) == stringifyJToken(curre.if)){
                            laste.then.push(...curre.then);
                            laste.then = mergeRuneocs(laste.then);
                    }else
                        merges.push(curre)
                })
                return merges;
            }
            //合并runeocs
            function mergeRuneocs(effects:EocEffect[]){
                const merges:EocEffect[]=[];
                effects.forEach((curre)=>{
                    const laste = merges[merges.length-1];
                    if( typeof laste == "object" && 'run_eocs' in laste && Array.isArray(laste.run_eocs) &&
                        typeof curre == "object" && 'run_eocs' in curre && Array.isArray(curre.run_eocs)){
                            laste.run_eocs.push(...curre.run_eocs)
                    }else
                        merges.push(curre)
                })
                return merges;
            }
            //合并
            const mergeeffects = mergeRuneocs(mergeIf(eventeffects));

            const eoc:BuildData = {
                type:"effect_on_condition",
                ...hookObj.base_setting,
                id:`${this._prefix}_${key}_EVENT` as EocID,
                effect:[
                    ...hookObj.before_effects??[],
                    ...mergeeffects,
                    ...hookObj.after_effects??[],
                ],
                "//":{
                    isUsed:mergeeffects.length>=1,
                    require:hookObj.require_hook,
                }
            };
            //整合eoc数组
            jsonMap[key as AnyHook]=(eoc);
        }

        const vaildMap:PRecord<AnyHook,BuildData> = {};
        //删除无效eoc
        Object.entries(jsonMap).forEach(([k,v])=>{
            if(!v["//"].isUsed) return;
            vaildMap[k as AnyHook]=v;
            const req = v["//"].require??[];
            for(const hook of req) vaildMap[hook as AnyHook]=jsonMap[hook as AnyHook];
        });

        //删除无效eoc调用
        Object.keys(jsonMap)
            .filter(k=>!Object.keys(vaildMap).includes(k))
            .forEach(k=>{
                const invaildID = jsonMap[k as AnyHook]!.id;
                UtilFunc.eachField(vaildMap,(key,value,parent)=>{
                    if(Array.isArray(value)){
                        parent[key] = value.filter(sobj => {
                            if(sobj!=null && typeof sobj=='object' && 'run_eocs' in sobj && sobj.run_eocs==invaildID)
                                return false;
                            return true;
                        });
                    }
                });
            });
        //删除无效then else
        UtilFunc.eachField(vaildMap,(key,value,parent)=>{
            if((key=='then' || key=='else') && Array.isArray(value) && value.length<=0)
                delete parent[key];
        });
        //删除无效if
        UtilFunc.eachField(vaildMap,(key,value,parent)=>{
            if(key=='effect' && Array.isArray(value)){
                parent[key] = value.filter(sobj => {
                    if(sobj!=null && typeof sobj == 'object' && 'if' in sobj){
                        const el = sobj['else'];
                        const th = sobj['then'];
                        if((el==null || (Array.isArray(el) && el.length<=0)))
                            delete sobj['else'];
                        if((th==null || (Array.isArray(th) && th.length<=0)))
                            delete sobj['then'];
                        if(Object.keys(sobj).length==1)
                            return false;
                    }
                    return true;
                });
            }
        });

        //删除builddata
        for(const k in vaildMap)
            delete (vaildMap[k as AnyHook] as any)["//"];

        return Object.values(vaildMap);
    }
    /**添加事件  
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param effects - 触发效果
     */
    addEvent(hook:AnyHook|AnyString,weight:number,effects:EocEffect[]){
        this.verifyHook(hook);
        this._effectsMap[hook] = this._effectsMap[hook]??[];
        const list = this._effectsMap[hook];
        list?.push({effects,weight})
    }
    /**添加调用eocid事件  
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param eocids - 触发效果id
     */
    addInvokeID(hook:AnyHook|AnyString,weight:number,...eocids:EocID[]){
        this.verifyHook(hook);
        this._effectsMap[hook] = this._effectsMap[hook]??[];
        const list = this._effectsMap[hook];
        list?.push({effects:[{run_eocs:eocids}],weight})
    }
    /**添加调用eoc事件  
     * @param hook - 触发时机
     * @param weight - 权重 越大优先级越高
     * @param eocs - 触发效果对象
     */
    addInvokeEoc(hook:AnyHook|AnyString,weight:number,...eocs:Eoc[]){
        return this.addInvokeID(hook,weight,...eocs.map((item)=>item.id));
    }
    /**添加自定义的Hook */
    addHook(hook:string,eoc:HookObj){
        this._hookMap[hook] = eoc;
    }
    /**获得hook设定 */
    getHookObj(hook:string){
        this.verifyHook(hook);
        return this._hookMap[hook];
    }
    /**验证hook是否存在 */
    private verifyHook(hook:string){
        if(this._hookMap[hook]==null) throw `hook:${hook} 不存在`;
    }
    /**获取前缀 */
    getPrefix(){
        return this._prefix;
    }
}