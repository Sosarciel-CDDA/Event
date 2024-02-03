"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDefineHookMap = exports.AnyEventTypeList = exports.GlobalHookList = exports.CharHookList = exports.InteractHookList = void 0;
//Interactive
/**角色互动事件 列表 */
exports.InteractHookList = [
    "TryMeleeAtkChar", //尝试近战攻击角色
    "TryMeleeAtkMon", //尝试近战攻击怪物
    "TryRangeAtkChar", //尝试远程攻击角色
    "TryRangeAtkMon", //尝试远程攻击怪物
    "TryMeleeAttack", //尝试近战攻击
    "TryRangeAttack", //尝试远程攻击
    "TryAttack", //尝试攻击
    "SucessMeleeAttack", //近战攻击命中
    "MissMeleeAttack", //近战攻击未命中
];
/**任何角色事件 列表*/
exports.CharHookList = [
    ...exports.InteractHookList, //
    "Init", //初始化
    "Update", //刷新
    "NpcUpdate", //Npc刷新
    "SlowUpdate", //慢速秒刷新
    "TakeDamage", //受到伤害
    "DeathPrev", //死亡前 恢复生命将自动阻止死亡
    "Death", //死亡
    "EnterBattle", //进入战斗
    "LeaveBattle", //离开战斗
    "BattleUpdate", //进入战斗时 刷新
    "NonBattleUpdate", //非战斗时 刷新
    "MoveStatus", //移动状态
    "IdleStatus", //待机状态
    "AttackStatus", //攻击状态
    "WieldItemRaw", //基础手持物品
    "WieldItem", //手持非空物品
    "StowItem", //收回物品/手持空物品
    "WearItem", //穿戴物品
    "EatItem", //吃下物品
];
/**全局事件列表 列表 */
exports.GlobalHookList = [
    "AvatarMove", //玩家移动
    "AvatarUpdate", //玩家刷新
    "GameBegin", //每次进入游戏时
];
/**任何事件 列表 */
exports.AnyEventTypeList = [
    ...exports.GlobalHookList,
    ...exports.CharHookList,
];
/**生成基础事件
 * @param prefix        - 事件前缀
 * @param statusDur     - 行动状态持续时间
 * @param battleDur     - 战斗持续时间
 * @param slowCounter   - 慢速刷新间隔
 */
function genDefineHookMap(prefix, statusDur = 4, battleDur = 60, slowCounter = 60) {
    const eid = (id) => `${prefix}_${id}_EVENT`;
    const rune = (id) => ({ run_eocs: eid(id) });
    const uv = (id) => `u_${prefix}_${id}`;
    const nv = (id) => `n_${prefix}_${id}`;
    const gv = (id) => `${prefix}_${id}`;
    //默认Hook
    const defObj = {
        base_setting: {
            eoc_type: "ACTIVATION"
        }
    };
    //预定义的Hook
    const hookMap = {
        GameBegin: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "game_begin"
            }
        },
        TakeDamage: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_takes_damage"
            },
            after_effects: [{
                    if: { math: [uv("inBattle"), "<=", "0"] },
                    then: [rune("EnterBattle")],
                }, { math: [uv("inBattle"), "=", `${battleDur}`] }]
            /*
            { "character", character_id }
            { "damage", int }
            character / NONE
            */
        },
        TryMeleeAtkChar: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_melee_attacks_character"
            },
            after_effects: [rune("TryMeleeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "hits", bool },
            { "victim", character_id },
            { "victim_name", string },
            character (attacker) / character (victim)
            */
        },
        TryMeleeAtkMon: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_melee_attacks_monster"
            },
            after_effects: [rune("TryMeleeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "hits", bool },
            { "victim_type", mtype_id },
            character / monster
            */
        },
        TryMeleeAttack: {
            base_setting: {
                eoc_type: "ACTIVATION"
            },
            after_effects: [rune("TryAttack"), {
                    if: { math: ["_hits", "==", "1"] },
                    then: [rune("SucessMeleeAttack")],
                    else: [rune("MissMeleeAttack")],
                }]
        },
        SucessMeleeAttack: {
            base_setting: defObj.base_setting
        },
        MissMeleeAttack: {
            base_setting: defObj.base_setting
        },
        TryRangeAtkChar: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_ranged_attacks_character"
            },
            after_effects: [rune("TryRangeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "victim", character_id },
            { "victim_name", string },
            character (attacker) / character (victim)
            */
        },
        TryRangeAtkMon: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_ranged_attacks_monster"
            },
            after_effects: [rune("TryRangeAttack")]
            /*
            { "attacker", character_id },
            { "weapon", itype_id },
            { "victim_type", mtype_id },
            character / monster
            */
        },
        TryRangeAttack: {
            base_setting: {
                eoc_type: "ACTIVATION"
            },
            after_effects: [rune("TryAttack")]
        },
        TryAttack: {
            base_setting: defObj.base_setting,
            before_effects: [{ math: [uv("notIdleOrMoveStatus"), "=", `${statusDur}`] }],
            after_effects: [{
                    if: { math: [uv("inBattle"), "<=", "0"] },
                    then: [rune("EnterBattle")],
                }, { math: [uv("inBattle"), "=", `${battleDur}`] }]
        },
        EnterBattle: defObj,
        LeaveBattle: defObj,
        BattleUpdate: defObj,
        NonBattleUpdate: defObj,
        DeathPrev: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_dies"
            },
            after_effects: [{
                    if: { or: [{ math: ["u_hp('head')", "<=", "0"] }, { math: ["u_hp('torso')", "<=", "0"] }] },
                    then: [rune("Death")],
                    else: ["u_prevent_death"]
                }]
            /**
            { "character", character_id },
            character / NONE
            */
        },
        Death: defObj,
        AvatarMove: {
            base_setting: {
                eoc_type: "OM_MOVE"
            }
        },
        Update: {
            base_setting: {
                eoc_type: "RECURRING",
                recurrence: 1,
                global: true,
                run_for_npcs: true
            },
            before_effects: [{
                    if: { math: [uv("isInit"), "!=", "1"] },
                    then: [rune("Init"), { math: [uv("isInit"), "=", "1"] }]
                }],
            after_effects: [{
                    if: "u_is_npc",
                    then: [rune("NpcUpdate")],
                }, {
                    if: { math: [uv("inBattle"), ">", "0"] },
                    then: [rune("BattleUpdate"), { math: [uv("inBattle"), "-=", "1"] }, {
                            if: { math: [uv("inBattle"), "<=", "0"] },
                            then: [rune("LeaveBattle")],
                        }],
                    else: [rune("NonBattleUpdate")]
                }, {
                    set_string_var: { u_val: uv("char_preloc") },
                    target_var: { global_val: gv("char_preloc") }
                }, {
                    if: { compare_string: [
                            { global_val: gv("char_preloc") },
                            { mutator: "loc_relative_u", target: "(0,0,0)" }
                        ] },
                    then: [{ math: [uv("onMoveStatus"), "=", "0"] }],
                    else: [{ math: [uv("onMoveStatus"), "=", "1"] }],
                }, //更新 loc字符串
                { u_location_variable: { u_val: uv("char_preloc") } },
                {
                    if: { math: [uv("notIdleOrMoveStatus"), "<=", "0"] },
                    then: [{
                            if: { math: [uv("onMoveStatus"), ">=", "1"] },
                            then: [rune("MoveStatus")],
                            else: [rune("IdleStatus")],
                        }],
                    else: [rune("AttackStatus"), { math: [uv("notIdleOrMoveStatus"), "-=", "1"] }]
                }]
        },
        Init: defObj,
        NpcUpdate: defObj,
        SlowUpdate: {
            base_setting: {
                eoc_type: "RECURRING",
                recurrence: slowCounter,
                global: true,
                run_for_npcs: true
            }
        },
        AvatarUpdate: {
            base_setting: {
                eoc_type: "RECURRING",
                recurrence: 1
            }
        },
        WieldItemRaw: {
            base_setting: {
                eoc_type: "EVENT",
                required_event: "character_wields_item"
            },
            after_effects: [{
                    if: { compare_string: ["null", { context_val: "itype" }] },
                    then: [rune("StowItem")],
                    else: [rune("WieldItem")]
                }]
            /**
            { "character", character_id },
            { "itype", itype_id },
            character / item to wield
             */
        },
        WieldItem: defObj,
        StowItem: defObj,
        WearItem: {
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
        EatItem: {
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
        MoveStatus: defObj,
        IdleStatus: defObj,
        AttackStatus: defObj,
    };
    return hookMap;
}
exports.genDefineHookMap = genDefineHookMap;
