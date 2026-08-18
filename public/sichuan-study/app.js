/**
 * 2027 四川紧缺选调生 · 智能备考全栈与移动端自闭环系统
 * 支持：移动端深度适配卡片布局、实时系统日期、全自定义任务分类、防输入中断、LocalStorage离线持久化与在线一键部署
 */

// 完整内嵌备考知识库与题库（确保在线纯静态部署时 100% 具备全部功能）
const EMBEDDED_KNOWLEDGE = {
  "candidate_profile": {
    "name": "考生",
    "school": "中山大学（硕士研究生）",
    "major": "085704 测绘工程（遥感/地理信息/测绘类）",
    "exam_date": "2026-10-25",
    "start_date": "2026-08-18",
    "volunteers": [
      {"rank": 1, "target": "成都市直 / 四川省直部门", "strategy": "冲击梯队，利用1:3差额进面红利"},
      {"rank": 2, "target": "绵阳市", "strategy": "保底流转，省合格线即全员进面"},
      {"rank": 3, "target": "德阳市 / 眉山市等环蓉城市", "strategy": "备选保底，多轮递补调剂机会极大"}
    ]
  },
  "policy_and_exam": {
    "title": "四川紧缺选调政策与考情概览",
    "summary": "闭卷机考，仅考一科《综合能力测试》，满分100分（70分客观题+30分公文主观题）。",
    "score_structure": [
      {"type": "单选题", "count": 60, "score_each": 0.8, "total": 48, "desc": "以习思想、行政法、经济与常识为主，秒选率高"},
      {"type": "多选题", "count": 10, "score_each": 1.2, "total": 12, "desc": "错选、多选、少选均不得分！拉开高分差距的关键战场"},
      {"type": "判断题", "count": 10, "score_each": 1.0, "total": 10, "desc": "时政与公基定性表述"},
      {"type": "公文写作", "count": 1, "score_each": 30.0, "total": 30, "desc": "实务公文大题（通知、方案、宣讲稿等），格式极其严苛"}
    ],
    "volunteer_rule": "第一志愿必须在省直或成都市直二选一（1:3进面）。若第一志愿未进面，第二、三志愿自动升级为第一志愿，非成都地市合格即进面！",
    "target_agencies": [
      "四川省自然资源厅 / 成都市规划和自然资源局（国土空间规划、耕地保护、遥感测绘）",
      "四川省应急管理厅 / 成都市应急管理局（防灾减灾、地质灾害应急遥感监测）",
      "生态环境厅 / 气象局（生态红线、遥感监测）",
      "各区县不限专业优质党政机关岗位"
    ]
  },
  "official_documents": [
    {
      "type": "通知 (下行文)",
      "usage": "传达要求下级机关办理和需要有关单位周知或者执行的事项，任免人员。",
      "template": `【发文机关标志】中共成都市委办公厅文件
【发文字号】成委办发〔2026〕12号
──────────────────────────────────────────────────────────
【标题】关于开展防范地质灾害专项安全检查的通知
【主送机关】各区、市、县人民政府，市级各部门：
【正文引言】当前，我市已进入主汛期，地质灾害防治形势十分严峻。为切实保障人民群众生命财产安全……现将有关事项通知如下：
【一级标题】一、 工作目标
【二级标题】（一） 全面排查隐患……
【一级标题】二、 检查范围与重点
【一级标题】三、 工作要求
【发文机关署名】成都市人民政府
【成文日期】2026年9月10日
【印章】盖在署名和日期上（泥顶双行，兵不血刃）`,
      "key_points": "发文字号六角括号〔〕，不写‘第’字；成文日期必须用阿拉伯数字；各级标题层级：一、 / （一） / 1. / （1）。"
    },
    {
      "type": "请示 (上行文)",
      "usage": "向上级机关请求指示、批准。",
      "template": `【发文机关标志】成都市规划和自然资源局文件
【发文字号】成自然资请〔2026〕5号
──────────────────────────────────────────────────────────
【标题】关于申请追加应急测绘保障专项资金的请示
【主送机关】四川省自然资源厅：
【正文请示原因】今年入汛以来，我市部分山区地质灾害频发，现有应急测绘设备和保障资金难以满足当前高频次的灾害监测要求……
【请示事项】为此，特申请追加应急测绘专项保障资金50万元，用于购买无人机遥感监测设备及野外作业补贴……
【期复结语】妥否，请批示。
【发文机关署名】成都市规划和自然资源局
【成文日期】2026年9月15日`,
      "key_points": "只能主送一个上级机关（不可多头请示）；不得抄送下级机关；一文一事；结语用‘妥否，请批示’或‘当否，请批示’。"
    },
    {
      "type": "报告 (上行文)",
      "usage": "向上级机关汇报工作、反映情况、回复上级机关的询问。",
      "template": `关于2026年上半年全省自然资源监测工作情况的报告
四川省人民政府：
    按照省政府统一工作部署，我厅扎实推进全省自然资源遥感监测与耕地保护工作，现将有关情况报告如下：
    一、上半年主要工作开展情况……
    二、存在的主要困难与问题……
    三、下半年工作重点与落实举措……
    特此报告。
四川省自然资源厅
2026年7月15日`,
      "key_points": "报告中不得夹带请示事项；结语用‘特此报告’或‘专此报告’。"
    },
    {
      "type": "函 (平行文)",
      "usage": "不相隶属机关之间商洽工作、询问和答复问题、请求批准和答复审批事项。",
      "template": `成都市应急管理局关于商请协助开展防汛遥感数据共享的函
成都市气象局：
    为进一步提升我市汛期应急响应能力，强化气象与遥感数据联动分析，特商请贵局予以支持……
    特此函商。
成都市应急管理局
2026年8月20日`,
      "key_points": "平行文种，语气谦逊诚恳，结语可用‘特此函达’、‘特此函商’、‘请予大力支持为盼’等。"
    },
    {
      "type": "通报 (下行文)",
      "usage": "表彰先进、批评错误、传达重要精神和告知重要情况。",
      "template": `中共成都市委办公厅关于2026年度全市生态环境保护督察典型案例的通报
各区（市）县委，市委各部委，市直各部门党组（党委）：
    在近期开展的环境保护专项督察中，发现部分单位落实生态保护红线责任不到位……现将有关情况通报如下：
    一、基本事实……
    二、严肃问责决定……
    三、汲取教训与整改要求……
中共成都市委办公厅
2026年8月10日`,
      "key_points": "注重事实准确、案例剖析与警示教育意义。"
    }
  ],
  "quiz_bank": [
    {
      "id": 1,
      "category": "习近平新时代中国特色社会主义思想",
      "type": "single",
      "question": "习近平新时代中国特色社会主义思想的世界观和方法论集中体现为“六个必须坚持”。下列哪一项不属于“六个必须坚持”？",
      "options": ["A. 必须坚持人民至上", "B. 必须坚持自信自立", "C. 必须坚持深化改革", "D. 必须坚持系统观念"],
      "answer": "C",
      "explanation": "‘六个必须坚持’是：必须坚持人民至上、必须坚持自信自立、必须坚持守正创新、必须坚持问题导向、必须坚持系统观念、必须坚持胸怀天下。C选项‘必须坚持深化改革’不属于六个必须坚持。"
    },
    {
      "id": 2,
      "category": "法律公基 - 宪法",
      "type": "single",
      "question": "根据我国《宪法》规定，关于宪法修改的提议与表决程序，下列说法正确的是：",
      "options": [
        "A. 由全国人大常委会或者三分之一以上的全国人大代表提议",
        "B. 由全国人大常委会或者五分之一以上的全国人大代表提议",
        "C. 由全国人民代表大会以到会代表的三分之二以上的多数通过",
        "D. 由全国人大常委会以全体组成人员的三分之二以上的多数通过"
      ],
      "answer": "B",
      "explanation": "《宪法》第64条规定：宪法的修改，由全国人民代表大会常务委员会或者五分之一以上的全国人民代表大会代表提议，并由全国人民代表大会以全体代表的三分之二以上的多数通过。"
    },
    {
      "id": 3,
      "category": "法律公基 - 行政法",
      "type": "single",
      "question": "根据《中华人民共和国行政处罚法》，下列哪一类行政处罚只能由法律设定？",
      "options": ["A. 限制人身自由的行政处罚", "B. 责令停产停业", "C. 没收违法所得、没收非法财物", "D. 较大数额罚款"],
      "answer": "A",
      "explanation": "《行政处罚法》规定，限制人身自由的行政处罚只能由法律设定。行政法规可以设定除限制人身自由以外的行政处罚。"
    },
    {
      "id": 4,
      "category": "公文写作规范",
      "type": "single",
      "question": "在党政机关公文格式中，关于‘请示’的规则，下列说法错误的是：",
      "options": ["A. 请示应当一文一事", "B. 请示原则上主送一个上级机关", "C. 请示根据需要可以同时抄送下级机关", "D. 请示不得夹带报告事项"],
      "answer": "C",
      "explanation": "《党政机关公文处理工作条例》第15条明确规定：向上级机关行文，原则上主送一个上级机关，根据需要同时抄送相关上级机关和同级机关，不抄送下级机关。"
    },
    {
      "id": 5,
      "category": "习近平新时代中国特色社会主义思想",
      "type": "multi",
      "question": "党的二十大报告指出，十年来，我们经历了对党和人民事业具有重大现实意义和深远历史意义的三件大事。这三件大事包括：（多选）",
      "options": [
        "A. 迎来中国共产党成立一百周年",
        "B. 中国特色社会主义进入新时代",
        "C. 完成脱贫攻坚、全面建成小康社会的历史任务，实现第一个百年奋斗目标",
        "D. 全面建成社会主义现代化强国"
      ],
      "answer": ["A", "B", "C"],
      "explanation": "三件大事为：一是迎来中国共产党成立一百周年，二是中国特色社会主义进入新时代，三是完成脱贫攻坚、全面建成小康社会的历史任务，实现第一个百年奋斗目标。D是未来的奋斗目标。"
    },
    {
      "id": 6,
      "category": "非法律公基 - 经济常识",
      "type": "single",
      "question": "当经济出现严重通货膨胀、物价持续上涨时，政府和央行通常应采取的宏观调控政策组合是：",
      "options": [
        "A. 扩张性财政政策 + 紧缩性货币政策",
        "B. 紧缩性财政政策 + 紧缩性货币政策",
        "C. 扩张性财政政策 + 扩张性货币政策",
        "D. 紧缩性财政政策 + 扩张性货币政策"
      ],
      "answer": "B",
      "explanation": "通货膨胀即需求过旺、货币供给过多，应采取‘双紧’政策：紧缩性财政政策和紧缩性货币政策，以抑制总需求。"
    },
    {
      "id": 7,
      "category": "公文改错专项",
      "type": "single",
      "question": "下列发文字号编写规范正确的是：",
      "options": ["A. 成府发〔2026〕第18号", "B. 成府发【2026】18号", "C. 成府发〔2026〕18号", "D. 成府发(2026)18号"],
      "answer": "C",
      "explanation": "发文字号由发文机关代字、年份和顺序号组成。年份必须使用六角括号〔〕，不加‘第’字，不编虚位。"
    },
    {
      "id": 8,
      "category": "四川省情与政策",
      "type": "judge",
      "question": "四川省紧缺专业选调生考试中，若考生第一志愿填报成都市直未进入面试，只要笔试成绩达到全省合格分数线，第二、三志愿填报绵阳市可直接全员进入面试，不设1:3差额限制。",
      "options": ["A. 正确", "B. 错误"],
      "answer": "A",
      "explanation": "正确。四川选调政策红利：非成都的市州（如绵阳、德阳等）只要笔试成绩达到合格线，全员进面，第一志愿未进面的第二三志愿自动升级为第一志愿参加该市州面试。"
    }
  ]
};

// 预设分类
const CATEGORY_OPTIONS = [
  "行测专项",
  "公基与法律",
  "习思想与时政",
  "公文写作",
  "真题演练",
  "全真模考",
  "时政热点",
  "冲刺背诵",
  "其他/自定义"
];

const EXAM_DATE = "2026-10-25";

// 应用状态
let appState = {
  currentDateStr: getRealCurrentDateStr(),
  summary: null,
  calendarData: [],
  todayTasks: [],
  modalTasks: [],
  activeDateDetail: null,
  mistakes: [],
  activeMistakeFilter: 'all'
};

function getRealCurrentDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatChineseDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const w = weekdays[d.getDay()];
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日 (${w})`;
  }
  return dateStr;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRealDateDisplay();
  initTabs();
  initSubTabs();
  loadData();
  renderKnowledgeArticle('kb-policy');
  loadRandomQuiz();
  bindEvents();
});

/* ==========================================================================
   1. 数据存储引擎
   ========================================================================== */

function getLocalPlans() {
  const raw = localStorage.getItem('sc_study_plans');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  const defaultPlans = {};
  const start = new Date(2026, 7, 18);
  const end = new Date(2026, 9, 25);
  let cur = new Date(start);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;

    let stage = 'stage_1';
    let stageName = '第一阶段：公基筑基与理论强记';
    if (dStr >= '2026-09-10' && dStr < '2026-10-06') {
      stage = 'stage_2';
      stageName = '第二阶段：公文实战与真题演练';
    } else if (dStr >= '2026-10-06') {
      stage = 'stage_3';
      stageName = '第三阶段：全真模考与终极冲刺';
    }

    defaultPlans[dStr] = {
      date: dStr,
      stage: stage,
      stage_name: stageName,
      tasks: getDefaultTasksForDate(dStr),
      notes: '',
      is_completed: 0
    };
    cur.setDate(cur.getDate() + 1);
  }
  localStorage.setItem('sc_study_plans', JSON.stringify(defaultPlans));
  return defaultPlans;
}

function getDefaultTasksForDate(dStr) {
  if (dStr < '2026-09-10') {
    return [
      { id: 't-1', category: '行测专项', content: '行测言语理解 & 资料分析精练 (花生13技巧)', duration: 3.0, is_done: false },
      { id: 't-2', category: '公基与法律', content: '行政法重点法条梳理 + 专项题海刷题 (吴飞/陈志)', duration: 4.0, is_done: false },
      { id: 't-3', category: '习思想与时政', content: '习近平新时代中国特色社会主义思想‘胶带挖空’强背', duration: 3.5, is_done: false }
    ];
  } else if (dStr < '2026-10-06') {
    return [
      { id: 't-1', category: '真题演练', content: '四川近5年定向选调真题限时演练与错题复盘', duration: 3.0, is_done: false },
      { id: 't-2', category: '公文写作', content: '15种法定公文手写实战（通知/请示/方案/宣讲稿）', duration: 4.0, is_done: false },
      { id: 't-3', category: '时政热点', content: '2026年重大会议精神与时政热点文章精读', duration: 3.5, is_done: false }
    ];
  } else {
    return [
      { id: 't-1', category: '全真模考', content: '全真闭卷机考模拟（90道综合测试题限时作答）', duration: 3.0, is_done: false },
      { id: 't-2', category: '公文写作', content: '整套公文写作AI诊断批改 & 错题集地毯式过筛', duration: 3.5, is_done: false },
      { id: 't-3', category: '冲刺背诵', content: '习思想帽子词与2026时政终极必背金句过筛', duration: 4.0, is_done: false }
    ];
  }
}

function saveLocalPlan(dateStr, tasks, notes) {
  const plans = getLocalPlans();
  const allDone = tasks.length > 0 && tasks.every(t => t.is_done);
  plans[dateStr] = {
    ...(plans[dateStr] || { date: dateStr, stage: 'stage_1', stage_name: '第一阶段' }),
    tasks: tasks,
    notes: notes || '',
    is_completed: allDone ? 1 : 0
  };
  localStorage.setItem('sc_study_plans', JSON.stringify(plans));
}

function getLocalMistakes() {
  const raw = localStorage.getItem('sc_study_mistakes');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return [
    {
      id: 1,
      category: "法律公基 - 行政法",
      title: "行政处罚设定权限与种类",
      question: "下列哪一类行政处罚只能由法律设定？",
      my_mistake: "误选为责令停产停业",
      correct_analysis: "《行政处罚法》明确规定，限制人身自由的行政处罚只能由法律设定！",
      is_mastered: 0
    }
  ];
}

function saveLocalMistakes(mistakes) {
  localStorage.setItem('sc_study_mistakes', JSON.stringify(mistakes));
}

/* ==========================================================================
   2. 界面初始化与数据加载
   ========================================================================== */

function initRealDateDisplay() {
  const realDateText = formatChineseDate(appState.currentDateStr);
  const el = document.getElementById('nav-real-date');
  if (el) el.textContent = realDateText;

  const descEl = document.getElementById('stat-current-date-desc');
  if (descEl) descEl.textContent = `今日：${realDateText}`;

  const titleEl = document.getElementById('today-plan-title');
  if (titleEl) titleEl.textContent = `今日复习打卡 (${appState.currentDateStr})`;
}

function initTheme() {
  const savedTheme = localStorage.getItem('sichuan_study_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    document.getElementById('theme-icon').textContent = '☀️';
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    document.getElementById('theme-icon').textContent = '🌙';
  }

  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      document.getElementById('theme-icon').textContent = '🌙';
      localStorage.setItem('sichuan_study_theme', 'light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.getElementById('theme-icon').textContent = '☀️';
      localStorage.setItem('sichuan_study_theme', 'dark');
    }
  });
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      document.getElementById(`tab-${target}`).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function initSubTabs() {
  const subBtns = document.querySelectorAll('.sub-nav-btn');
  subBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-sub');
      document.getElementById(`sub-${target}`).classList.add('active');
    });
  });
}

async function loadData() {
  const plans = getLocalPlans();
  appState.calendarData = Object.values(plans);

  try {
    const res = await fetch(`/api/summary?date=${appState.currentDateStr}`);
    if (res.ok) {
      const data = await res.json();
      if (data.today_plan && data.today_plan.tasks) {
        saveLocalPlan(data.today_plan.date, data.today_plan.tasks, data.today_plan.notes);
      }
    }
  } catch (e) {}

  calculateAndRenderDashboard();
  renderCalendar();
  loadMistakes();
}

function calculateAndRenderDashboard() {
  const plans = getLocalPlans();
  const planList = Object.values(plans);

  let completedDays = 0;
  let totalHours = 0.0;
  const globalCatHours = {};

  planList.forEach(p => {
    const tasks = p.tasks || [];
    const isAllDone = tasks.length > 0 && tasks.every(t => t.is_done);
    if (isAllDone) completedDays++;

    tasks.forEach(t => {
      if (t.is_done) {
        const dur = parseFloat(t.duration) || 0.0;
        totalHours += dur;
        globalCatHours[t.category] = (globalCatHours[t.category] || 0) + dur;
      }
    });
  });

  const curDt = new Date(appState.currentDateStr);
  const examDt = new Date(EXAM_DATE);
  const diffDays = Math.max(0, Math.ceil((examDt - curDt) / (1000 * 60 * 60 * 24)));

  document.getElementById('nav-days-left').textContent = diffDays;
  document.getElementById('stat-days-left').textContent = diffDays;
  document.getElementById('stat-comp-days').textContent = completedDays;
  const compRate = planList.length > 0 ? (completedDays / planList.length * 100).toFixed(1) : '0.0';
  document.getElementById('stat-comp-rate').textContent = compRate;
  document.getElementById('stat-hours').textContent = totalHours.toFixed(1);

  updateStageHighlight(appState.currentDateStr);

  const todayPlan = plans[appState.currentDateStr] || {
    date: appState.currentDateStr,
    tasks: getDefaultTasksForDate(appState.currentDateStr),
    notes: ''
  };
  appState.todayTasks = todayPlan.tasks || [];
  document.getElementById('today-notes-input').value = todayPlan.notes || '';
  renderTodayTasksDOM();

  renderGlobalCategoryProgress(globalCatHours, totalHours);
}

function updateStageHighlight(dateStr) {
  const b1 = document.getElementById('stage-block-1');
  const b2 = document.getElementById('stage-block-2');
  const b3 = document.getElementById('stage-block-3');
  const badge = document.getElementById('current-stage-badge');

  b1.classList.remove('active');
  b2.classList.remove('active');
  b3.classList.remove('active');

  if (dateStr < '2026-09-10') {
    b1.classList.add('active');
    if (badge) badge.textContent = '当前处于：第一阶段·夯基强化';
  } else if (dateStr < '2026-10-06') {
    b2.classList.add('active');
    if (badge) badge.textContent = '当前处于：第二阶段·公文与真题';
  } else {
    b3.classList.add('active');
    if (badge) badge.textContent = '当前处于：第三阶段·冲刺模考';
  }
}

function renderGlobalCategoryProgress(catHours, totalHours) {
  const container = document.getElementById('global-category-progress');
  if (!container) return;
  container.innerHTML = '';

  const entries = Object.entries(catHours);
  if (entries.length === 0) {
    container.innerHTML = '<div style="font-size:0.82rem; color:var(--text-muted);">暂无打卡时长，勾选完成今日任务后自动生成统计。</div>';
    return;
  }

  entries.sort((a, b) => b[1] - a[1]);

  entries.forEach(([cat, hours]) => {
    const pct = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;
    const item = document.createElement('div');
    item.className = 'cat-progress-item';
    item.innerHTML = `
      <div class="cat-progress-head">
        <span>${cat}</span>
        <span>${hours.toFixed(1)}h (${pct}%)</span>
      </div>
      <div class="cat-progress-track">
        <div class="cat-progress-fill" style="width: ${pct}%"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

/* ==========================================================================
   3. 今日任务编辑器 (上下两层自适应布局 · 彻底适配手机与桌面)
   ========================================================================== */

function renderTodayTasksDOM() {
  const container = document.getElementById('dynamic-task-list');
  container.innerHTML = '';

  appState.todayTasks.forEach((task, index) => {
    const row = document.createElement('div');
    row.className = `task-edit-row ${task.is_done ? 'is-done' : ''}`;
    row.id = `today-task-row-${index}`;

    const dur = parseFloat(task.duration) || 0.0;
    const catOptionsHtml = CATEGORY_OPTIONS.map(c => `
      <option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>
    `).join('');

    row.innerHTML = `
      <div class="task-row-top">
        <div class="task-row-left">
          <input type="checkbox" class="task-chk" ${task.is_done ? 'checked' : ''} onchange="onTodayTaskCheck(${index}, this.checked)">
          <select class="task-cat-select" onchange="onTodayTaskCatChange(${index}, this.value)">
            ${catOptionsHtml}
          </select>
        </div>
        <div class="task-row-right">
          <div class="task-duration-wrap">
            <input type="number" class="task-duration-input" min="0" max="24" step="0.5" value="${dur}" title="有效学习时长(小时)" oninput="onTodayTaskDurationInput(${index}, this.value)">
            <span>h</span>
          </div>
          <button class="btn-del-task" title="删除此任务" onclick="removeTodayTask(${index})">🗑️</button>
        </div>
      </div>
      <div class="task-row-bottom">
        <input type="text" class="task-content-input" value="${escapeHtml(task.content)}" placeholder="输入任务具体内容..." oninput="onTodayTaskTextInput(${index}, this.value)">
      </div>
    `;

    container.appendChild(row);
  });

  updateTodaySummaryBadges();
}

function onTodayTaskTextInput(index, value) {
  if (appState.todayTasks[index]) {
    appState.todayTasks[index].content = value;
  }
}

function onTodayTaskDurationInput(index, value) {
  const num = parseFloat(value) || 0.0;
  if (appState.todayTasks[index]) {
    appState.todayTasks[index].duration = num;
  }
  updateTodaySummaryBadges();
}

function onTodayTaskCatChange(index, newCat) {
  if (appState.todayTasks[index]) {
    appState.todayTasks[index].category = newCat;
  }
  updateTodaySummaryBadges();
}

function onTodayTaskCheck(index, isDone) {
  if (appState.todayTasks[index]) {
    appState.todayTasks[index].is_done = isDone;
  }
  const row = document.getElementById(`today-task-row-${index}`);
  if (row) {
    if (isDone) row.classList.add('is-done');
    else row.classList.remove('is-done');
  }
  updateTodaySummaryBadges();
}

function updateTodaySummaryBadges() {
  let totalPlannedH = 0.0;
  let totalDoneH = 0.0;
  const catHours = {};

  appState.todayTasks.forEach(t => {
    const dur = parseFloat(t.duration) || 0.0;
    totalPlannedH += dur;
    if (t.is_done) {
      totalDoneH += dur;
      catHours[t.category] = (catHours[t.category] || 0) + dur;
    }
  });

  const bar = document.getElementById('category-summary-bar');
  if (bar) {
    bar.innerHTML = '';
    const summaryPill = document.createElement('div');
    summaryPill.className = 'cat-badge';
    summaryPill.innerHTML = `已完成: <strong>${totalDoneH.toFixed(1)}h</strong> / 计划 ${totalPlannedH.toFixed(1)}h`;
    bar.appendChild(summaryPill);

    Object.entries(catHours).forEach(([cat, h]) => {
      const badge = document.createElement('div');
      badge.className = 'cat-badge';
      badge.innerHTML = `${cat}: <strong>${h.toFixed(1)}h</strong>`;
      bar.appendChild(badge);
    });
  }

  const badge = document.getElementById('today-status-badge');
  const allDone = appState.todayTasks.length > 0 && appState.todayTasks.every(t => t.is_done);
  if (badge) {
    if (allDone) {
      badge.textContent = `🎉 今日已全部完成 (${totalDoneH.toFixed(1)}h)`;
      badge.className = 'badge badge-success';
    } else {
      badge.textContent = `⏳ 今日已完成 ${totalDoneH.toFixed(1)}h / 计划 ${totalPlannedH.toFixed(1)}h`;
      badge.className = 'badge badge-primary';
    }
  }
}

function addNewTaskRow() {
  appState.todayTasks.push({
    id: `task-${Date.now()}`,
    category: "公基与法律",
    content: "新复习任务",
    duration: 1.0,
    is_done: false
  });
  renderTodayTasksDOM();
}

function removeTodayTask(index) {
  appState.todayTasks.splice(index, 1);
  renderTodayTasksDOM();
}

function bindEvents() {
  document.getElementById('btn-save-today').addEventListener('click', async () => {
    const notes = document.getElementById('today-notes-input').value;
    saveLocalPlan(appState.currentDateStr, appState.todayTasks, notes);

    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: appState.currentDateStr,
          tasks: appState.todayTasks,
          notes: notes
        })
      });
    } catch (e) {}

    alert('🎉 打卡数据与自定义任务已成功保存并实时汇总！');
    calculateAndRenderDashboard();
    renderCalendar();
  });

  document.getElementById('kb-search-input').addEventListener('input', (e) => {
    filterKnowledgeMenu(e.target.value);
  });
}

/* ==========================================================================
   4. 冲刺日历与弹窗
   ========================================================================== */

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  container.innerHTML = '';
  const plans = getLocalPlans();
  const list = Object.values(plans);

  list.forEach(day => {
    const card = document.createElement('div');
    const tasks = day.tasks || [];
    const isCompleted = tasks.length > 0 && tasks.every(t => t.is_done);
    const isToday = day.date === appState.currentDateStr;

    let stageBadgeClass = 'stage-1-bg';
    let stageLabel = '阶段一';
    if (day.stage === 'stage_2') {
      stageBadgeClass = 'stage-2-bg';
      stageLabel = '阶段二';
    } else if (day.stage === 'stage_3') {
      stageBadgeClass = 'stage-3-bg';
      stageLabel = '阶段三';
    }

    const doneCount = tasks.filter(t => t.is_done).length;
    const taskCount = tasks.length;
    const dayHours = tasks.reduce((sum, t) => sum + (t.is_done ? (parseFloat(t.duration) || 0) : 0), 0);

    const summaryItems = tasks.slice(0, 2).map(t => `
      <div>${t.is_done ? '✅' : '⚪'} ${t.category.slice(0, 4)}: ${escapeHtml(t.content.slice(0, 6))}..</div>
    `).join('');

    card.className = `cal-day-card ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}`;
    card.innerHTML = `
      <div>
        <div class="cal-day-top">
          <span class="cal-date">${day.date.slice(5)} ${isToday ? '(今)' : ''}</span>
          <span class="cal-stage-badge ${stageBadgeClass}">${stageLabel}</span>
        </div>
        <div class="cal-tasks-summary">
          ${summaryItems || '<div>暂无任务</div>'}
        </div>
      </div>
      <div class="cal-day-bottom">
        <span>⏱️ ${dayHours.toFixed(1)}h</span>
        <span>${isCompleted ? '🏆 完成' : `${doneCount}/${taskCount}`}</span>
      </div>
    `;

    card.addEventListener('click', () => openDateModal(day));
    container.appendChild(card);
  });
}

function openDateModal(day) {
  appState.activeDateDetail = day;
  appState.modalTasks = JSON.parse(JSON.stringify(day.tasks || []));

  document.getElementById('modal-date-title').textContent = `${formatChineseDate(day.date)} 计划与打卡`;
  document.getElementById('modal-stage-tag').textContent = day.stage_name;
  document.getElementById('modal-notes-input').value = day.notes || '';

  renderModalTasksDOM();
  document.getElementById('modal-date-detail').classList.remove('hidden');
}

function renderModalTasksDOM() {
  const container = document.getElementById('modal-tasks-list');
  container.innerHTML = '';

  appState.modalTasks.forEach((task, index) => {
    const row = document.createElement('div');
    row.className = `task-edit-row ${task.is_done ? 'is-done' : ''}`;
    row.id = `modal-task-row-${index}`;

    const catOptionsHtml = CATEGORY_OPTIONS.map(c => `
      <option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>
    `).join('');

    row.innerHTML = `
      <div class="task-row-top">
        <div class="task-row-left">
          <input type="checkbox" class="task-chk" ${task.is_done ? 'checked' : ''} onchange="onModalTaskCheck(${index}, this.checked)">
          <select class="task-cat-select" onchange="onModalTaskCatChange(${index}, this.value)">
            ${catOptionsHtml}
          </select>
        </div>
        <div class="task-row-right">
          <div class="task-duration-wrap">
            <input type="number" class="task-duration-input" min="0" max="24" step="0.5" value="${task.duration || 0}" oninput="onModalTaskDurationInput(${index}, this.value)">
            <span>h</span>
          </div>
          <button class="btn-del-task" title="删除" onclick="removeModalTask(${index})">🗑️</button>
        </div>
      </div>
      <div class="task-row-bottom">
        <input type="text" class="task-content-input" value="${escapeHtml(task.content)}" placeholder="输入任务描述..." oninput="onModalTaskTextInput(${index}, this.value)">
      </div>
    `;
    container.appendChild(row);
  });
}

function onModalTaskTextInput(index, value) {
  if (appState.modalTasks[index]) {
    appState.modalTasks[index].content = value;
  }
}

function onModalTaskDurationInput(index, value) {
  if (appState.modalTasks[index]) {
    appState.modalTasks[index].duration = parseFloat(value) || 0.0;
  }
}

function onModalTaskCatChange(index, newCat) {
  if (appState.modalTasks[index]) {
    appState.modalTasks[index].category = newCat;
  }
}

function onModalTaskCheck(index, isDone) {
  if (appState.modalTasks[index]) {
    appState.modalTasks[index].is_done = isDone;
  }
  const row = document.getElementById(`modal-task-row-${index}`);
  if (row) {
    if (isDone) row.classList.add('is-done');
    else row.classList.remove('is-done');
  }
}

function addModalTaskRow() {
  appState.modalTasks.push({
    id: `task-${Date.now()}`,
    category: "公基与法律",
    content: "新任务项",
    duration: 1.0,
    is_done: false
  });
  renderModalTasksDOM();
}

function removeModalTask(index) {
  appState.modalTasks.splice(index, 1);
  renderModalTasksDOM();
}

function closeDateModal() {
  document.getElementById('modal-date-detail').classList.add('hidden');
}

async function saveDateModal() {
  if (!appState.activeDateDetail) return;
  const date = appState.activeDateDetail.date;
  const notes = document.getElementById('modal-notes-input').value;

  saveLocalPlan(date, appState.modalTasks, notes);

  try {
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: date,
        tasks: appState.modalTasks,
        notes: notes
      })
    });
  } catch (e) {}

  closeDateModal();
  calculateAndRenderDashboard();
  renderCalendar();
}

/* ==========================================================================
   5. 知识库渲染
   ========================================================================== */

function bindKnowledgeMenu() {
  const menuItems = document.querySelectorAll('.kb-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const target = item.getAttribute('data-target');
      renderKnowledgeArticle(target);
    });
  });
}

function renderKnowledgeArticle(target) {
  bindKnowledgeMenu();
  const display = document.getElementById('kb-content-display');
  const kb = EMBEDDED_KNOWLEDGE;

  let html = '';

  switch (target) {
    case 'kb-policy':
      html = `
        <h2 class="kb-article-title">🏛️ 四川定向选调百科与核心报考规则</h2>
        <div class="kb-article-body">
          <p><strong>报考门槛（中山大学硕士研究生适用）：</strong></p>
          <ul>
            <li>年龄要求：硕士研究生不超过 30 周岁。</li>
            <li>硬性门槛（四选一）：中共党员（含预备） / 担任班长或研会部长满1年 / 校级一等以上奖学金 / 校级三好/优干荣誉。</li>
          </ul>
          <br>
          <p><strong>🎯 志愿填报流转红利（重点）：</strong></p>
          <p>四川紧缺选调允许填报三个志愿：</p>
          <ul>
            <li><strong>第一志愿</strong>：省直部门 或 成都市直岗位（差额 1:3 进面）。</li>
            <li><strong>第二/三志愿</strong>：绵阳、德阳等市州。若第一志愿未进面，<strong>只要笔试成绩达到全省合格分数线，直接全员进面，不设1:3人数限制</strong>！</li>
            <li><strong>调剂红利</strong>：四川选调具备频繁的多轮递补与按性别统筹调剂机制，上岸保底机会极大。</li>
          </ul>
        </div>
      `;
      break;

    case 'kb-score':
      html = `
        <h2 class="kb-article-title">📋 笔试科目与分值分布揭秘（满分 100 分机考）</h2>
        <div class="kb-article-body">
          <p>考试仅考 1 科《综合能力测试》，闭卷机考：</p>
          <br>
          <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background:var(--bg-subtle); border-bottom: 2px solid var(--border-subtle); text-align:left;">
              <th style="padding:8px;">题型</th>
              <th style="padding:8px;">题量</th>
              <th style="padding:8px;">每题分值</th>
              <th style="padding:8px;">总分</th>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding:8px;"><strong>单选题</strong></td>
              <td style="padding:8px;">60 题</td>
              <td style="padding:8px;">0.8 分</td>
              <td style="padding:8px;">48 分</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding:8px;"><strong>多选题</strong></td>
              <td style="padding:8px;">10 题</td>
              <td style="padding:8px;">1.2 分</td>
              <td style="padding:8px;">12 分</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding:8px;"><strong>判断题</strong></td>
              <td style="padding:8px;">10 题</td>
              <td style="padding:8px;">1.0 分</td>
              <td style="padding:8px;">10 分</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding:8px;"><strong>公文写作</strong></td>
              <td style="padding:8px;">1 大题</td>
              <td style="padding:8px;">30.0 分</td>
              <td style="padding:8px;">30 分</td>
            </tr>
          </table>
        </div>
      `;
      break;

    case 'kb-majors':
      html = `
        <h2 class="kb-article-title">🗺️ 测绘工程 (085704 专硕) 岗位去向匹配</h2>
        <div class="kb-article-body">
          <p>测绘工程专硕在四川定向选调中对应 <strong>测绘地理信息类 / 计算机与电子信息类</strong>：</p>
          <br>
          <div style="background:var(--bg-subtle); padding:12px; border-radius:6px; margin-bottom:10px;">
            <h4>1. 自然资源与规划系统 (最对口)</h4>
            <p>四川省自然资源厅、成都市规划和自然资源局及区县分局。</p>
          </div>
          <div style="background:var(--bg-subtle); padding:12px; border-radius:6px; margin-bottom:10px;">
            <h4>2. 应急管理系统</h4>
            <p>四川省应急管理厅、成都市应急管理局。</p>
          </div>
          <div style="background:var(--bg-subtle); padding:12px; border-radius:6px; margin-bottom:10px;">
            <h4>3. 区县综合行政岗</h4>
            <p>天府新区、高新区等优质党政综合机关岗位。</p>
          </div>
        </div>
      `;
      break;

    case 'kb-doc-notice':
    case 'kb-doc-request':
    case 'kb-doc-report':
    case 'kb-doc-letter':
    case 'kb-doc-bulletin':
      const docTypeMap = {
        'kb-doc-notice': '通知 (下行文)',
        'kb-doc-request': '请示 (上行文)',
        'kb-doc-report': '报告 (上行文)',
        'kb-doc-letter': '函 (平行文)',
        'kb-doc-bulletin': '通报 (下行文)'
      };
      const foundDoc = (kb.official_documents || []).find(d => d.type === docTypeMap[target]);
      if (foundDoc) {
        html = `
          <h2 class="kb-article-title">📜 ${foundDoc.type} 标准范本与核心考点</h2>
          <div class="kb-article-body">
            <p><strong>【适用】：</strong> ${foundDoc.usage}</p>
            <p><strong>【要点】：</strong> ${foundDoc.key_points}</p>
            <br>
            <pre><code>${foundDoc.template}</code></pre>
          </div>
        `;
      }
      break;

    case 'kb-doc-mistakes':
      html = `
        <h2 class="kb-article-title">⚠️ 公文改错 10 大高频扣分雷区</h2>
        <div class="kb-article-body">
          <ol style="padding-left:18px; line-height:1.8;">
            <li><strong>发文字号括号错误</strong>：六角括号 <code>〔2026〕</code>。</li>
            <li><strong>发文字号带‘第’字</strong>：错写为 <code>成府发〔2026〕第18号</code>。</li>
            <li><strong>成文日期用汉字</strong>：必须用全阿拉伯数字 <code>2026年10月25日</code>。</li>
            <li><strong>请示多头主送</strong>：请示原则上只能主送一个上级。</li>
            <li><strong>请示抄送下级</strong>：请示原则上不得抄送下级机关。</li>
            <li><strong>标题文种混用</strong>：错写为 <code>请示报告</code>。</li>
            <li><strong>主送机关后缺少冒号</strong>。</li>
            <li><strong>一文多事</strong>：请示必须一文一事。</li>
            <li><strong>报告中夹带请示</strong>。</li>
            <li><strong>标题重复‘关于’</strong>。</li>
          </ol>
        </div>
      `;
      break;

    case 'kb-xi':
      html = `
        <h2 class="kb-article-title">📖 习近平新时代中国特色社会主义思想 速记</h2>
        <div class="kb-article-body">
          <div style="background:var(--bg-subtle); padding:12px; border-radius:6px; margin-bottom:10px;">
            <h4>🌟 核心四大支柱（必考帽子题）：</h4>
            <ul>
              <li><strong>十个明确</strong>：系统回答核心内容。</li>
              <li><strong>十四个坚持</strong>：基本方略（行动纲领）。</li>
              <li><strong>十三个方面成就</strong>：历史性成就与变革。</li>
              <li><strong>六个必须坚持</strong>：人民至上、自信自立、守正创新、问题导向、系统观念、胸怀天下。</li>
            </ul>
          </div>
        </div>
      `;
      break;

    case 'kb-law':
      html = `
        <h2 class="kb-article-title">⚖️ 宪法与行政法核心考点</h2>
        <div class="kb-article-body">
          <p>- <strong>宪法修改</strong>：全国人大常委会或 1/5 以上代表提议；全体代表 2/3 以上多数通过。<br>- <strong>限制人身自由处罚</strong>：只能由法律设定。<br>- <strong>处分期限</strong>：警告6个月、记过12个月、记大过18个月、降级/撤职24个月。</p>
        </div>
      `;
      break;

    case 'kb-economy':
      html = `
        <h2 class="kb-article-title">📈 宏观经济政策与常考点</h2>
        <div class="kb-article-body">
          <p>- <strong>通胀</strong>：双紧政策（紧缩财政 + 紧缩货币）。<br>- <strong>通缩</strong>：双松政策。</p>
        </div>
      `;
      break;

    case 'kb-teachers':
      html = `
        <h2 class="kb-article-title">👨‍🏫 26届78.X高分上岸名师推荐</h2>
        <div class="kb-article-body">
          <ul>
            <li><strong>习思想与时政</strong>：金标尺于玉老师</li>
            <li><strong>法律常识</strong>：B站吴飞 + 金标尺陈志</li>
            <li><strong>公文写作</strong>：金标尺白杨老师（手写20篇）</li>
            <li><strong>行测</strong>：花生13</li>
          </ul>
        </div>
      `;
      break;
  }

  display.innerHTML = html;
}

function filterKnowledgeMenu(query) {
  const q = query.trim().toLowerCase();
  const items = document.querySelectorAll('.kb-menu-item');
  items.forEach(item => {
    if (item.textContent.toLowerCase().includes(q)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

/* ==========================================================================
   6. 智能助教、随机抽测与公文批改
   ========================================================================== */

async function submitChat() {
  const input = document.getElementById('chat-input-text');
  const text = input.value.trim();
  if (!text) return;

  const box = document.getElementById('chat-messages-box');

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user-msg';
  userMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  box.appendChild(userMsg);
  input.value = '';
  box.scrollTop = box.scrollHeight;

  const botMsg = document.createElement('div');
  botMsg.className = 'chat-msg bot-msg';
  botMsg.innerHTML = `<div class="msg-bubble">🤖 助教正在检索知识库思考中...</div>`;
  box.appendChild(botMsg);
  box.scrollTop = box.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    });
    if (res.ok) {
      const data = await res.json();
      botMsg.innerHTML = `
        <div class="msg-bubble">
          <h4 style="color:var(--primary); margin-bottom:4px;">${data.title}</h4>
          <div style="white-space: pre-wrap;">${data.content}</div>
        </div>
      `;
      box.scrollTop = box.scrollHeight;
      return;
    }
  } catch (err) {}

  const reply = localChatAnswer(text);
  botMsg.innerHTML = `
    <div class="msg-bubble">
      <h4 style="color:var(--primary); margin-bottom:4px;">${reply.title}</h4>
      <div style="white-space: pre-wrap;">${reply.content}</div>
    </div>
  `;
  box.scrollTop = box.scrollHeight;
}

function localChatAnswer(q) {
  const text = q.toLowerCase();
  if (text.includes("志愿") || text.includes("流转") || text.includes("绵阳") || text.includes("成都")) {
    return {
      title: "🎯 四川紧缺选调志愿填报与流转红利",
      content: `【政策红利】：第一志愿报省直/成都市直（1:3进面）。若第一志愿未进面，第二、三志愿（如绵阳）自动升级为第一志愿；只要过省合格线，全员进面！\n【策略建议】：第一志愿大胆冲成都，第二志愿绵阳稳稳保底。`
    };
  }
  if (text.includes("分值") || text.includes("题型") || text.includes("考情")) {
    return {
      title: "📋 笔试科目与分值结构",
      content: `闭卷机考，仅考一科《综合能力测试》(100分)：\n- 单选60题(48分)\n- 多选10题(12分，错漏选全扣，拉分关键)\n- 判断10题(10分)\n- 公文写作1大题(30分，通知/方案等实务公文)。`
    };
  }
  if (text.includes("公文") || text.includes("请示") || text.includes("格式")) {
    return {
      title: "📝 公文写作核心规范",
      content: `发文字号用六角括号〔2026〕，不带‘第’字；成文日期必须用全阿拉伯数字；请示一文一事，只能主送一个上级机关，不得抄送下级。`
    };
  }
  return {
    title: "💡 备考助教建议",
    content: `针对您的问题“${q}”：四川定向选调复习核心在‘公基习思想+行政法死记+公文手写20篇’。坚持每日10小时三段作息，定能顺利上岸！`
  };
}

function sendPrompt(text) {
  document.getElementById('chat-input-text').value = text;
  submitChat();
}

function handleChatKey(e) {
  if (e.key === 'Enter') {
    submitChat();
  }
}

function loadRandomQuiz() {
  renderQuiz(EMBEDDED_KNOWLEDGE.quiz_bank);
}

function renderQuiz(questions) {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  questions.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-item-card';

    let typeTag = '单选题';
    if (q.type === 'multi') typeTag = '多选题';
    if (q.type === 'judge') typeTag = '判断题';

    card.innerHTML = `
      <div class="quiz-header">
        <span class="quiz-cat">【${q.category}】· ${typeTag}</span>
        <span class="badge badge-primary">第 ${qIndex + 1} 题</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options" id="quiz-opts-${q.id}">
        ${q.options.map(opt => `
          <button class="quiz-opt-btn" data-qid="${q.id}" data-opt="${opt.charAt(0)}" onclick="selectQuizOption(this, ${JSON.stringify(q).replace(/"/g, '&quot;')})">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="quiz-exp-${q.id}" class="quiz-explanation-box" style="display:none;"></div>
    `;

    container.appendChild(card);
  });
}

function selectQuizOption(btn, q) {
  const selectedOpt = btn.getAttribute('data-opt');
  const expBox = document.getElementById(`quiz-exp-${q.id}`);
  let isCorrect = false;

  if (q.type === 'multi') {
    isCorrect = q.answer.includes(selectedOpt);
  } else {
    isCorrect = selectedOpt === q.answer;
  }

  if (isCorrect) {
    btn.classList.add('selected-correct');
  } else {
    btn.classList.add('selected-wrong');
  }

  expBox.style.display = 'block';
  expBox.innerHTML = `
    <strong>【参考答案】：</strong> ${Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}<br>
    <strong>【深度解析】：</strong> ${q.explanation}
  `;
}

function fillDocSample() {
  document.getElementById('doc-text-input').value = `关于开展防范地质灾害专项安全检查的通知
成委办发〔2026〕12号
各区（市）县人民政府，市级各部门：

    当前，我市已进入主汛期，地质灾害防治形势十分严峻。为切实保障人民群众生命财产安全，现将有关事项通知如下：
    一、 工作目标
    全面排查隐患，压紧压实责任，确保安全度汛。
    二、 检查重点与措施
    （一）聚焦重点区域排查。组织测绘与自然资源专业力量，开展卫星遥感与无人机拉网式核查。
    （二）健全值班值守与预警联动机制。
    三、 工作要求
    各部门要强化大局意识，确保责任到人。

成都市人民政府
2026年9月10日`;
}

async function submitGradeDoc() {
  const content = document.getElementById('doc-text-input').value.trim();
  if (!content) {
    alert('请先输入或粘贴公文内容！');
    return;
  }

  const resultBox = document.getElementById('doc-grade-result');
  resultBox.innerHTML = '<div class="result-placeholder"><p>🚀 AI 助教正在逐项诊断公文要素与格式规范...</p></div>';

  setTimeout(() => {
    const r = localGradeDocument(content);
    resultBox.innerHTML = `
      <div class="score-display-card">
        <div>
          <span style="font-size:0.8rem; opacity:0.9;">综合诊断得分</span>
          <div class="score-num">${r.score} <small style="font-size:0.9rem;">/ 30分</small></div>
          <span style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px;">${r.level}</span>
        </div>
        <div style="text-align:right; font-size:0.8rem;">
          <div>字数：${r.char_count} 字</div>
          <div>格式达标率：${Math.round(r.score / 30 * 100)}%</div>
        </div>
      </div>

      <div class="result-section">
        <h5>✨ 亮点要素</h5>
        <ul style="padding-left:16px; font-size:0.82rem; color:var(--accent-green);">
          ${r.highlights.length ? r.highlights.map(h => `<li>${h}</li>`).join('') : '<li>暂无突出亮点</li>'}
        </ul>
      </div>

      <div class="result-section">
        <h5>⚠️ 扣分诊断</h5>
        <ul style="padding-left:16px; font-size:0.82rem; color:var(--accent-red);">
          ${r.deductions.length ? r.deductions.map(d => `<li>${d}</li>`).join('') : '<li>🎉 格式完美，无扣分！</li>'}
        </ul>
      </div>

      <div class="result-section">
        <h5>💡 提分建议</h5>
        <ul style="padding-left:16px; font-size:0.82rem; color:var(--text-secondary);">
          ${r.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;
  }, 250);
}

function localGradeDocument(content) {
  let score = 30.0;
  const deductions = [];
  const highlights = [];
  const char_count = content.replace(/\s+/g, '').length;

  if (content.includes("关于")) {
    highlights.push("✅ 包含规范的事由与文种要素");
  } else {
    score -= 4; deductions.push("❌ 标题缺少‘关于+事由+文种’ (-4分)");
  }

  if (content.includes("〔") && content.includes("〕")) {
    if (content.includes("第") && content.includes("号")) {
      score -= 2; deductions.push("❌ 发文字号含有‘第’字 (-2分)");
    } else {
      highlights.push("✅ 发文字号使用了标准六角括号〔〕");
    }
  }

  if (content.includes("：") || content.includes(":")) {
    highlights.push("✅ 包含顶格主送机关及冒号");
  }

  if (/一、|二、|三、/.test(content)) {
    highlights.push("✅ 正文一级标题逻辑序号规范（如‘一、’）");
  }

  if (/\d{4}年\d{1,2}月\d{1,2}日/.test(content)) {
    highlights.push("✅ 成文日期使用标准全阿拉伯数字");
  } else {
    score -= 3; deductions.push("❌ 成文日期格式不规范 (-3分)");
  }

  if (char_count < 200) {
    score -= 4; deductions.push(`❌ 正文篇幅偏短 (当前${char_count}字，建议350-500字) (-4分)`);
  }

  score = Math.max(5.0, Math.min(30.0, score));

  return {
    score: score.toFixed(1),
    level: score >= 26 ? "优秀（一类文）" : (score >= 20 ? "良好（二类文）" : "中等（需强化）"),
    char_count: char_count,
    highlights: highlights,
    deductions: deductions,
    suggestions: [
      "牢记公文四部曲：背景依据 + 工作目标 + 重点举措 + 落实保障。",
      "多使用党政规范词（高质高效推进、压紧压实责任）。"
    ]
  };
}

/* ==========================================================================
   7. 错题集管理
   ========================================================================== */

function loadMistakes() {
  appState.mistakes = getLocalMistakes();
  renderMistakes();
  const unmastered = appState.mistakes.filter(m => m.is_mastered === 0).length;
  document.getElementById('stat-mistakes').textContent = unmastered;
}

function renderMistakes() {
  const container = document.getElementById('mistakes-container');
  container.innerHTML = '';

  let filtered = appState.mistakes;
  if (appState.activeMistakeFilter === 'unmastered') {
    filtered = appState.mistakes.filter(m => m.is_mastered === 0);
  } else if (appState.activeMistakeFilter === 'mastered') {
    filtered = appState.mistakes.filter(m => m.is_mastered === 1);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.85rem;">暂无错题记录，点击右上角录入日常刷题错题吧！</div>';
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement('div');
    card.className = 'mistake-card';
    card.innerHTML = `
      <div class="mistake-top">
        <span class="quiz-cat">【${m.category}】</span>
        <div>
          <button class="btn btn-outline" style="padding:3px 8px; font-size:0.72rem;" onclick="toggleMistake(${m.id})">
            ${m.is_mastered ? '✅ 已掌握' : '⏳ 标记已掌握'}
          </button>
          <button class="btn btn-outline" style="padding:3px 6px; font-size:0.72rem; color:var(--accent-red);" onclick="deleteMistake(${m.id})">
            🗑️
          </button>
        </div>
      </div>
      <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:4px;">${escapeHtml(m.title)}</h4>
      <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:6px;"><strong>原题：</strong>${escapeHtml(m.question)}</p>
      <div style="background:var(--bg-surface); padding:8px; border-radius:4px; font-size:0.78rem; margin-bottom:4px;">
        <span style="color:var(--accent-red);">❌ 我的错因：${escapeHtml(m.my_mistake)}</span>
      </div>
      <div style="background:var(--bg-surface); padding:8px; border-radius:4px; font-size:0.78rem; border-left:3px solid var(--accent-green);">
        <span style="color:var(--accent-green);">💡 解析要点：${escapeHtml(m.correct_analysis)}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function openAddMistakeModal() {
  document.getElementById('modal-add-mistake').classList.remove('hidden');
}

function closeAddMistakeModal() {
  document.getElementById('modal-add-mistake').classList.add('hidden');
}

function submitNewMistake() {
  const title = document.getElementById('mistake-title-input').value.trim();
  const question = document.getElementById('mistake-q-input').value.trim();
  if (!title || !question) {
    alert('请填写考点标题和题目内容！');
    return;
  }

  const newM = {
    id: Date.now(),
    category: document.getElementById('mistake-cat-input').value,
    title: title,
    question: question,
    my_mistake: document.getElementById('mistake-my-input').value.trim(),
    correct_analysis: document.getElementById('mistake-analysis-input').value.trim(),
    is_mastered: 0
  };

  appState.mistakes.unshift(newM);
  saveLocalMistakes(appState.mistakes);
  closeAddMistakeModal();
  document.getElementById('mistake-title-input').value = '';
  document.getElementById('mistake-q-input').value = '';
  document.getElementById('mistake-my-input').value = '';
  document.getElementById('mistake-analysis-input').value = '';
  loadMistakes();
}

function toggleMistake(id) {
  const item = appState.mistakes.find(m => m.id === id);
  if (item) {
    item.is_mastered = item.is_mastered === 1 ? 0 : 1;
    saveLocalMistakes(appState.mistakes);
    loadMistakes();
  }
}

function deleteMistake(id) {
  if (!confirm('确定删除此错题记录吗？')) return;
  appState.mistakes = appState.mistakes.filter(m => m.id !== id);
  saveLocalMistakes(appState.mistakes);
  loadMistakes();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.activeMistakeFilter = chip.getAttribute('data-filter');
    renderMistakes();
  });
});
