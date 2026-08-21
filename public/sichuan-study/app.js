/**
 * 2027 四川紧缺选调生 · 智能备考全栈与移动端自闭环系统
 * 核心升级：艾宾浩斯遗忘曲线抗遗忘连续答对机制（连对3次方可科学归入“已掌握”，做错1次立即清零打回“待复习”）
 */

const EMBEDDED_KNOWLEDGE = {
  "quiz_bank": [
    {
      "id": 1,
      "category": "习近平新时代中国特色社会主义思想与时政",
      "type": "single",
      "question": "习近平新时代中国特色社会主义思想的世界观和方法论集中体现为“六个必须坚持”。下列哪一项不属于“六个必须坚持”？",
      "options": ["A. 必须坚持人民至上", "B. 必须坚持自信自立", "C. 必须坚持深化改革", "D. 必须坚持系统观念"],
      "answer": "C",
      "explanation": "‘六个必须坚持’是：必须坚持人民至上、必须坚持自信自立、必须坚持守正创新、必须坚持问题导向、必须坚持系统观念、必须坚持胸怀天下。C选项‘必须坚持深化改革’不属于六个必须坚持。"
    },
    {
      "id": 2,
      "category": "法律常识",
      "type": "single",
      "question": "根据《中华人民共和国行政处罚法》，下列哪一类行政处罚只能由法律设定？",
      "options": ["A. 限制人身自由的行政处罚", "B. 责令停产停业", "C. 没收违法所得、没收非法财物", "D. 较大数额罚款"],
      "answer": "A",
      "explanation": "《行政处罚法》规定，限制人身自由的行政处罚只能由法律设定。行政法规可以设定除限制人身自由以外的行政处罚。"
    },
    {
      "id": 3,
      "category": "公文写作与改错",
      "type": "single",
      "question": "在党政机关公文格式中，关于‘请示’的规则，下列说法错误的是：",
      "options": ["A. 请示应当一文一事", "B. 请示原则上主送一个上级机关", "C. 请示根据需要可以同时抄送下级机关", "D. 请示不得夹带报告事项"],
      "answer": "C",
      "explanation": "《党政机关公文处理工作条例》第15条明确规定：向上级机关行文，原则上主送一个上级机关，根据需要同时抄送相关上级机关和同级机关，不抄送下级机关。"
    }
  ]
};

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

let appState = {
  currentDateStr: getRealCurrentDateStr(),
  calendarData: [],
  todayTasks: [],
  modalTasks: [],
  activeDateDetail: null,
  mistakes: [],
  activeMistakeFilter: 'all',
  activeMistakeCategory: 'all',
  parsedMistakeData: null,
  ollamaRunning: false
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
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日 (${weekdays[d.getDay()]})`;
  }
  return dateStr;
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRealDateDisplay();
  initTabs();
  initSubTabs();
  detectOllamaStatus();
  loadData();
  renderKnowledgeArticle('kb-policy');
  loadRandomQuiz();
  bindEvents();
});

// 检查本地大模型运行状态
async function detectOllamaStatus() {
  const badgeText = document.getElementById('status-badge-text');
  const dot = document.querySelector('#global-ai-status-badge .status-dot');
  const chatTag = document.getElementById('chat-engine-status-tag');

  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (res.ok) {
      const data = await res.json();
      const hasQwen = data.models && data.models.some(m => m.name.includes('qwen2.5'));
      appState.ollamaRunning = true;
      if (badgeText) badgeText.textContent = hasQwen ? '千问 2.5-3B 本地在线' : 'Ollama 本地就绪';
      if (dot) { dot.className = 'status-dot green-dot'; }
      if (chatTag) {
        chatTag.textContent = '🟢 本地千问 2.5-3B (Ollama 实时推理)';
        chatTag.className = 'engine-tag-pill source-llm';
      }
      return;
    }
  } catch (e) {}

  appState.ollamaRunning = false;
  if (badgeText) badgeText.textContent = '本地精准知识库模式';
  if (dot) { dot.className = 'status-dot blue-dot'; }
  if (chatTag) {
    chatTag.textContent = '🔵 本地精准考情知识库模式';
    chatTag.className = 'engine-tag-pill source-kb';
  }
}

/* ==========================================================================
   1. 数据存储与加载
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
  const raw = localStorage.getItem('sc_study_mistakes_v3');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return [
    {
      id: 1,
      category: "法律常识",
      title: "行政处罚设定权限与种类",
      question_type: "single",
      question: "根据《中华人民共和国行政处罚法》，下列哪一类行政处罚只能由法律设定？",
      options: ["A. 限制人身自由的行政处罚", "B. 责令停产停业", "C. 没收违法所得", "D. 较大数额罚款"],
      correct_answer: "A",
      user_answer: "B",
      correct_analysis: "《行政处罚法》明确规定，限制人身自由的行政处罚只能由法律设定。行政法规可以设定除限制人身自由以外的行政处罚。",
      key_point: "行政处罚设定权",
      attempt_count: 1,
      correct_count: 0,
      correct_streak: 0,
      mastery_threshold: 3,
      is_mastered: 0
    }
  ];
}

function saveLocalMistakes(mistakes) {
  localStorage.setItem('sc_study_mistakes_v3', JSON.stringify(mistakes));
}

function getAiSettings() {
  const raw = localStorage.getItem('sc_ai_settings');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return {
    engine_type: "ollama",
    ollama_url: "http://localhost:11434/api/generate",
    ollama_model: "qwen2.5:3b",
    api_url: "https://api.deepseek.com/v1/chat/completions",
    api_key: "",
    api_model: "deepseek-chat"
  };
}

function saveAiSettingsData(data) {
  localStorage.setItem('sc_ai_settings', JSON.stringify(data));
}

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
  if (appState.todayTasks[index]) appState.todayTasks[index].content = value;
}
function onTodayTaskDurationInput(index, value) {
  if (appState.todayTasks[index]) appState.todayTasks[index].duration = parseFloat(value) || 0.0;
  updateTodaySummaryBadges();
}
function onTodayTaskCatChange(index, newCat) {
  if (appState.todayTasks[index]) appState.todayTasks[index].category = newCat;
  updateTodaySummaryBadges();
}
function onTodayTaskCheck(index, isDone) {
  if (appState.todayTasks[index]) appState.todayTasks[index].is_done = isDone;
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
  appState.todayTasks.push({ id: `task-${Date.now()}`, category: "公基与法律", content: "新复习任务", duration: 1.0, is_done: false });
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
        body: JSON.stringify({ date: appState.currentDateStr, tasks: appState.todayTasks, notes: notes })
      });
    } catch (e) {}
    alert('🎉 打卡数据已成功保存！');
    calculateAndRenderDashboard();
    renderCalendar();
  });

  document.getElementById('kb-search-input').addEventListener('input', (e) => {
    filterKnowledgeMenu(e.target.value);
  });
}

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
  if (appState.modalTasks[index]) appState.modalTasks[index].content = value;
}
function onModalTaskDurationInput(index, value) {
  if (appState.modalTasks[index]) appState.modalTasks[index].duration = parseFloat(value) || 0.0;
}
function onModalTaskCatChange(index, newCat) {
  if (appState.modalTasks[index]) appState.modalTasks[index].category = newCat;
}
function onModalTaskCheck(index, isDone) {
  if (appState.modalTasks[index]) appState.modalTasks[index].is_done = isDone;
  const row = document.getElementById(`modal-task-row-${index}`);
  if (row) {
    if (isDone) row.classList.add('is-done');
    else row.classList.remove('is-done');
  }
}
function addModalTaskRow() {
  appState.modalTasks.push({ id: `task-${Date.now()}`, category: "公基与法律", content: "新任务项", duration: 1.0, is_done: false });
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
      body: JSON.stringify({ date: date, tasks: appState.modalTasks, notes: notes })
    });
  } catch (e) {}
  closeDateModal();
  calculateAndRenderDashboard();
  renderCalendar();
}

function renderKnowledgeArticle(target) {
  const display = document.getElementById('kb-content-display');
  if (!display) return;
  const docData = {
    'kb-policy': `
      <h2 class="kb-article-title">🏛️ 四川定向选调百科与核心报考规则</h2>
      <div class="kb-article-body">
        <p><strong>报考门槛（中山大学硕士研究生）：</strong></p>
        <ul>
          <li>年龄要求：硕士不超过 30 周岁。</li>
          <li>硬性指标四选一：中共党员（含预备）/ 担任班长或研会部长满1年 / 校级一等以上奖学金 / 校级三好/优干荣誉。</li>
        </ul>
        <br>
        <p><strong>🎯 志愿流转红利：</strong></p>
        <p>第一志愿冲成都/省直（1:3进面）。若未进面，第二、三志愿（绵阳等市州）自动升级为第一志愿，<strong>达到省合格线全员进面</strong>！</p>
      </div>`,
    'kb-score': `
      <h2 class="kb-article-title">📋 笔试科目与分值揭秘 (100分机考)</h2>
      <div class="kb-article-body">
        <p>- <strong>单选题</strong>：60题，每题0.8分，共48分（习思想、行政法为主）<br>
        - <strong>多选题</strong>：10题，每题1.2分，共12分（<strong>错选漏选少选均0分</strong>）<br>
        - <strong>判断题</strong>：10题，每题1.0分，共10分<br>
        - <strong>公文写作</strong>：1大题，共30分（实务公文大题，格式极其严苛）</p>
      </div>`
  };
  display.innerHTML = docData[target] || `<div class="kb-article-body"><p>请在左侧菜单点击对应条目进行查阅。</p></div>`;
}

function filterKnowledgeMenu(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.kb-menu-item').forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(q) ? 'block' : 'none';
  });
}

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
  botMsg.innerHTML = `<div class="msg-bubble">🤖 助教正在分析中...</div>`;
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
      const isLlm = data.engine_source === 'ollama_qwen';
      const sourceBadgeHtml = `<div class="msg-source-tag ${isLlm ? 'source-llm' : 'source-kb'}">${data.engine_label || '🔵 来源：本地知识库'}</div>`;

      botMsg.innerHTML = `
        <div class="msg-bubble">
          ${sourceBadgeHtml}
          <h4 style="color:var(--primary); margin-bottom:4px;">${data.title}</h4>
          <div style="white-space: pre-wrap;">${data.content}</div>
        </div>
      `;
      box.scrollTop = box.scrollHeight;
      return;
    }
  } catch (err) {}

  botMsg.innerHTML = `
    <div class="msg-bubble">
      <div class="msg-source-tag source-kb">🔵 来源：本地离线备考速记库</div>
      💡 针对“${escapeHtml(text)}”：四川选调核心在公基习思想、行政法与公文手写。坚持每日作息，必能上岸！
    </div>
  `;
  box.scrollTop = box.scrollHeight;
}

function sendPrompt(text) {
  document.getElementById('chat-input-text').value = text;
  submitChat();
}

function handleChatKey(e) {
  if (e.key === 'Enter') submitChat();
}

function loadRandomQuiz() {
  renderQuiz(EMBEDDED_KNOWLEDGE.quiz_bank);
}

function renderQuiz(questions) {
  const container = document.getElementById('quiz-container');
  if (!container) return;
  container.innerHTML = '';

  questions.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-item-card';
    card.innerHTML = `
      <div class="quiz-header">
        <span class="quiz-cat">【${q.category}】</span>
        <span class="badge badge-primary">第 ${qIndex + 1} 题</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map(opt => `
          <button class="quiz-opt-btn" onclick="selectQuizOption(this, '${q.answer}', '${escapeHtml(q.explanation)}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div class="quiz-explanation-box" style="display:none;"></div>
    `;
    container.appendChild(card);
  });
}

function selectQuizOption(btn, correctAns, expText) {
  const parent = btn.parentElement;
  const optChar = btn.textContent.trim().charAt(0);
  const expBox = parent.nextElementSibling;

  if (optChar === correctAns) {
    btn.classList.add('selected-correct');
  } else {
    btn.classList.add('selected-wrong');
  }

  expBox.style.display = 'block';
  expBox.innerHTML = `<strong>【正确答案】：</strong>${correctAns}<br><strong>【深度解析】：</strong>${expText}`;
}

function fillDocSample() {
  document.getElementById('doc-text-input').value = `关于开展防范地质灾害专项安全检查的通知
成委办发〔2026〕12号
各区（市）县人民政府，市级各部门：

    当前，我市已进入主汛期，地质灾害防治形势十分严峻。为切实保障人民群众生命财产安全，现将有关事项通知如下：
    一、 工作目标
    全面排查隐患，压紧压实责任，确保安全度汛。
    二、 检查重点与措施
    （一）聚焦重点区域排查。组织测绘与自然资源专业力量，开展卫星遥感拉网式核查。
    三、 工作要求
    各部门要强化大局意识，确保责任到人。

成都市人民政府
2026年9月10日`;
}

async function submitGradeDoc() {
  const content = document.getElementById('doc-text-input').value.trim();
  if (!content) {
    alert('请先输入公文内容！');
    return;
  }
  const resultBox = document.getElementById('doc-grade-result');
  resultBox.innerHTML = '<div class="result-placeholder"><p>🚀 正在调用本地公文诊断模型全面评估...</p></div>';

  try {
    const res = await fetch('/api/document/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    });
    if (res.ok) {
      const data = await res.json();
      const r = data.result;
      resultBox.innerHTML = `
        <div class="score-display-card">
          <div>
            <span style="font-size:0.8rem;">综合诊断得分</span>
            <div class="score-num">${r.score} <small style="font-size:0.9rem;">/ 30分</small></div>
            <span style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px;">${r.level}</span>
          </div>
          <div style="text-align:right; font-size:0.8rem;">
            <div>字数：${r.char_count} 字</div>
          </div>
        </div>
        <div class="result-section">
          <h5>✨ 亮点要素</h5>
          <ul style="padding-left:16px; font-size:0.82rem; color:var(--accent-green);">
            ${r.highlights.map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
        <div class="result-section">
          <h5>⚠️ 扣分项诊断</h5>
          <ul style="padding-left:16px; font-size:0.82rem; color:var(--accent-red);">
            ${r.deductions.length ? r.deductions.map(d => `<li>${d}</li>`).join('') : '<li>🎉 格式规范，无硬伤扣分！</li>'}
          </ul>
        </div>
      `;
      return;
    }
  } catch (e) {}
}

/* ==========================================================================
   7. 艾宾浩斯抗遗忘连续答对掌握度核心
   ========================================================================== */

function loadMistakes() {
  appState.mistakes = getLocalMistakes();
  renderMistakes();
  updateMistakeCounters();
}

function updateMistakeCounters() {
  const allCount = appState.mistakes.length;
  const unmasteredCount = appState.mistakes.filter(m => (m.is_mastered || 0) === 0).length;
  const masteredCount = appState.mistakes.filter(m => (m.is_mastered || 0) === 1).length;

  const elAll = document.getElementById('count-all');
  const elUn = document.getElementById('count-unmastered');
  const elMas = document.getElementById('count-mastered');
  const elStat = document.getElementById('stat-mistakes');

  if (elAll) elAll.textContent = allCount;
  if (elUn) elUn.textContent = unmasteredCount;
  if (elMas) elMas.textContent = masteredCount;
  if (elStat) elStat.textContent = unmasteredCount;
}

function renderMistakes() {
  const container = document.getElementById('mistakes-container');
  if (!container) return;
  container.innerHTML = '';

  let filtered = appState.mistakes;

  if (appState.activeMistakeFilter === 'unmastered') {
    filtered = filtered.filter(m => (m.is_mastered || 0) === 0);
  } else if (appState.activeMistakeFilter === 'mastered') {
    filtered = filtered.filter(m => (m.is_mastered || 0) === 1);
  }

  if (appState.activeMistakeCategory !== 'all') {
    filtered = filtered.filter(m => m.category.includes(appState.activeMistakeCategory) || appState.activeMistakeCategory.includes(m.category));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:36px; color:var(--text-muted); font-size:0.85rem;">暂无对应错题。点击右上角“✨ AI 一键录入错题”快速添加！</div>';
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement('div');
    const isMastered = (m.is_mastered || 0) === 1;
    const streak = m.correct_streak || 0;
    const threshold = m.mastery_threshold || 3;

    card.className = `interactive-mistake-card ${isMastered ? 'is-mastered-card' : ''}`;
    card.id = `mistake-card-${m.id}`;

    const options = Array.isArray(m.options) && m.options.length > 0 
      ? m.options 
      : ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"];

    const attempts = m.attempt_count || 0;

    // 艾宾浩斯掌握阶梯状态
    let levelBadge = `<span class="badge badge-primary">🔴 盲点 (连对 0/${threshold})</span>`;
    let levelTip = "初始错题，请进行复练";
    if (isMastered || streak >= threshold) {
      levelBadge = `<span class="badge badge-success">🏆 艾宾浩斯抗遗忘认证 · 已掌握</span>`;
      levelTip = `已连续答对 ${streak} 次，达成长期记忆！`;
    } else if (streak === 2) {
      levelBadge = `<span class="badge badge-amber">🟠 巩固期 (连对 2/${threshold})</span>`;
      levelTip = `再连对 1 次即可达成科学已掌握！`;
    } else if (streak === 1) {
      levelBadge = `<span class="badge badge-amber">🟡 强化期 (连对 1/${threshold})</span>`;
      levelTip = `短期记忆建立，需继续连对 2 次巩固`;
    }

    // 3 槽式刻度条
    const slot1Active = streak >= 1 ? 'active-1' : '';
    const slot2Active = streak >= 2 ? 'active-2' : '';
    const slot3Active = streak >= 3 ? 'active-3' : '';

    card.innerHTML = `
      <div class="mistake-card-top">
        <div class="mistake-badges-group">
          ${levelBadge}
          <span class="kp-tag">【${m.category}】</span>
          ${m.key_point ? `<span class="kp-tag" style="background:rgba(217,119,6,0.1); color:var(--accent-amber);">🏷️ ${m.key_point}</span>` : ''}
          <span class="stats-tag">已练: ${attempts}次</span>
        </div>
        <div>
          <button class="btn btn-outline" style="padding:3px 8px; font-size:0.72rem;" onclick="toggleMistakeMasterStatus(${m.id})">
            ${isMastered ? '标记为待复习' : '直接手动掌握'}
          </button>
          <button class="btn btn-outline" style="padding:3px 6px; font-size:0.72rem; color:var(--accent-red);" onclick="deleteMistake(${m.id})">
            🗑️
          </button>
        </div>
      </div>

      <!-- 艾宾浩斯连续掌握度进度条卡片 -->
      <div class="ebbinghaus-streak-card" id="streak-card-${m.id}">
        <div class="streak-left-info">
          <span>🧠 艾宾浩斯掌握阶梯:</span>
          <div class="streak-progress-grid">
            <div class="streak-slot ${slot1Active}" title="第1次答对：强化期"></div>
            <div class="streak-slot ${slot2Active}" title="第2次答对：巩固期"></div>
            <div class="streak-slot ${slot3Active}" title="第3次答对：科学已掌握"></div>
          </div>
          <span style="color:var(--primary); font-size:0.75rem;">(${streak}/${threshold} 连对)</span>
        </div>
        <div class="streak-tip-text" id="streak-tip-${m.id}">${levelTip}</div>
      </div>

      <div class="mistake-q-title">${escapeHtml(m.question)}</div>

      <div class="practice-options-grid" id="practice-opts-${m.id}">
        ${options.map(opt => `
          <button class="practice-opt-btn" onclick="attemptMistakeChoice(${m.id}, '${opt.charAt(0)}', this)">
            <span>${escapeHtml(opt)}</span>
            <span class="opt-feedback-icon"></span>
          </button>
        `).join('')}
      </div>

      <div class="mistake-analysis-drawer" id="analysis-drawer-${m.id}" style="display:none;">
        <div style="margin-bottom:4px;">
          <strong>【参考答案】：</strong><span style="color:var(--accent-green); font-weight:700;">${m.correct_answer || 'A'}</span>
          ${m.user_answer ? `<span style="color:var(--accent-red); margin-left:12px;">（曾错选：${m.user_answer}）</span>` : ''}
        </div>
        <div><strong>【深度解析】：</strong>${escapeHtml(m.correct_analysis || '暂无解析')}</div>
      </div>

      <div class="mistake-actions-bar">
        <button class="btn btn-outline btn-sm" style="font-size:0.75rem;" onclick="resetPracticeCard(${m.id})">🔄 重新练习此题</button>
        <button class="btn btn-outline btn-sm" style="font-size:0.75rem;" onclick="toggleAnalysisDrawer(${m.id})">👁️ 查看解析</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// 核心作答判定：艾宾浩斯抗遗忘连续答对流转
async function attemptMistakeChoice(mistakeId, choiceChar, btnEl) {
  const item = appState.mistakes.find(m => m.id === mistakeId);
  if (!item) return;

  const correctAns = (item.correct_answer || "A").trim().toUpperCase();
  const userChoice = choiceChar.trim().toUpperCase();
  const isCorrect = (userChoice === correctAns);
  const threshold = item.mastery_threshold || 3;

  const container = document.getElementById(`practice-opts-${mistakeId}`);
  const allBtns = container.querySelectorAll('.practice-opt-btn');
  const drawer = document.getElementById(`analysis-drawer-${mistakeId}`);
  const card = document.getElementById(`mistake-card-${mistakeId}`);

  allBtns.forEach(b => {
    const c = b.textContent.trim().charAt(0);
    if (c === correctAns) b.classList.add('correct-choice');
  });

  if (!isCorrect) {
    btnEl.classList.add('wrong-choice');
  }

  if (drawer) drawer.style.display = 'block';

  item.attempt_count = (item.attempt_count || 0) + 1;

  if (isCorrect) {
    item.correct_count = (item.correct_count || 0) + 1;
    item.correct_streak = (item.correct_streak || 0) + 1;

    if (item.correct_streak >= threshold) {
      item.is_mastered = 1;
      card.classList.add('is-mastered-card');
      alert(`🎉 恭喜！此题已连续答对 ${item.correct_streak} 次，达成【艾宾浩斯抗遗忘认证 · 科学已掌握】！`);
    } else {
      item.is_mastered = 0;
      card.classList.remove('is-mastered-card');
      alert(`✨ 答对了！当前连续答对 ${item.correct_streak}/${threshold} 次。再连对 ${threshold - item.correct_streak} 次即可真正掌握！`);
    }
  } else {
    // 答错惩罚：立即清零，坚决打回“待复习”
    item.correct_streak = 0;
    item.is_mastered = 0;
    card.classList.remove('is-mastered-card');
    alert(`❌ 遗憾做错！根据抗遗忘曲线，连对进度已清零重置为【待复习】。请认真查看下方深度解析！`);
  }

  saveLocalMistakes(appState.mistakes);
  renderMistakes();
  updateMistakeCounters();

  try {
    await fetch(`/api/mistakes/${mistakeId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_choice: userChoice })
    });
  } catch (e) {}
}

function resetPracticeCard(mistakeId) {
  const container = document.getElementById(`practice-opts-${mistakeId}`);
  if (container) {
    container.querySelectorAll('.practice-opt-btn').forEach(b => {
      b.classList.remove('correct-choice', 'wrong-choice');
    });
  }
  const drawer = document.getElementById(`analysis-drawer-${mistakeId}`);
  if (drawer) drawer.style.display = 'none';
}

function toggleAnalysisDrawer(mistakeId) {
  const drawer = document.getElementById(`analysis-drawer-${mistakeId}`);
  if (drawer) {
    drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleMistakeMasterStatus(id) {
  const item = appState.mistakes.find(m => m.id === id);
  if (item) {
    const isM = (item.is_mastered || 0) === 1;
    item.is_mastered = isM ? 0 : 1;
    item.correct_streak = isM ? 0 : (item.mastery_threshold || 3);
    saveLocalMistakes(appState.mistakes);
    renderMistakes();
    updateMistakeCounters();
  }
}

function deleteMistake(id) {
  if (!confirm('确定删除此错题吗？')) return;
  appState.mistakes = appState.mistakes.filter(m => m.id !== id);
  saveLocalMistakes(appState.mistakes);
  renderMistakes();
  updateMistakeCounters();
}

function openAiAddMistakeModal() {
  document.getElementById('modal-ai-add-mistake').classList.remove('hidden');
  document.getElementById('raw-mistake-input').value = '';
  document.getElementById('ai-parsed-preview').classList.add('hidden');
  document.getElementById('btn-save-parsed-mistake').disabled = true;
}

function closeAiAddMistakeModal() {
  document.getElementById('modal-ai-add-mistake').classList.add('hidden');
}

function fillSampleMistakeText() {
  document.getElementById('raw-mistake-input').value = `【单选】根据我国《中华人民共和国行政处罚法》，下列哪一类行政处罚只能由法律设定？
A. 限制人身自由的行政处罚
B. 责令停产停业
C. 没收违法所得、没收非法财物
D. 暂扣许可证件
【正确答案】：A
【我的答案】：B
【解析】：本题考查行政处罚的设定权限。《行政处罚法》第十条明确规定：限制人身自由的行政处罚，只能由法律设定。行政法规可以设定除限制人身自由以外的行政处罚。因此本题选A。`;
}

async function executeAiParseMistake() {
  const rawText = document.getElementById('raw-mistake-input').value.trim();
  if (!rawText) {
    alert('请先粘贴错题文本！');
    return;
  }

  const btn = document.getElementById('btn-parse-mistake');
  btn.textContent = '🚀 AI 正在提取结构化考点中...';
  btn.disabled = true;

  const settings = getAiSettings();
  let parsed = null;

  try {
    const res = await fetch('/api/ai/parse-mistake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, engine_config: settings })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.parsed) parsed = data.parsed;
    }
  } catch (e) {}

  if (!parsed) {
    parsed = localRuleBasedParseMistake(rawText);
  }

  btn.textContent = '🚀 AI 智能提取并结构化';
  btn.disabled = false;

  appState.parsedMistakeData = parsed;
  document.getElementById('parsed-cat-select').value = parsed.category || "法律常识";
  document.getElementById('parsed-q-input').value = parsed.question || "";
  document.getElementById('parsed-opts-input').value = (parsed.options || []).join('\n');
  document.getElementById('parsed-ans-input').value = parsed.correct_answer || "A";
  document.getElementById('parsed-my-input').value = parsed.user_answer || "";
  document.getElementById('parsed-kp-input').value = parsed.key_point || "";
  document.getElementById('parsed-exp-input').value = parsed.correct_analysis || "";

  const pill = document.getElementById('parsed-engine-source-pill');
  if (pill) {
    pill.textContent = parsed.engine_label || (appState.ollamaRunning ? '🟢 本地千问 2.5-3B 大模型' : '🔵 本地规则引擎');
  }

  document.getElementById('ai-parsed-preview').classList.remove('hidden');
  document.getElementById('btn-save-parsed-mistake').disabled = false;
}

function localRuleBasedParseMistake(raw) {
  const text = raw.trim();
  let category = "法律常识";
  const low = text.toLowerCase();

  if (low.includes("习思想") || low.includes("习近平") || low.includes("二十大") || low.includes("三中全会") || low.includes("新时代")) {
    category = "习近平新时代中国特色社会主义思想与时政";
  } else if (low.includes("行政") || low.includes("宪法") || low.includes("刑法") || low.includes("民法") || low.includes("法条")) {
    category = "法律常识";
  } else if (low.includes("公文") || low.includes("请示") || low.includes("发文字号") || low.includes("通知")) {
    category = "公文写作与改错";
  } else if (low.includes("言语") || low.includes("资料分析") || low.includes("增长率") || low.includes("图推")) {
    category = "行测专项";
  } else {
    category = "非法律公基";
  }

  let ans = "A";
  const ansMatch = text.match(/(?:正确答案|参考答案|答案|【答案】)[：:\s]*([A-Da-d]+|正确|错误|对|错)/);
  if (ansMatch) {
    ans = ansMatch[1].toUpperCase();
    if (ans === "对" || ans === "正确") ans = "A";
    if (ans === "错" || ans === "错误") ans = "B";
  }

  let myAns = "";
  const myMatch = text.match(/(?:我的答案|我的选择|错选|作答)[：:\s]*([A-Da-d]+)/);
  if (myMatch) myAns = myMatch[1].toUpperCase();

  let exp = "掌握核心考点与相关法条。";
  const expMatch = text.match(/(?:解析|深度解析|【解析】|答案解析)[：:\s]*([\s\S]+)/);
  if (expMatch) exp = expMatch[1].trim();

  const cleanParts = text.split(/(?:正确答案|参考答案|答案|【答案】|我的答案|我的选择|【解析】|解析|答案解析)/);
  const clean = cleanParts[0].trim();

  const optMatches = clean.match(/([A-D][.、\s]+[^\nA-D]+)/g);
  let options = [];
  let question = clean;

  if (optMatches && optMatches.length >= 2) {
    options = optMatches.map(o => o.trim());
    const firstOptIdx = clean.indexOf(optMatches[0]);
    question = clean.substring(0, firstOptIdx).trim();
  } else {
    options = ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"];
  }

  question = question.replace(/^(?:【[^】]+】|\d+[\.、\s]*)/, '').trim();

  return {
    category: category,
    title: question.slice(0, 18),
    question_type: "single",
    question: question,
    options: options,
    correct_answer: ans,
    user_answer: myAns,
    correct_analysis: exp,
    key_point: category.split(' - ')[0],
    engine_label: "🛡️ 内置极速智能规则引擎"
  };
}

function confirmSaveParsedMistake() {
  const cat = document.getElementById('parsed-cat-select').value;
  const q = document.getElementById('parsed-q-input').value.trim();
  const optsRaw = document.getElementById('parsed-opts-input').value.trim();
  const ans = document.getElementById('parsed-ans-input').value.trim().toUpperCase();
  const myAns = document.getElementById('parsed-my-input').value.trim().toUpperCase();
  const kp = document.getElementById('parsed-kp-input').value.trim();
  const exp = document.getElementById('parsed-exp-input').value.trim();

  if (!q) {
    alert('题干不能为空！');
    return;
  }

  const options = optsRaw.split('\n').map(s => s.trim()).filter(s => s);

  const newMistake = {
    id: Date.now(),
    category: cat,
    title: q.slice(0, 20),
    question_type: "single",
    question: q,
    options: options.length > 0 ? options : ["A. 选项A", "B. 选项B"],
    correct_answer: ans || "A",
    user_answer: myAns,
    correct_analysis: exp,
    key_point: kp,
    attempt_count: 0,
    correct_count: 0,
    correct_streak: 0,
    mastery_threshold: 3,
    is_mastered: 0
  };

  appState.mistakes.unshift(newMistake);
  saveLocalMistakes(appState.mistakes);

  try {
    fetch('/api/mistakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMistake)
    });
  } catch (e) {}

  closeAiAddMistakeModal();
  renderMistakes();
  updateMistakeCounters();
  alert('🎉 错题已成功智能入库！需连续答对 3 次方可达成【艾宾浩斯抗遗忘认证】。');
}

function openAiSettingsModal() {
  const s = getAiSettings();
  document.getElementById('setting-engine-type').value = s.engine_type || "ollama";
  document.getElementById('setting-ollama-url').value = s.ollama_url || "http://localhost:11434/api/generate";
  document.getElementById('setting-ollama-model').value = s.ollama_model || "qwen2.5:3b";
  document.getElementById('setting-api-url').value = s.api_url || "https://api.deepseek.com/v1/chat/completions";
  document.getElementById('setting-api-key').value = s.api_key || "";
  document.getElementById('setting-api-model').value = s.api_model || "deepseek-chat";

  toggleEngineSettings();
  document.getElementById('modal-ai-settings').classList.remove('hidden');
}

function closeAiSettingsModal() {
  document.getElementById('modal-ai-settings').classList.add('hidden');
}

function toggleEngineSettings() {
  const type = document.getElementById('setting-engine-type').value;
  const ollamaGroup = document.getElementById('ollama-config-group');
  const openaiGroup = document.getElementById('openai-config-group');

  ollamaGroup.classList.add('hidden');
  openaiGroup.classList.add('hidden');

  if (type === 'ollama') ollamaGroup.classList.remove('hidden');
  if (type === 'openai') openaiGroup.classList.remove('hidden');
}

function saveAiSettings() {
  const data = {
    engine_type: document.getElementById('setting-engine-type').value,
    ollama_url: document.getElementById('setting-ollama-url').value.trim(),
    ollama_model: document.getElementById('setting-ollama-model').value.trim(),
    api_url: document.getElementById('setting-api-url').value.trim(),
    api_key: document.getElementById('setting-api-key').value.trim(),
    api_model: document.getElementById('setting-api-model').value.trim()
  };
  saveAiSettingsData(data);
  closeAiSettingsModal();
  detectOllamaStatus();
  alert('⚙️ AI 引擎配置已成功保存！');
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

document.querySelectorAll('.cat-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.activeMistakeCategory = chip.getAttribute('data-cat');
    renderMistakes();
  });
});
