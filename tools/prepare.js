const { parse } = require("csv");
const fs = require("fs-extra");
const iconv = require("iconv-lite");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const force_ids = require("@jx3box/jx3box-data/data/xf/forceid.json");
const xf = require("@jx3box/jx3box-data/data/xf/xf.json");
const { range } = require("lodash");

const src = "./raw";
const dist = "./dist";

const schoolMap = force_ids;
const kungfuMap = Object.values(xf).reduce((acc, cur) => {
    if (cur.name === "山居剑意") cur.name = "问水诀";
    acc[cur.kungfuId] = cur.name;
    return acc;
}, {});

function readCsvFile(file, isObj) {
    console.time(`reading ${file}`);
    return new Promise((resolve, reject) => {
        let keys = [];
        let keyRead = false;
        const tab = isObj ? {} : [];
        fs.createReadStream(file)
            .pipe(iconv.decodeStream("gb2312"))
            .pipe(iconv.encodeStream("utf8"))
            .pipe(parse({ delimiter: "\t", quote: null }))
            .on("data", function (row) {
                if (!keyRead) {
                    // 读取第一行
                    keyRead = 1;
                    keys = row;
                } else {
                    const item = row.reduce((acc, cur, i) => {
                        const keyName = keys[i];
                        acc[keyName] = cur;
                        return acc;
                    }, {});
                    if (isObj) {
                        tab[`${item.SkillID}-${item.Level}`] = item;
                    } else {
                        tab.push(item);
                    }
                }
            })
            .on("end", function () {
                console.timeEnd(`reading ${file}`);
                resolve(tab);
            });
    });
}

async function init() {
    const skills = await readCsvFile(`${src}/skill.txt`, true);
    const points = await readCsvFile(`${src}/TenExtraPoint.tab`);
    const result = [];
    const talents = {};
    for (const point of points) {
        const school = schoolMap[point.ForceID] || '通用';
        const kungfu = kungfuMap[point.KungFuID];
        const mountID = xf[kungfu]["id"];

        let _talents = [];

        range(1, 13)
            .map(v => [`SkillID${v}`, `SkillLevel${v}`])
            .forEach(([id, level]) => {
                let skillId = `${point[id]}-${point[level]}`;
                let _skillId = `${point[id]}-0`; //取level为0
                let skill = skills[skillId];
                if (!skill) skill = skills[_skillId]; //特殊主动技能不存在level为1时，技能取level为0的项

                if (skill) {
                    const position = ((point.PointID - 1) % 12) + 1;
                    result.push({
                        name: skill.Name,
                        desc: skill.Desc, //重新过滤字段
                        position: position,
                        school,
                        kungfu,
                        skillID: point[id],
                    });

                    if (!talents[mountID]) {
                        talents[mountID] = [];
                    }
                    _talents.push(point[id]);
                }
            });
        talents[mountID].push(_talents);
    }
    // 生成 bps 奇穴
    fs.outputFileSync(`./dist/talents.json`, JSON.stringify(talents), "utf-8");

    const csvWriter = createCsvWriter({
        path: `${dist}/temp.csv`,
        header: [
            { id: "school", title: "门派" },
            { id: "kungfu", title: "心法" },
            { id: "position", title: "奇穴位置" },
            { id: "name", title: "奇穴名" },
            { id: "desc", title: "描述" },
            { id: "skillID", title: "技能ID" },
        ],
    });
    csvWriter.writeRecords(result).then(() => {
        console.log(`done`);
    });
}

init();
