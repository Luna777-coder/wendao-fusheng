const gameData = {
    day: 1,
    money: 1000,
    equipment: [],
    hideouts: 1,
    team: [],
    missions: [],
    weather: "晴朗"
};

const names = ["张无尘", "李寻月", "楚留香", "陆小凤", "令狐川", "杨过云", "郭青", "萧峰", "段誉", "虚竹"];
const weatherList = ["晴朗", "阴云", "小雨", "雷暴"];

const personalities = {
    loyal: { name: "忠诚", icon: "守", patience: 3, praiseValue: 3, concernValue: 2 },
    proud: { name: "骄傲", icon: "傲", patience: 2, praiseValue: 1, concernValue: 1 },
    calm: { name: "沉稳", icon: "稳", patience: 3, praiseValue: 2, concernValue: 2 },
    hot: { name: "急躁", icon: "烈", patience: 1, praiseValue: 2, concernValue: 0 },
    cunning: { name: "狡黠", icon: "谋", patience: 2, praiseValue: 1, concernValue: 2 }
};

const moods = ["愉悦", "平静", "疲惫", "兴奋", "沮丧", "愤怒"];

const dialogLines = {
    loyal: {
        greeting: ["队长，属下在。", "今日若有安排，我会尽力完成。", "只要队伍需要，我随时可以出发。"],
        impatient: ["队长，我不是推辞，只是今日已经说得够多了。", "若没有要紧事，我想先去整备。"],
        praise: ["多谢队长肯定，我会记在心里。", "能被队长认可，这趟辛苦值得。"],
        concern: ["队长还记得我的状态，在下感激。", "我会休整好，不拖队伍后腿。"],
        mission: ["任务我会接，但队伍也要留后手。", "我会按计划行事。"]
    },
    proud: {
        greeting: ["找我？若是难事，倒可以说说。", "普通任务别浪费我的时间。", "我正在调息，长话短说。"],
        impatient: ["队长，一直闲聊只会耽误修行。", "若只是重复夸奖，就到此为止吧。"],
        praise: ["你的眼光还算不错。", "这种程度的表现，本就是我该做到的。"],
        concern: ["我没那么脆弱，不过你能注意到也算有心。", "状态我自己清楚，不必过分担心。"],
        mission: ["把最难的交给我，别让我无聊。", "可以，但报酬要配得上风险。"]
    },
    calm: {
        greeting: ["队长，有何吩咐？", "我刚复盘完上次任务，正好可以谈谈。", "若要行动，先看天气和队伍疲劳。"],
        impatient: ["同一件事反复说，收益不大。", "今日心神有限，还是把时间用在要事上。"],
        praise: ["认可很重要，但更重要的是下次少犯错。", "谢谢，队伍稳定才是根本。"],
        concern: ["我会调整节奏，避免积劳成伤。", "队长能关心细节，这是好事。"],
        mission: ["此事可行，但最好避开最坏天气。", "先确认队员疲劳，再决定是否出发。"]
    },
    hot: {
        greeting: ["有活就说，别绕弯。", "我手正痒，最好是能打的任务。", "队长，今天别让我闲着。"],
        impatient: ["还聊？不如去打一场。", "我真受不了磨磨唧唧。"],
        praise: ["哈哈，这话我爱听。", "知道我厉害就行。"],
        concern: ["我没事，别把我当伤员。", "休息？等我打完再说。"],
        mission: ["走，现在就走。", "这任务听着够劲。"]
    },
    cunning: {
        greeting: ["队长找我，想必不是小事。", "先说收益，再说风险。", "我可以出主意，但要看值不值得。"],
        impatient: ["队长，话说多了就不值钱了。", "若没有新情报，我建议先停。"],
        praise: ["夸奖我收下，实际好处也别忘。", "队长会用人，这点我认可。"],
        concern: ["关心是假，想让我多卖力是真吧？不过我领情。", "我会留着力气，关键时候才好用。"],
        mission: ["正面硬上未必划算，可以绕一手。", "给我一点时间，我能把损失压低。"]
    }
};

class Character {
    constructor(name, level = 1) {
        this.name = name;
        this.level = level;
        this.cultivation = level * 10;
        this.personality = randomKey(personalities);
        this.mood = randomItem(moods);
        this.loyalty = 50 + Math.random() * 30;
        this.experience = 0;
        this.fatigue = 0;
        this.talksToday = 0;
        this.lastTalkDay = 0;
        this.lastInteraction = "";
    }

    resetDailyInteraction() {
        if (this.lastTalkDay !== gameData.day) {
            this.talksToday = 0;
            this.lastInteraction = "";
            this.lastTalkDay = gameData.day;
        }
    }

    getPatienceLimit() {
        const base = personalities[this.personality].patience;
        const fatiguePenalty = this.fatigue >= 70 ? 1 : 0;
        const moodPenalty = ["疲惫", "愤怒", "沮丧"].includes(this.mood) ? 1 : 0;
        return Math.max(1, base - fatiguePenalty - moodPenalty);
    }

    talk(action) {
        this.resetDailyInteraction();

        const repeated = this.lastInteraction === action;
        const patienceLimit = this.getPatienceLimit();
        const overTalked = this.talksToday >= patienceLimit;
        this.talksToday += 1;
        this.lastInteraction = action;

        if (overTalked || repeated && this.talksToday > 1) {
            this.mood = this.fatigue > 70 ? "愤怒" : "沮丧";
            this.loyalty = Math.max(0, this.loyalty - (repeated ? 2 : 1));
            return `${randomItem(dialogLines[this.personality].impatient)}\n（重复打扰让他有些不耐烦，忠诚下降。）`;
        }

        if (action === "praise") {
            const gain = this.getInteractionGain("praise");
            this.loyalty = Math.min(100, this.loyalty + gain);
            this.mood = gain > 0 ? "愉悦" : this.mood;
            return `${randomItem(dialogLines[this.personality].praise)}\n（忠诚 ${gain > 0 ? "+" + gain : "没有变化"}。）`;
        }

        if (action === "concern") {
            const gain = this.getInteractionGain("concern");
            const recovery = this.fatigue > 40 ? 15 : 5;
            this.loyalty = Math.min(100, this.loyalty + gain);
            this.fatigue = Math.max(0, this.fatigue - recovery);
            this.mood = "平静";
            return `${randomItem(dialogLines[this.personality].concern)}\n（疲劳 -${recovery}，忠诚 ${gain > 0 ? "+" + gain : "没有变化"}。）`;
        }

        if (action === "mission") {
            return randomItem(dialogLines[this.personality].mission);
        }

        return this.greet();
    }

    getInteractionGain(type) {
        let gain = personalities[this.personality][`${type}Value`];
        if (this.mood === "疲惫") gain -= 1;
        if (this.mood === "愤怒") gain -= 2;
        if (this.loyalty >= 85) gain -= 1;
        return Math.max(0, gain);
    }

    greet() {
        this.resetDailyInteraction();
        const weatherComment = {
            晴朗: this.mood === "愉悦" ? "今日天色不错，适合行动。" : "",
            阴云: "天色阴沉，行事要留三分余地。",
            小雨: "雨路难行，队伍要注意体力。",
            雷暴: this.personality === "hot" ? "这天气倒是合我胃口。" : "雷声太近，还是谨慎些好。"
        };
        const line = randomItem(dialogLines[this.personality].greeting);
        return weatherComment[gameData.weather] ? `${line} ${weatherComment[gameData.weather]}` : line;
    }

    completeMission(difficulty) {
        this.experience += difficulty * 10;
        this.fatigue = Math.min(100, this.fatigue + difficulty * 15);

        if (this.experience >= this.level * 100) {
            this.level++;
            this.cultivation += 10;
            this.experience = 0;
            this.mood = "兴奋";
            return;
        }

        this.mood = this.fatigue > 80 ? "疲惫" : randomItem(["愉悦", "平静", "兴奋"]);
    }

    rest() {
        this.resetDailyInteraction();
        this.talksToday += 1;
        this.fatigue = Math.max(0, this.fatigue - 30);
        this.mood = "平静";
    }
}

class Mission {
    constructor(id, name, difficulty, reward) {
        this.id = id;
        this.name = name;
        this.difficulty = difficulty;
        this.reward = reward;
        this.requiredLevel = difficulty;
        this.inProgress = false;
        this.description = randomItem([
            "山中发现妖兽踪迹，需要前往清剿。",
            "城中有恶霸作乱，需要除暴安良。",
            "护送商队前往邻城，防范山贼。",
            "采集稀有灵草，用于炼制丹药。",
            "探索古洞府，寻找前辈遗留宝物。"
        ]);
    }
}

function initGame() {
    recruitMember(true);
    recruitMember(true);
    generateMissions();
    updateUI();
}

function recruitMember(free = false) {
    if (!free && gameData.money < 500) {
        showNotification("灵石不足，需要 500 灵石。");
        return;
    }

    if (gameData.team.length >= 4) {
        showNotification("小队已满，最多 4 人。");
        return;
    }

    const member = new Character(randomItem(names), 1);
    gameData.team.push(member);
    if (!free) gameData.money -= 500;
    showNotification(`${member.name} 加入了小队。`);
    updateUI();
}

function generateMissions() {
    const missionTypes = [
        { name: "清剿妖兽", difficulty: 1, reward: 200 },
        { name: "护送商队", difficulty: 2, reward: 400 },
        { name: "除暴安良", difficulty: 2, reward: 350 },
        { name: "采集灵草", difficulty: 3, reward: 600 },
        { name: "探索洞府", difficulty: 4, reward: 1000 }
    ];

    gameData.weather = randomItem(weatherList);
    gameData.missions = Array.from({ length: 4 }, (_, index) => {
        const type = randomItem(missionTypes);
        return new Mission(index, type.name, type.difficulty, type.reward);
    });
}

function startMission(missionId) {
    const mission = gameData.missions.find(item => item.id === missionId);
    const averageLevel = gameData.team.reduce((sum, member) => sum + member.level, 0) / gameData.team.length;

    if (averageLevel < mission.requiredLevel) {
        showNotification(`队伍平均等级不足，需要 ${mission.requiredLevel} 级。`);
        return;
    }

    if (gameData.missions.some(item => item.inProgress)) {
        showNotification("已有任务正在进行。");
        return;
    }

    mission.inProgress = true;
    updateUI();
    setTimeout(() => completeMission(mission), 2200);
}

function completeMission(mission) {
    mission.inProgress = false;
    gameData.money += mission.reward;
    gameData.day += 1;
    gameData.team.forEach(member => member.completeMission(mission.difficulty));
    showNotification(`第 ${gameData.day - 1} 天任务完成，获得 ${mission.reward} 灵石。`);
    generateMissions();
    updateUI();
}

function interactWithCharacter(member) {
    document.getElementById("character-avatar").textContent = personalities[member.personality].icon;
    document.getElementById("character-name").textContent = `${member.name}（${personalities[member.personality].name}）`;
    document.getElementById("character-status").innerHTML = getCharacterStatus(member);
    document.getElementById("dialog-content").textContent = member.greet();

    const choices = document.getElementById("dialog-choices");
    choices.innerHTML = "";
    [
        { text: "表扬一番", action: "praise" },
        { text: "关心状态", action: "concern" },
        { text: "询问任务看法", action: "mission" },
        { text: "安排休息", action: "rest" }
    ].forEach(option => {
        const button = document.createElement("button");
        button.className = "dialog-choice";
        button.textContent = option.text;
        button.addEventListener("click", () => handleDialogChoice(member, option.action));
        choices.appendChild(button);
    });

    document.getElementById("dialog-overlay").classList.remove("hidden");
}

function handleDialogChoice(member, action) {
    const content = document.getElementById("dialog-content");

    if (action === "rest") {
        member.rest();
        content.textContent = `${member.name} 去休息了，疲劳下降。今日再继续打扰，可能会影响心情。`;
    } else {
        content.textContent = member.talk(action);
    }

    document.getElementById("character-status").innerHTML = getCharacterStatus(member);
    updateUI();
}

function getCharacterStatus(member) {
    member.resetDailyInteraction();
    return `
        修为：${member.cultivation} | 等级：${member.level}<br>
        心情：${member.mood} | 忠诚：${Math.round(member.loyalty)}% | 疲劳：${Math.round(member.fatigue)}%<br>
        今日耐心：${member.talksToday}/${member.getPatienceLimit()}
    `;
}

function closeDialog() {
    document.getElementById("dialog-overlay").classList.add("hidden");
}

function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.remove("hidden");
    setTimeout(() => notification.classList.add("hidden"), 2600);
}

function updateUI() {
    document.getElementById("money").textContent = gameData.money;
    document.getElementById("equipment-count").textContent = gameData.equipment.length;
    document.getElementById("hideout-count").textContent = gameData.hideouts;
    document.getElementById("weather").textContent = `${gameData.weather} / 第 ${gameData.day} 天`;

    const teamContainer = document.getElementById("team-members");
    teamContainer.innerHTML = "";
    gameData.team.forEach(member => {
        member.resetDailyInteraction();
        const card = document.createElement("article");
        card.className = "member-card";
        card.innerHTML = `
            <div class="member-header">
                <span class="member-name">${personalities[member.personality].icon} ${member.name}</span>
                <span class="member-level">Lv.${member.level}</span>
            </div>
            <div class="member-stats">修为：${member.cultivation} | 忠诚：${Math.round(member.loyalty)}%</div>
            <div class="member-mood">心情：${member.mood} | 疲劳：${Math.round(member.fatigue)}% | 今日互动：${member.talksToday}/${member.getPatienceLimit()}</div>
        `;
        card.addEventListener("click", () => interactWithCharacter(member));
        teamContainer.appendChild(card);
    });

    const missionContainer = document.getElementById("mission-list");
    missionContainer.innerHTML = "";
    gameData.missions.forEach(mission => {
        const card = document.createElement("article");
        card.className = "mission-card";
        card.innerHTML = `
            <div class="mission-header">
                <span class="mission-name">${mission.name}</span>
                <span class="mission-reward">+${mission.reward} 灵石</span>
            </div>
            <div class="mission-desc">${mission.description}</div>
            <div class="mission-requirement">难度：${"★".repeat(mission.difficulty)} | 需要等级：${mission.requiredLevel}</div>
            <button class="mission-btn" ${mission.inProgress ? "disabled" : ""}>
                ${mission.inProgress ? "进行中..." : "开始任务"}
            </button>
        `;
        card.querySelector("button").addEventListener("click", () => startMission(mission.id));
        missionContainer.appendChild(card);
    });

    const recruitButton = document.getElementById("recruit-btn");
    recruitButton.disabled = gameData.money < 500 || gameData.team.length >= 4;
}

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function randomKey(object) {
    return randomItem(Object.keys(object));
}

document.getElementById("recruit-btn").addEventListener("click", () => recruitMember(false));
document.getElementById("dialog-overlay").addEventListener("click", event => {
    if (event.target.id === "dialog-overlay") closeDialog();
});

initGame();
