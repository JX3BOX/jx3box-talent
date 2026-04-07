const ZHCN_NUM = [
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
    "十一",
    "十二",
];

const sortNumericKeys = keys =>
    keys.sort((a, b) => Number(a) - Number(b));

const buildPointOrderMap = (points, groupKey = "KungFuID") => {
    const point_map = {};

    points.forEach(point => {
        const group_id = point[groupKey];
        const point_id = Number(point.PointID);
        if (!group_id || !point_id) return;

        if (!point_map[group_id]) {
            point_map[group_id] = new Set();
        }
        point_map[group_id].add(point_id);
    });

    return Object.keys(point_map).reduce((acc, group_id) => {
        acc[group_id] = {};
        [...point_map[group_id]]
            .sort((a, b) => a - b)
            .forEach((point_id, index) => {
                acc[group_id][point_id] = index + 1;
            });
        return acc;
    }, {});
};

const buildNullTalent = result => {
    const sample = Object.values(result).find(item => item && Object.keys(item).length);
    if (!sample) return {};

    return sortNumericKeys(Object.keys(sample)).reduce((acc, order, index) => {
        const current = sample[order];
        acc[order] = {};

        if (current._type) {
            acc[order]._type = current._type;
        }
        if (current._follow) {
            acc[order]._follow = current._follow;
            return acc;
        }

        acc[order][1] = {
            name: `第${ZHCN_NUM[index] || index + 1}重`,
            icon: null,
        };

        return acc;
    }, {});
};

module.exports = {
    buildPointOrderMap,
    buildNullTalent,
};
