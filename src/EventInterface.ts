import { BoolExpr, Eoc, EocEffect, EocID, EocType } from "@sosarciel-cdda/schema";

//Interactive
/**角色互动事件 列表 */
export const InteractHookList = [
    "TryMeleeAtkChar"       ,//尝试近战攻击角色
    "TryMeleeAtkMon"        ,//尝试近战攻击怪物
    "TryRangeAtkChar"       ,//尝试远程攻击角色
    "TryRangeAtkMon"        ,//尝试远程攻击怪物
    "TryMeleeAttack"        ,//尝试近战攻击
    "TryRangeAttack"        ,//尝试远程攻击
    "TryAttack"             ,//尝试攻击
    "SucessMeleeAttack"     ,//近战攻击命中
    "MissMeleeAttack"       ,//近战攻击未命中
] as const;
/**角色互动事件  
 * u为角色 n为目标角色  
 */
export type InteractHook = typeof InteractHookList[number];

/**任何以刷新为基础的事件 列表*/
export const UpdateBaseHookList = [
    "Init"                      ,//初始化
    "Update"                    ,//刷新
    "NpcUpdate"                 ,//Npc刷新
    "MonsterUpdate"             ,//Monster刷新
    "SlowUpdate"                ,//慢速刷新
    "MoveStatus"                ,//移动状态
    "IdleStatus"                ,//待机状态
    "AttackStatus"              ,//攻击状态
] as const;
/**任何以刷新为基础的事件 
 * u为角色 n未定义  适用于怪物
 */
export type UpdateBaseHook = typeof UpdateBaseHookList[number];

/**任何角色事件 列表*/
export const CharHookList = [
    ...InteractHookList         ,//
    "TakeDamage"                ,//受到伤害
    "LowHp"                     ,//低血量 受到任意伤害后 血量若低于阈值触发
    "NearDeath"                 ,//濒死   受到任意伤害后 血量若低于阈值触发
    "DeathPrev"                 ,//死亡前 恢复生命将自动阻止死亡
    "Death"                     ,//死亡
    "EnterBattle"               ,//进入战斗
    "LeaveBattle"               ,//离开战斗
    "BattleUpdate"              ,//进入战斗时 刷新
    "NonBattleUpdate"           ,//非战斗时 刷新
    "WieldItemRaw"              ,//基础手持物品
    "WieldItem"                 ,//手持非空物品
    "StowItem"                  ,//收回物品/手持空物品
    "WearItem"                  ,//穿戴物品
    "EatItem"                   ,//吃下物品
] as const;
/**任何角色事件  
 * u为角色 n未定义  
 */
export type CharHook = typeof CharHookList[number];


/**仅Npc事件 列表 */
export const NpcHookList = [
    "NpcDeathPrev"              ,//死亡前 恢复生命将自动阻止死亡
] as const;
/**仅Npc事件  
 * u为Npc n未定义  
 */
export type NpcHook = typeof NpcHookList[number];


/**全局事件列表 列表 */
export const GlobalHookList = [
    "AvatarMove"            ,//玩家移动
    "AvatarUpdate"          ,//玩家刷新
    "AvatarDeathPrev"       ,//玩家死亡
    "GameBegin"             ,//每次进入游戏时
    "GameStart"             ,//游戏第一次启动时
    "None"                  ,//不会触发的Hook
] as const;
/**全局事件  
 * u为主角 n未定义  
 */
export type GlobalHook = typeof GlobalHookList[number];

/**任何事件 列表 */
export const AnyEventTypeList = [
    ...GlobalHookList  ,
    ...CharHookList    ,
    ...NpcHookList     ,
    ...UpdateBaseHookList ,
] as const;
/**任何事件  
 * u n 均未定义
 */
export type AnyHook = typeof AnyEventTypeList[number];


/**一个Hook */
export type HookObj = {
    /**基础设置 */
    base_setting:{
        /**eoc类型 */
        eoc_type: EocType;
        /**条件 */
        condition?:BoolExpr;
        /**event依赖 */
        required_event?: string;
        /**刷新间隔/秒 */
        recurrence?: number;
        /**全局刷新 */
        global?: boolean;
        /**运行于npc */
        run_for_npcs?: boolean;
    }
    /**运行此事件前将会附带调用的EocEffect */
    before_effects?: EocEffect[];
    /**运行此事件后将会附带调用的EocEffect */
    after_effects?: EocEffect[];
    /**前置的hook */
    require_hook?:AnyHook[];
}

/**Hook设定 */
export type HookOpt = {
    /**行动状态持续时间 默认 4 */
    statusDur:number    ;
    /**战斗持续时间 默认 60 */
    battleDur:number    ;
    /**慢速刷新间隔 默认 60 */
    slowCounter:number  ;
    /**启用移动状态 默认 true */
    enableMoveStatus:boolean  ;
    /**低血量事件血量阈值 默认 33% */
    lowHpThreshold:number  ;
    /**濒死事件血量阈值 默认 10% */
    nearDeathThreshold:number  ;
}

/**生成基础事件  
 * @param prefix        - 事件前缀  
 * @param opt           - 设定  
 */
export function genDefineHookMap(prefix:string,opt?:Partial<HookOpt>){
    const baseSetting:HookOpt = Object.assign({
        statusDur           : 4     ,
        battleDur           : 60    ,
        slowCounter         : 60    ,
        enableMoveStatus    : true  ,
        lowHpThreshold      : 0.33  ,
        nearDeathThreshold  : 0.1   ,
    },opt??{});

    const {statusDur,battleDur,slowCounter,enableMoveStatus,lowHpThreshold,nearDeathThreshold} = baseSetting;

    const eid = (id:AnyHook)=>`${prefix}_${id}_EVENT` as EocID;
    const rune = (id:AnyHook)=>({run_eocs:eid(id)});
    const uv = (id:string)=>`u_${prefix}_${id}`;
    const nv = (id:string)=>`n_${prefix}_${id}`;
    const gv = (id:string)=>`${prefix}_${id}`;

    /**默认Hook */
    const DefHook:HookObj={
        base_setting: {
            eoc_type: "ACTIVATION"
        }
    }
    /**需求前置事件的默认hook */
    const RequireDefObj = (...reqs:AnyHook[])=>({...DefHook,require_hook:reqs});

    const commonUpdate:EocEffect[] = [{
            if:{math:[uv("inBattle"),">","0"]},
            then:[rune("BattleUpdate"),{math:[uv("inBattle"),"-=","1"]},{
                if:{math:[uv("inBattle"),"<=","0"]},
                then:[rune("LeaveBattle")],
            }],
            else:[rune("NonBattleUpdate")]
        },
        //低速刷新计数
        {math:[uv("slowUpdateCounter"),'+=','1']},
        {if:{math:[uv("slowUpdateCounter"),">=", String(slowCounter)]},
            then:[
                {math:[uv("slowUpdateCounter"),"=","0"]},
                rune("SlowUpdate"),
            ]
        },
        ...enableMoveStatus?[{//将uvar转为全局var防止比较报错
                set_string_var: { u_val: uv("char_preloc") },
                target_var: { global_val: gv("char_preloc") }
            },{//通过比较 loc字符串 检测移动
                if:{compare_string: [
                    { global_val: gv("char_preloc") },
                    { mutator: "loc_relative_u", target: "(0,0,0)" }
                ]},
                then:[{math:[uv("onMoveStatus"),"=","0"]}],
                else:[{math:[uv("onMoveStatus"),"=","1"]}],
            },//更新 loc字符串
            {u_location_variable:{u_val:uv("char_preloc")}}
        ] as EocEffect[]:[],
        {//触发互斥状态
            if:{math:[uv("notIdleOrMoveStatus"),"<=","0"]},
            then:[{
                if:{math:[uv("onMoveStatus"),">=","1"]},
                then:[rune("MoveStatus")],
                else:[rune("IdleStatus")],
            }],
            else:[rune("AttackStatus"),{math:[uv("notIdleOrMoveStatus"),"-=","1"]}]
        }];
    const commonInit:EocEffect[] = [{
            if:{math:[uv("isInit"),"!=","1"]},
            then:[rune("Init"),{math:[uv("isInit"),"=","1"]}]
        }];

    //预定义的Hook
    const hookMap:Record<AnyHook,HookObj>={
        None:DefHook,
        GameStart:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "game_start"
            }
        },
        GameBegin:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "game_begin"
            }
        },
        TakeDamage:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_takes_damage"
            },
            after_effects:[{
                if:{math:[uv("inBattle"),"<=","0"]},
                then:[rune("EnterBattle")],
            },
            {math:[uv("inBattle"),"=",`${battleDur}`]},
            {
                if:{or:[
                    {math:["u_hp('head') / u_hp_max('head')"  ,"<=",`${lowHpThreshold}`]},
                    {math:["u_hp('torso') / u_hp_max('torso')","<=",`${lowHpThreshold}`]},
                ]},
                then:[rune("LowHp")],
            },
            {
                if:{or:[
                    {math:["u_hp('head') / u_hp_max('head')"  ,"<=",`${nearDeathThreshold}`]},
                    {math:["u_hp('torso') / u_hp_max('torso')","<=",`${nearDeathThreshold}`]},
                ]},
                then:[rune("NearDeath")],
            },
            ]
            /*
            { "character", character_id }
            { "damage", int }
            character / NONE
	        */
        },
        LowHp:RequireDefObj('TakeDamage'),
        NearDeath:RequireDefObj('TakeDamage'),
        TryMeleeAtkChar:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_melee_attacks_character"
            },
            after_effects:[rune("TryMeleeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "hits", bool },
            { "victim", character_id },
            { "victim_name", string },
            character (attacker) / character (victim)
            */
        },
        TryMeleeAtkMon:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_melee_attacks_monster"
            },
            after_effects:[rune("TryMeleeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "hits", bool },
            { "victim_type", mtype_id },
            character / monster
            */
        },
        TryMeleeAttack:{
            ...RequireDefObj('TryMeleeAtkChar','TryMeleeAtkMon'),
            base_setting: {
                eoc_type: "ACTIVATION"
            },
            after_effects:[rune("TryAttack"),{
                if:{math:["_hits","==","1"]},
                then:[rune("SucessMeleeAttack")],
                else:[rune("MissMeleeAttack")],
            }]
        },
        SucessMeleeAttack:RequireDefObj('TryMeleeAttack'),
        MissMeleeAttack:RequireDefObj('TryMeleeAttack'),
        TryRangeAtkChar:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_ranged_attacks_character"
            },
            after_effects:[rune("TryRangeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "victim", character_id },
            { "victim_name", string },
            character (attacker) / character (victim)
            */
        },
        TryRangeAtkMon:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_ranged_attacks_monster"
            },
            after_effects:[rune("TryRangeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "victim_type", mtype_id },
            character / monster
            */
        },
        TryRangeAttack:{
            ...RequireDefObj('TryRangeAtkChar','TryRangeAtkMon'),
            after_effects:[rune("TryAttack")]
        },
        TryAttack:{
            ...RequireDefObj('TryRangeAttack','TryMeleeAttack'),
            before_effects:[{math:[uv("notIdleOrMoveStatus"),"=",`${statusDur}`]}],
            after_effects:[{
                if:{math:[uv("inBattle"),"<=","0"]},
                then:[rune("EnterBattle")],
            },{math:[uv("inBattle"),"=",`${battleDur}`]}]
        },
        EnterBattle:RequireDefObj('TryAttack','TakeDamage'),
        LeaveBattle:RequireDefObj('Update','TakeDamage','TryAttack'),
        BattleUpdate:RequireDefObj('Update','TakeDamage','TryAttack'),
        NonBattleUpdate:RequireDefObj('Update','TakeDamage','TryAttack'),
        NpcDeathPrev:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_dies",
                condition:"u_is_npc",
            },
            after_effects:[rune('DeathPrev')],
            /**
            { "character", character_id },
            character / NONE
            */
        },
        AvatarDeathPrev:{
            base_setting: {
                eoc_type: "PREVENT_DEATH",
                condition:"u_is_avatar",
            },
            after_effects:[rune('DeathPrev')]
        },
        DeathPrev:{
            ...RequireDefObj('NpcDeathPrev','AvatarDeathPrev'),
            after_effects:[{
                if:{or:[{math:["u_hp('head')","<=","0"]},{math:["u_hp('torso')","<=","0"]}]},
                then:[rune("Death")],
                else:["u_prevent_death"]
            }]
        },
        Death:RequireDefObj('DeathPrev'),
        AvatarMove:{
            base_setting: {
                eoc_type: "OM_MOVE"
            }
        },
        Update:{
            base_setting: {
                eoc_type:"RECURRING",
                recurrence: 1,
                global: true,
                run_for_npcs: false
            },
            before_effects:[...commonInit],
            after_effects:[
            ...commonUpdate,
            rune("AvatarUpdate"),
            {u_run_npc_eocs:[{
                id:eid("NpcUpdate_Inline" as any),
                effect:[rune("NpcUpdate"),...commonUpdate],
            }]},
            {u_run_monster_eocs:[{
                id:eid("MonsterUpdate_Inline" as any),
                effect:[rune("MonsterUpdate"),...commonUpdate],
            }]},
            ]
        },
        Init:RequireDefObj('Update'),
        NpcUpdate:{
            base_setting: {
                eoc_type: "ACTIVATION"
            },
            before_effects:[...commonInit],
            require_hook:["Update"]
        },
        MonsterUpdate:{
            base_setting: {
                eoc_type: "ACTIVATION"
            },
            before_effects:[...commonInit],
            require_hook:["Update"]
        },
        SlowUpdate:RequireDefObj('Update'),
        AvatarUpdate:RequireDefObj('Update'),
        WieldItemRaw:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_wields_item"
            },
            after_effects:[{
                if:{compare_string:["null",{context_val:"itype"}]},
                then:[rune("StowItem")],
                else:[rune("WieldItem")]
            }]
            /**
            { "character", character_id },
            { "itype", itype_id },
            character / item to wield
             */
        },
        WieldItem:RequireDefObj('WieldItemRaw'),
        StowItem:RequireDefObj('WieldItemRaw'),
        WearItem:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_wears_item"
            }
            /**
            { "character", character_id },
            { "itype", itype_id },
            character / item to wield
             */
        },
        EatItem:{
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_eats_item"
            }
            /**
            { "character", character_id },
            { "itype", itype_id },
            character / NONE
            */
        },
        MoveStatus:RequireDefObj('Update'),
        IdleStatus:RequireDefObj('Update'),
        AttackStatus:RequireDefObj('Update'),
    };
    return hookMap;
}