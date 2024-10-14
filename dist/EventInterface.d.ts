import { BoolObj, EocEffect, EocType } from "cdda-schema";
/**角色互动事件 列表 */
export declare const InteractHookList: readonly ["TryMeleeAtkChar", "TryMeleeAtkMon", "TryRangeAtkChar", "TryRangeAtkMon", "TryMeleeAttack", "TryRangeAttack", "TryAttack", "SucessMeleeAttack", "MissMeleeAttack"];
/**角色互动事件
 * u为角色 n为目标角色
 */
export type InteractHook = typeof InteractHookList[number];
/**任何角色事件 列表*/
export declare const CharHookList: readonly ["TryMeleeAtkChar", "TryMeleeAtkMon", "TryRangeAtkChar", "TryRangeAtkMon", "TryMeleeAttack", "TryRangeAttack", "TryAttack", "SucessMeleeAttack", "MissMeleeAttack", "Init", "Update", "NpcUpdate", "SlowUpdate", "TakeDamage", "LowHp", "NearDeath", "DeathPrev", "Death", "EnterBattle", "LeaveBattle", "BattleUpdate", "NonBattleUpdate", "MoveStatus", "IdleStatus", "AttackStatus", "WieldItemRaw", "WieldItem", "StowItem", "WearItem", "EatItem"];
/**任何角色事件
 * u为角色 n未定义
 */
export type CharHook = typeof CharHookList[number];
/**仅Npc事件 列表 */
export declare const NpcHookList: readonly ["NpcDeathPrev"];
/**仅Npc事件
 * u为Npc n未定义
 */
export type NpcHook = typeof NpcHookList[number];
/**全局事件列表 列表 */
export declare const GlobalHookList: readonly ["AvatarMove", "AvatarUpdate", "AvatarDeathPrev", "GameBegin", "GameStart"];
/**全局事件
 * u为主角 n未定义
 */
export type GlobalHook = typeof GlobalHookList[number];
/**任何事件 列表 */
export declare const AnyEventTypeList: readonly ["AvatarMove", "AvatarUpdate", "AvatarDeathPrev", "GameBegin", "GameStart", "TryMeleeAtkChar", "TryMeleeAtkMon", "TryRangeAtkChar", "TryRangeAtkMon", "TryMeleeAttack", "TryRangeAttack", "TryAttack", "SucessMeleeAttack", "MissMeleeAttack", "Init", "Update", "NpcUpdate", "SlowUpdate", "TakeDamage", "LowHp", "NearDeath", "DeathPrev", "Death", "EnterBattle", "LeaveBattle", "BattleUpdate", "NonBattleUpdate", "MoveStatus", "IdleStatus", "AttackStatus", "WieldItemRaw", "WieldItem", "StowItem", "WearItem", "EatItem", "NpcDeathPrev"];
/**任何事件
 * u n 均未定义
 */
export type AnyHook = typeof AnyEventTypeList[number];
/**一个Hook */
export type HookObj = {
    /**基础设置 */
    base_setting: {
        /**eoc类型 */
        eoc_type: EocType;
        /**条件 */
        condition?: BoolObj;
        /**event依赖 */
        required_event?: string;
        /**刷新间隔/秒 */
        recurrence?: number;
        /**全局刷新 */
        global?: true;
        /**运行于npc */
        run_for_npcs?: true;
    };
    /**运行此事件前将会附带调用的EocEffect */
    before_effects?: EocEffect[];
    /**运行此事件后将会附带调用的EocEffect */
    after_effects?: EocEffect[];
    /**前置的hook */
    require_hook?: AnyHook[];
};
/**Hook设定 */
export type HookOpt = {
    /**行动状态持续时间 默认 4 */
    statusDur: number;
    /**战斗持续时间 默认 60 */
    battleDur: number;
    /**慢速刷新间隔 默认 60 */
    slowCounter: number;
    /**启用移动状态 默认 true */
    enableMoveStatus: boolean;
    /**低血量事件血量阈值 默认 33% */
    lowHpThreshold: number;
    /**濒死事件血量阈值 默认 10% */
    nearDeathThreshold: number;
};
/**生成基础事件
 * @param prefix        - 事件前缀
 * @param opt           - 设定
 */
export declare function genDefineHookMap(prefix: string, opt?: Partial<HookOpt>): Record<"TryMeleeAtkChar" | "TryMeleeAtkMon" | "TryRangeAtkChar" | "TryRangeAtkMon" | "TryMeleeAttack" | "TryRangeAttack" | "TryAttack" | "SucessMeleeAttack" | "MissMeleeAttack" | "Init" | "Update" | "NpcUpdate" | "SlowUpdate" | "TakeDamage" | "LowHp" | "NearDeath" | "DeathPrev" | "Death" | "EnterBattle" | "LeaveBattle" | "BattleUpdate" | "NonBattleUpdate" | "MoveStatus" | "IdleStatus" | "AttackStatus" | "WieldItemRaw" | "WieldItem" | "StowItem" | "WearItem" | "EatItem" | "NpcDeathPrev" | "AvatarMove" | "AvatarUpdate" | "AvatarDeathPrev" | "GameBegin" | "GameStart", HookObj>;
