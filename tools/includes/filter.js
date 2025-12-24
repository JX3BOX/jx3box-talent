//对数据库查询的desc字段进行数据加工
const _ = require("lodash");
const { isNullOrZero } = require("./utils");

function Filter(desc, datas) {
    if (!desc) return desc;
    //处理sub
    desc = filterBySub(desc, datas);
    //处理buff描述
    desc = filterByBuffDesc(desc, datas);
    //处理buff时间
    desc = filterByBuffTime(desc, datas);
    //处理其他类型的buff -- 基于skill@22635改进,2019/11/8
    desc = filterByBuffAt(desc);
    //处理额外附加攻击   -- 基于skill@22635改进,2019/11/8
    desc = filterByAdd(desc);
    //处理破招 -- 基于120版本破招改动奇穴部分
    desc = filterBySurplus(desc);
    //处理技能名词解释
    desc = filterBySkillNoun(desc, datas);
    //过滤其它<>
    desc = desc.replace(/\<.*?\>/g, "");
    //处理undefined
    desc = filterUndefined(desc);
    //替换回车符
    desc = desc.replace(/\\n/g, "<br/>");
    return desc;
}

function get_resource(type, query, datas) {
    let id_map = {
        skill: "SkillID",
        buff: "BuffID",
    };
    let primaryKey = id_map[type];
    if (!primaryKey) return [];
    return datas[type].filter(item => item[primaryKey] == query);
}

function filterBySub(desc, datas) {
    let reg = new RegExp(/\<SUB (\d+?) (\d)\>/g);
    let subreg = new RegExp(/\<SUB (\d+?) (\d)\>/);
    let hasMatched = reg.test(desc);

    if (hasMatched) {
        let arr = desc.match(reg);
        for (let i = 0; i < arr.length; i++) {
            let capture = subreg.exec(arr[i]);
            let id = capture[1];
            let level = capture[2];

            let result = get_resource("skill", id, datas);
            let skill = {};
            for (let s of result) {
                if (s.Level == level) {
                    skill = s;
                    break;
                }
            }
            if (!skill) skill = result[0];
            if (skill.Desc) {
                desc = desc.replace(arr[i], skill.Desc);
            }
        }
    }
    return desc;
}
function filterByBuffDesc(desc, datas) {
    let reg = new RegExp(/\<BUFF (\d+?) (\d+?) desc>/);
    let hasMatched = reg.test(desc);
    if (hasMatched) {
        let capture = reg.exec(desc);
        let id = capture[1];
        let level = capture[2];
        let result = get_resource("buff", id, datas);
        let buff = {};

        // 看看有没有等级符合的，没有就就随便取一个有Desc的
        for (let b of result) {
            if (b.Level == level) {
                buff = b;
                break;
            }
        }
        if (!buff || !buff.desc) buff = result.find(item => item.Desc);

        if (buff) {
            desc = desc.replace(reg, buff.Desc);
        }
    }
    return desc;
}
function filterByBuffTime(desc, datas) {
    let reg = new RegExp(/\<BUFF (\d+?) (\d?)\ time>/);
    let buffTimeReg = new RegExp(/\<BUFF (\d+?) (\d?)\ time>/g);
    let hasMatched = reg.test(desc);
    if (hasMatched) {
        let capture = reg.exec(desc);
        let id = capture[1];

        let result = get_resource("buff", id, datas);

        // buff 持续时间 示例 持续1秒-5秒
        const _capture = desc.match(buffTimeReg);

        _capture.forEach(cap => {
            const tmp = reg.exec(cap);

            let buff =
                result.find(
                    item =>
                        item.Level == Number(tmp[2]) &&
                        !isNullOrZero(item.Interval)
                ) || result[0];
            if (!buff.Interval) buff = result[1];
            let time =
                (parseInt(buff.Interval) / 16) * parseInt(buff.Count) + "秒";
            desc = desc.replace(reg, time);
        });
    }
    return desc;
}
function filterBySurplus(desc, datas) {
    let reg = new RegExp(/\<SUR (.+?)\>/);
    let subreg = new RegExp(/\<SUR (.+?)\>/g);
    let hasMatched = reg.test(desc);
    if (hasMatched) {
        const _capture = desc.match(subreg);
        _capture.forEach(cap => {
            let k = reg.exec(cap);
            let surDate = "（" + parseFloat(k[1]) + "*破招系数*破招值）";
            desc = desc.replace(reg, surDate);
            //"xx".replace(/\<SUR (.+)\>/, "$1×破招系数×破招值")
            console.log(desc);
        });
    }
    return desc;
}
//(+<SKILLEx {D0} {TotalPhysicsAP 0.3906}>)
function filterByAdd(desc) {
    let reg = new RegExp(/\(\+\<SKILLEx.*?\>\)/g);
    let hasMatched = reg.test(desc);

    if (hasMatched) {
        desc = desc.replace(reg, "");
    }
    return desc;
}
//<BUFF atCallPhysicsDamage>
function filterByBuffAt(desc) {
    let reg = new RegExp(/<BUFF at.*?>/g);
    let hasMatched = reg.test(desc);

    if (hasMatched) {
        desc = desc.replace(reg, "");
    }
    return desc;
}

// 处理技能名词解释 <NounID xx>
function filterBySkillNoun(desc, datas) {
    let reg = new RegExp(/\<NounID (\d+)\>/g);
    let subreg = new RegExp(/\<NounID (\d+)\>/);
    let hasMatched = reg.test(desc);

    if (hasMatched) {
        let arr = desc.match(reg);
        for (let i = 0; i < arr.length; i++) {
            let capture = subreg.exec(arr[i]);
            let id = capture[1];

            let noun = datas.skill_nouns && datas.skill_nouns[id];
            if (noun && noun.szName) {
                // 只保留名称，格式：[名称]
                desc = desc.replace(arr[i], `[${noun.szName}]`);
            } else {
                desc = desc.replace(arr[i], "");
            }
        }
    }
    return desc;
}

function filterUndefined(desc) {
    return desc.replace(/undefined/g, "*");
}

module.exports = Filter;
