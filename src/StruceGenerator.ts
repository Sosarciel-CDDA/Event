import { Eoc, EocEffect, GenericExpr, Hobby, JM, Mutation, TalkTopic } from "@sosarciel-cdda/schema";



/**构造一个{...Prop}[]的全局对象数组结构 */
export const listCtor = <
    Id extends string,
    Prop extends readonly string[],
>(opt:{
    /**数组ID */
    id:Id;
    /**数组成员属性 */
    prop:Prop;
})=>{
    const {prop,id} = opt;
    const length = `${id}_Length` as const;
    const eachIdx  = `${id}_EachIndex` as const;
    const isVaildPtr = `${id}_IsVaildPtr` as const;

    type FixedProp = [...Prop,"IsVaild"];
    const fixedProp = [...prop,"IsVaild"] as FixedProp;

    /**获取位于某位置的成员变量名 */
    const where = (numstr:string)=> fixedProp.reduce((acc,cur)=>
        ({...acc,[cur]:`${id}_${numstr}_${cur}`}),{}) as {
            [K in FixedProp[number]]:`${Id}_${number}_${K}`};

    /**将当前循环下标的成员变量置入target表达式对象 */
    const setEachIdxPtr = (prop:FixedProp[number],traget:GenericExpr)=>
        ({set_string_var:(where(`<global_val:${eachIdx}>`) as any)[prop],
            target_var:traget,parse_tags:true}) satisfies EocEffect;

    /**生成一个遍历列表的eoc
     * 使用 eachIdx 访问当前下标变量名
     */
    const genEachEoc = (
        eid:string,effect:EocEffect[]
    )=>({
        type:"effect_on_condition",
        id:`${id}_Each_${eid}`,
        eoc_type:"ACTIVATION",
        effect:[
            {math:[eachIdx,'=','0']},
            {run_eocs:{
                id:`${id}_Each_${eid}_Until`,
                eoc_type:'ACTIVATION',
                effect:[
                    {math:[eachIdx,'+=','1']},
                    ...effect,
                ],
            }, iterations: {math:[length]}}
        ],
    }) satisfies Eoc;

    /**生成一个遍历列表有效部分的eoc
     * 使用 eachIdx 访问当前下标变量名
     */
    const genEachVaildEoc = (
        eid:string,effect:EocEffect[]
    )=>genEachEoc(eid,[
        setEachIdxPtr('IsVaild',{context_val:isVaildPtr}),
        {if:{math:[`v_${isVaildPtr}`,'==','1']},then:[
            ...effect]}
    ]);

    const firstUnvaildDone = `${id}_firstUnvaild_Done` as const;
    /**生成一段在首个失效idx运行的eoc
     * 若均有效则会分配一个超length的idx, 然后使length自增
     * 使用 eachIdx 访问当前下标变量名
     */
    const genFirstUnvaildEoc = (eid:string,effect:EocEffect[])=>({
        type:"effect_on_condition",
        id:`${id}_FirstUnvaild_${eid}`,
        eoc_type:"ACTIVATION",
        effect:[
            {math:[eachIdx,'=','0']},
            {math:[firstUnvaildDone,'=','0']},
            {run_eocs:{
                id:`${id}_FirstUnvaild_${eid}_Until`,
                eoc_type:'ACTIVATION',
                effect:[
                    {math:[eachIdx,'+=','1']},
                    setEachIdxPtr('IsVaild',{context_val:isVaildPtr}),
                    {if:{math:[`v_${isVaildPtr}`,'!=','1']},then:[
                        ...effect,
                        {math:[firstUnvaildDone,'=','1']}]},
                    {if:{math:[eachIdx,'==',`${length}+1`]},then:[
                        {math:[length,'+=','1']}]},
                ],
            },
            iterations: {math:[`${length}+1`]},
            condition:{math:[firstUnvaildDone,'!=','1']}}
        ],
    }) satisfies Eoc;

    return {
        length,eachIdx,
        where,setEachIdxPtr,
        genEachEoc,genEachVaildEoc,genFirstUnvaildEoc
    };
}


export type SetupData = {
    /**变量名 */
    var   :string;
    /**描述 */
    desc  :string;
    /**默认值 */
    def   :string;
    /**设置后效果 */
    effect?:EocEffect[];
}

/**生成初始化菜单 */
export const setupCtor = (opt:{
    table:SetupData[];
    /**id前缀 */
    prefix:string;
    /**topic消息 */
    message :string;
    /**变异名称 */
    menuName:string;
})=>{
    const {message,menuName,prefix,table} = opt;

    const defSetupEoc:Eoc = {
        id:`${prefix}_EOC_DefaultSetup`,
        type:"effect_on_condition",
        eoc_type:"ACTIVATION",
        effect:table.flatMap(v=>[
            {math:[v.var,'=',v.def]},
            ...v.effect??[],
        ] satisfies EocEffect[]),
    }

    const customSetupEoc:Eoc = {
        id:`${prefix}_EOC_CustomSetup`,
        type:"effect_on_condition",
        eoc_type:"ACTIVATION",
        effect:table.flatMap(v=>[
            {math:[v.var,'=',JM.numInput(`'${v.var} ${v.desc}'`,v.def)]},
            ...v.effect??[],
        ] satisfies EocEffect[]),
    }

    const setMutId = `${prefix}_MUT_SetupMenu`;
    const setupTopic = {
        id:`${prefix}_TOPIC_SetupTopic`,
        type:'talk_topic',
        dynamic_line:`&${message} 当前:\n${table.map(v=>`${v.desc}\n${v.var} : <global_val:${v.var}>`).join('\n')}`,
        responses:[
            {topic: "TALK_DONE",text:"不做改变"    ,condition:{u_has_trait:setMutId}},
            {topic: "TALK_DONE",text:"使用默认设置",effect:{run_eocs:[defSetupEoc.id]}},
            {topic: "TALK_DONE",text:"自定义设置"  ,effect:{run_eocs:[customSetupEoc.id]}},
        ]
    } satisfies TalkTopic;

    const openSettingEoc:Eoc = {
        id:`${prefix}_EOC_OpenSetting`,
        type:"effect_on_condition",
        eoc_type:"ACTIVATION",
        effect:[{open_dialogue:{topic:setupTopic.id}}]
    }

    const setupMut: Mutation = {
        id: setMutId,
        type: "mutation",
        name: menuName,
        description: menuName,
        points: 0, purifiable: false, valid: false, active: true,
        activated_eocs: [openSettingEoc.id],
    };

    const setupEoc:Eoc = {
        id:`${prefix}_EOC_SetupMain`,
        type:"effect_on_condition",
        eoc_type:"RECURRING",
        recurrence:1,
        global:true,
        run_for_npcs:false,
        condition:{and:['u_is_avatar',{not:{u_has_trait:setMutId}}]},
        deactivate_condition:{or:[{u_has_trait:setMutId},{not:'u_is_avatar'}]},
        effect:[
            { run_eocs:[openSettingEoc.id] },
            { u_add_trait:setMutId },
        ],
    }

    return [defSetupEoc,customSetupEoc,setupTopic,openSettingEoc,setupMut,setupEoc]
}


/**生成一串建立开局背景触发效果的数据 */
export const genGameBeginHobbyDataList = (opt:{
    /**id前缀 */
    prefix:string;
    /**数据id */
    id:string;
    /**背景名 */
    name:string;
    /**背景描述 */
    desc:string;
    /**触发效果 */
    effect:EocEffect[],
})=>{
    const {id,name,desc,effect,prefix} = opt;
    const mutid = `${prefix}_MUT_${id}`;
    return [
        {
            id:`${prefix}_HOBBY_${id}`,
            type:"profession",
            subtype:"hobby",
            name:name,
            description:desc,
            points:0,
            traits:[mutid]
        } satisfies Hobby,
        {
            id:mutid,
            type:"mutation",
            name:name,
            description:desc,
            points:0,
            purifiable:false,
            valid:false,
            player_display:false,
        } satisfies Mutation,
        {
            id:`${prefix}_EOC_${id}`,
            type:"effect_on_condition",
            eoc_type:"EVENT",
            required_event:"game_begin",
            effect:[
                ...effect,
                {u_lose_trait: mutid},
            ],
            condition:{u_has_trait:mutid}
        } satisfies Eoc,
    ];
}