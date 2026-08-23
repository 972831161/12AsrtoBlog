/**
 * 2027 四川紧缺选调生 · 智能备考全栈与移动端自闭环系统
 * 核心升级：
 * 1. 数据防丢失与全自动多版本平滑找回（Auto Recovery & Migration）
 * 2. 跨端备份与同步（导出/导入 JSON、跨端同步码一键秒传）
 * 3. 艾宾浩斯遗忘曲线抗遗忘连续答对机制（连对 3 次科学判定已掌握）
 * 4. 来源标识明确展示（本地千问2.5-3B / 云端API / 本地考情知识库）
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

// 持久化主存储键名（锁定固定，永不修改）
const STORAGE_KEYS = {
  PLANS_MASTER: 'sichuan_study_plans_master',
  MISTAKES_MASTER: 'sichuan_study_mistakes_master',
  SETTINGS: 'sichuan_ai_settings_master',
  THEME: 'sichuan_study_theme'
};

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

document.addEventListener('DOMContentLoaded', async () => {
  checkUrlSyncPayload();
  initTheme();
  initRealDateDisplay();
  initTabs();
  initSubTabs();
  detectOllamaStatus();
  await loadData();
  renderKnowledgeArticle('kb-policy');
  loadRandomQuiz();
  bindEvents();
  autoPullRemoteSync(); // 自动无感拉取远端最新合并数据
});

// 当手机从后台切回前台时，自动静默检测并同步最新数据
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    autoPullRemoteSync();
  }
});

// 检查 URL 中是否有扫码传入的极速同步数据
function checkUrlSyncPayload() {
  try {
    const params = new URLSearchParams(window.location.search);
    const syncB64 = params.get('sync');
    if (syncB64) {
      const jsonStr = decodeURIComponent(atob(syncB64));
      const data = JSON.parse(jsonStr);
      if (data.plans) {
        localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(data.plans));
      }
      if (data.mistakes) {
        localStorage.setItem(STORAGE_KEYS.MISTAKES_MASTER, JSON.stringify(data.mistakes));
      }
      // 清除 URL 里的长参数，保持地址栏干净
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      setTimeout(() => {
        alert('🎉 手机端已成功同步电脑上的全部打卡和错题数据！');
      }, 300);
    }
  } catch (e) {
    console.warn("自动同步参数解析跳过:", e);
  }
}

// 检查本地大模型与公网安全隧道运行状态
async function detectOllamaStatus() {
  const badgeText = document.getElementById('status-badge-text');
  const dot = document.querySelector('#global-ai-status-badge .status-dot');
  const chatTag = document.getElementById('chat-engine-status-tag');

  // 1. 本地直连探测
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

  // 2. 手机/外网在线端：全自动安全隧道探测
  try {
    const tunnelRes = await fetch('active_tunnel.json?t=' + Date.now());
    if (tunnelRes.ok) {
      const tData = await tunnelRes.json();
      if (tData.tunnel_base) {
        const testRes = await fetch(`${tData.tunnel_base}/api/tags`);
        if (testRes.ok) {
          appState.ollamaRunning = true;
          appState.activeTunnelUrl = tData.active_tunnel;
          
          // 自动同步到设置中
          const s = getAiSettings();
          s.ollama_url = tData.active_tunnel;
          saveAiSettingsData(s);

          if (badgeText) badgeText.textContent = '千问 2.5-3B 隧道在线';
          if (dot) { dot.className = 'status-dot green-dot'; }
          if (chatTag) {
            chatTag.textContent = '🟢 千问 2.5-3B 安全隧道 (Mac实时算力)';
            chatTag.className = 'engine-tag-pill source-llm';
          }
          return;
        }
      }
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
   1. 数据存储、多版本自动扫描找回与增量合并（防丢核心）
   ========================================================================== */

function getLocalPlans() {
  // 1. 优先读取主存储键
  let masterRaw = localStorage.getItem(STORAGE_KEYS.PLANS_MASTER);
  let masterPlans = null;
  if (masterRaw) {
    try { masterPlans = JSON.parse(masterRaw); } catch (e) {}
  }

  // 2. 如果主存储不存在，自动从历史所有键与内嵌底座中扫描找回
  if (!masterPlans || Object.keys(masterPlans).length === 0) {
    masterPlans = recoverAndMigrateHistoricalPlans();
    localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(masterPlans));
  }

  return masterPlans;
}

// 智能找回与合并历史打卡记录
function recoverAndMigrateHistoricalPlans() {
  const merged = {};

  // A. 首先加载初始主备份底座（包含历史真实打卡）
  if (typeof INITIAL_HISTORICAL_DATA !== 'undefined' && INITIAL_HISTORICAL_DATA.plans) {
    Object.assign(merged, JSON.parse(JSON.stringify(INITIAL_HISTORICAL_DATA.plans)));
  }

  // B. 扫描旧版各个版本的 LocalStorage key
  const legacyKeys = ['sc_study_plans', 'sc_study_plans_v1', 'sc_study_plans_v2', 'daily_plans'];
  legacyKeys.forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const legacyPlans = JSON.parse(raw);
        Object.entries(legacyPlans).forEach(([dateStr, dayData]) => {
          if (!merged[dateStr]) {
            merged[dateStr] = dayData;
          } else {
            // 增量合并策略：若旧版中有打卡完成或备注，优先保留用户真实打卡数据
            const oldHasDone = (dayData.tasks || []).some(t => t.is_done) || dayData.is_completed === 1 || (dayData.notes && dayData.notes.trim() !== '');
            if (oldHasDone) {
              merged[dateStr] = dayData;
            }
          }
        });
      } catch (e) {}
    }
  });

  // C. 兜底 69 天默认结构
  const start = new Date(2026, 7, 18);
  const end = new Date(2026, 9, 25);
  let cur = new Date(start);

  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;

    if (!merged[dStr]) {
      let stage = 'stage_1';
      let stageName = '第一阶段：公基筑基与理论强记';
      if (dStr >= '2026-09-10' && dStr < '2026-10-06') {
        stage = 'stage_2';
        stageName = '第二阶段：公文实战与真题演练';
      } else if (dStr >= '2026-10-06') {
        stage = 'stage_3';
        stageName = '第三阶段：全真模考与终极冲刺';
      }

      merged[dStr] = {
        date: dStr,
        stage: stage,
        stage_name: stageName,
        tasks: getDefaultTasksForDate(dStr),
        notes: '',
        is_completed: 0
      };
    }
    cur.setDate(cur.getDate() + 1);
  }

  return merged;
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
  localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(plans));
  triggerAutoSync(); // 自动无感静默同步！
}

function getLocalMistakes() {
  let masterRaw = localStorage.getItem(STORAGE_KEYS.MISTAKES_MASTER);
  let masterMistakes = null;
  if (masterRaw) {
    try { masterMistakes = JSON.parse(masterRaw); } catch (e) {}
  }

  if (!masterMistakes || masterMistakes.length === 0) {
    masterMistakes = recoverAndMigrateHistoricalMistakes();
    localStorage.setItem(STORAGE_KEYS.MISTAKES_MASTER, JSON.stringify(masterMistakes));
  }

  return masterMistakes;
}

// 智能找回与合并历史错题记录
function recoverAndMigrateHistoricalMistakes() {
  const map = new Map();

  // A. 底座错题
  if (typeof INITIAL_HISTORICAL_DATA !== 'undefined' && Array.isArray(INITIAL_HISTORICAL_DATA.mistakes)) {
    INITIAL_HISTORICAL_DATA.mistakes.forEach(m => {
      if (m && m.question) map.set(m.question.trim(), m);
    });
  }

  // B. 扫描旧版各个版本的错题 Key
  const legacyKeys = ['sc_study_mistakes_v3', 'sc_study_mistakes_v2', 'sc_study_mistakes', 'mistakes'];
  legacyKeys.forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(m => {
            if (m && m.question) {
              const qKey = m.question.trim();
              if (!map.has(qKey)) {
                map.set(qKey, m);
              } else {
                // 保留练过的最新次数
                const cur = map.get(qKey);
                if ((m.attempt_count || 0) > (cur.attempt_count || 0)) {
                  map.set(qKey, m);
                }
              }
            }
          });
        }
      } catch (e) {}
    }
  });

  const result = Array.from(map.values());
  if (result.length === 0) {
    result.push({
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
    });
  }

  return result;
}

function saveLocalMistakes(mistakes) {
  localStorage.setItem(STORAGE_KEYS.MISTAKES_MASTER, JSON.stringify(mistakes));
  triggerAutoSync(); // 自动无感静默同步！
}

/* ==========================================================================
   全自动实时无感跨端双向同步引擎 (Auto-Sync on Change)
   ========================================================================== */

let autoSyncTimer = null;
function triggerAutoSync() {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    await performAutoSyncPush();
  }, 600);
}

// 自动静默推送到云端/服务器
async function performAutoSyncPush() {
  const plans = getLocalPlans();
  const mistakes = getLocalMistakes();
  const payload = { plans, mistakes };

  // 1. 本地直连或活跃隧道模式
  const targetEndpoint = appState.activeTunnelUrl 
    ? appState.activeTunnelUrl.replace('/api/generate', '/api/sync/push')
    : '/api/sync/push';

  try {
    const res = await fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showAutoSyncIndicator('☁️ 已自动实时同步');
      return;
    }
  } catch (e) {}

  // 2. 免费轻量公共云中继保障 (确保手机端在外网且Mac关机时也能自动保存同步)
  try {
    const cloudSyncId = 'sichuan_study_2027_sync_master';
    await fetch(`https://kvdb.io/4y9pA78eW7w8Y6a4wYQp5r/${cloudSyncId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showAutoSyncIndicator('☁️ 云端已实时同步');
  } catch (e) {}
}

// 自动在后台静默拉取远端最新数据
async function autoPullRemoteSync() {
  const pullEndpoint = appState.activeTunnelUrl 
    ? appState.activeTunnelUrl.replace('/api/generate', '/api/sync/pull')
    : '/api/sync/pull';

  let remoteData = null;
  try {
    const res = await fetch(pullEndpoint);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.plans || data.mistakes)) remoteData = data;
    }
  } catch (e) {}

  if (!remoteData) {
    try {
      const cloudSyncId = 'sichuan_study_2027_sync_master';
      const res = await fetch(`https://kvdb.io/4y9pA78eW7w8Y6a4wYQp5r/${cloudSyncId}?t=` + Date.now());
      if (res.ok) {
        remoteData = await res.json();
      }
    } catch (e) {}
  }

  if (remoteData) {
    mergeRemoteDataSafely(remoteData);
  }
}

// 增量安全合并远端数据，绝不破坏本地修改
function mergeRemoteDataSafely(remoteData) {
  let hasUpdate = false;

  // 1. 合并日历打卡
  if (remoteData.plans && typeof remoteData.plans === 'object') {
    const localPlans = getLocalPlans();
    Object.entries(remoteData.plans).forEach(([dateStr, rPlan]) => {
      const lPlan = localPlans[dateStr];
      if (!lPlan) {
        localPlans[dateStr] = rPlan;
        hasUpdate = true;
      } else {
        const rDone = (rPlan.tasks || []).some(t => t.is_done) || rPlan.is_completed === 1;
        const lDone = (lPlan.tasks || []).some(t => t.is_done) || lPlan.is_completed === 1;
        if (rDone && !lDone) {
          localPlans[dateStr] = rPlan;
          hasUpdate = true;
        }
      }
    });
    if (hasUpdate) {
      localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(localPlans));
    }
  }

  // 2. 合并错题
  if (remoteData.mistakes && Array.isArray(remoteData.mistakes)) {
    const localMistakes = getLocalMistakes();
    const map = new Map();
    localMistakes.forEach(m => {
      if (m && m.question) map.set(m.question.trim(), m);
    });

    let mistakeUpdated = false;
    remoteData.mistakes.forEach(rm => {
      if (rm && rm.question) {
        const qKey = rm.question.trim();
        if (!map.has(qKey)) {
          map.set(qKey, rm);
          mistakeUpdated = true;
        } else {
          const lm = map.get(qKey);
          if ((rm.attempt_count || 0) > (lm.attempt_count || 0)) {
            map.set(qKey, rm);
            mistakeUpdated = true;
          }
        }
      }
    });

    if (mistakeUpdated) {
      const mergedList = Array.from(map.values());
      localStorage.setItem(STORAGE_KEYS.MISTAKES_MASTER, JSON.stringify(mergedList));
      appState.mistakes = mergedList;
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    calculateAndRenderDashboard();
    renderCalendar();
    renderMistakes();
    updateMistakeCounters();
    showAutoSyncIndicator('☁️ 已自动同步最新');
  }
}

// 顶部提示徽章
function showAutoSyncIndicator(text) {
  const syncBtn = document.querySelector('.btn-sync-nav');
  if (syncBtn) {
    const orig = syncBtn.textContent;
    syncBtn.textContent = text;
    syncBtn.style.color = 'var(--accent-green)';
    syncBtn.style.borderColor = 'var(--accent-green)';
    setTimeout(() => {
      syncBtn.textContent = '💾 备份/同步';
      syncBtn.style.color = '';
      syncBtn.style.borderColor = '';
    }, 2500);
  }
}

function getAiSettings() {
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
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
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
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
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
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
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.getElementById('theme-icon').textContent = '☀️';
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
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

  // 若处于本地后端环境，尝试全量同步 SQLite 数据库记录
  try {
    const res = await fetch('/api/calendar');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.calendar)) {
        const merged = getLocalPlans();
        data.calendar.forEach(serverDay => {
          if (serverDay.date) {
            const hasDone = (serverDay.tasks || []).some(t => t.is_done) || serverDay.is_completed === 1;
            if (hasDone || !merged[serverDay.date]) {
              merged[serverDay.date] = serverDay;
            }
          }
        });
        localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(merged));
        appState.calendarData = Object.values(merged);
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

  const elNav = document.getElementById('nav-days-left');
  if (elNav) elNav.textContent = diffDays;
  const elMob = document.getElementById('mobile-days-left');
  if (elMob) elMob.textContent = diffDays;
  const elStat = document.getElementById('stat-days-left');
  if (elStat) elStat.textContent = diffDays;
  const elComp = document.getElementById('stat-comp-days');
  if (elComp) elComp.textContent = completedDays;
  const compRate = planList.length > 0 ? (completedDays / planList.length * 100).toFixed(1) : '0.0';
  const elRate = document.getElementById('stat-comp-rate');
  if (elRate) elRate.textContent = compRate;
  const elHours = document.getElementById('stat-hours');
  if (elHours) elHours.textContent = totalHours.toFixed(1);

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
  const heroBadge = document.getElementById('hero-stage-badge');

  if (b1) b1.classList.remove('active');
  if (b2) b2.classList.remove('active');
  if (b3) b3.classList.remove('active');

  if (dateStr < '2026-09-10') {
    if (b1) b1.classList.add('active');
    if (badge) badge.textContent = '当前处于：第一阶段·夯基强化';
    if (heroBadge) heroBadge.textContent = '🔥 阶段一：夯基强化 (8.18-9.10)';
  } else if (dateStr < '2026-10-06') {
    if (b2) b2.classList.add('active');
    if (badge) badge.textContent = '当前处于：第二阶段·公文与真题';
    if (heroBadge) heroBadge.textContent = '📝 阶段二：公文与真题 (9.11-10.5)';
  } else {
    if (b3) b3.classList.add('active');
    if (badge) badge.textContent = '当前处于：第三阶段·冲刺模考';
    if (heroBadge) heroBadge.textContent = '🚀 阶段三：全真模考冲刺 (10.6-10.24)';
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

/* ==========================================================================
   2. 数据备份、导出/导入与跨端同步工具
   ========================================================================== */

function openBackupSyncModal() {
  document.getElementById('modal-backup-sync').classList.remove('hidden');
}

function closeBackupSyncModal() {
  document.getElementById('modal-backup-sync').classList.add('hidden');
}

// 导出全量 JSON 备份
function exportStudyDataJSON() {
  const plans = getLocalPlans();
  const mistakes = getLocalMistakes();
  const settings = getAiSettings();

  const exportObj = {
    app: "2027_sichuan_study_system",
    export_at: new Date().toISOString(),
    plans: plans,
    mistakes: mistakes,
    settings: settings
  };

  const str = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([str], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `sichuan_study_backup_${appState.currentDateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 导入 JSON 备份文件
function importStudyDataJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.plans) {
        localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(data.plans));
      }
      if (data.mistakes) {
        localStorage.setItem(STORAGE_KEYS.MISTAKES_MASTER, JSON.stringify(data.mistakes));
      }
      if (data.settings) {
        saveAiSettingsData(data.settings);
      }
      alert('🎉 备份数据导入成功！页面将自动刷新并展示最新进度。');
      window.location.reload();
    } catch (err) {
      alert('❌ 导入失败，文件格式有误：' + err.message);
    }
  };
  reader.readAsText(file);
}

// 生成手机扫码一秒同步二维码
function generateQrSyncCode() {
  const container = document.getElementById('qr-sync-container');
  const canvas = document.getElementById('qr-sync-canvas');
  if (!container) return;

  const plans = getLocalPlans();
  const mistakes = getLocalMistakes();
  const payload = { plans, mistakes };

  try {
    const jsonStr = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(jsonStr));
    
    // 如果当前是在本地运行，二维码链接指向线上域名以便手机微信直接打开同步
    const baseUrl = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
      ? 'https://www.bettercall12.cc/sichuan-study/'
      : window.location.origin + window.location.pathname;

    const syncUrl = `${baseUrl}?sync=${encodeURIComponent(b64)}`;

    if (typeof QRCode !== 'undefined' && QRCode.toCanvas && canvas) {
      QRCode.toCanvas(canvas, syncUrl, {
        width: 180,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      }, (err) => {
        if (err) {
          container.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(syncUrl)}" alt="同步二维码" style="max-width:180px; margin:0 auto; display:block; border-radius:4px;" />
            <div style="font-size:0.75rem; color:var(--primary); margin-top:6px; font-weight:600;">请使用手机微信 / 相机扫码即可完成全量同步</div>
          `;
        }
        container.style.display = 'block';
      });
    } else {
      container.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(syncUrl)}" alt="同步二维码" style="max-width:180px; margin:0 auto; display:block; border-radius:4px;" />
        <div style="font-size:0.75rem; color:var(--primary); margin-top:6px; font-weight:600;">请使用手机微信 / 相机扫码即可完成全量同步</div>
      `;
      container.style.display = 'block';
    }
  } catch (e) {
    alert('生成同步二维码失败：' + e.message);
  }
}

// 复制跨端同步码
function copySyncCode() {
  const plans = getLocalPlans();
  const mistakes = getLocalMistakes();
  const payload = {
    plans: plans,
    mistakes: mistakes
  };
  try {
    const jsonStr = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(jsonStr));
    navigator.clipboard.writeText(b64).then(() => {
      alert('📋 同步码已成功复制到剪贴板！\n可直接粘贴发送到手机端进行数据同步。');
    }).catch(() => {
      document.getElementById('sync-code-input').value = b64;
      alert('请手动复制文本框内的同步码：');
    });
  } catch (e) {
    alert('生成同步码失败：' + e.message);
  }
}

// 应用跨端同步码
function applySyncCode() {
  const code = document.getElementById('sync-code-input').value.trim();
  if (!code) {
    alert('请先粘贴同步码！');
    return;
  }
  try {
    const jsonStr = decodeURIComponent(atob(code));
    const data = JSON.parse(jsonStr);
    if (data.plans) {
      localStorage.setItem(STORAGE_KEYS.PLANS_MASTER, JSON.stringify(data.plans));
    }
    if (data.mistakes) {
      localStorage.setItem(STORAGE_KEYS.MISTAKES_MASTER, JSON.stringify(data.mistakes));
    }
    alert('🎉 跨端数据同步成功！页面将自动刷新。');
    window.location.reload();
  } catch (e) {
    alert('❌ 同步码解析失败，请确保复制完整！');
  }
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

// ==========================================================================
// 4. 智能助考对话 (支持本地千问实时算力 / 安全隧道 / 云端LLM / 本地高精知识库)
// ==========================================================================

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
  botMsg.innerHTML = `<div class="msg-bubble">🤖 助教正在深度思考与检索中...</div>`;
  box.appendChild(botMsg);
  box.scrollTop = box.scrollHeight;

  const settings = getAiSettings();
  let aiAnswer = null;

  // 1. 优先尝试本地后端 /api/chat
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.content) {
        aiAnswer = {
          title: data.title || "助教解答",
          content: data.content,
          engine_source: data.engine_source || "ollama_qwen",
          engine_label: data.engine_label || "🟢 本地千问 2.5-3B 大模型 (Ollama 实时推理)"
        };
      }
    }
  } catch (e) {}

  // 2. 若处于在线静态端（无后端），尝试前端直连 Ollama 安全隧道或本地端口
  if (!aiAnswer && (appState.activeTunnelUrl || (settings.engine_type === 'ollama' && settings.ollama_url))) {
    const targetUrl = appState.activeTunnelUrl || settings.ollama_url || 'http://localhost:11434/api/generate';
    try {
      const prompt = `你是一名资深的四川省紧缺专业选调生备考指导名师（精通金标尺、吴飞法律、于玉时政、白杨公文以及四川定向选调100分机考考情，针对中山大学测绘工程专硕考生）。
请针对考生的问题给出条理清晰、专业有力的解答与备考指导。

考生问题：${text}`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollama_model || 'qwen2.5:3b',
          prompt: prompt,
          stream: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          aiAnswer = {
            title: "通义千问 2.5-3B 实时推理指导",
            content: data.response.trim(),
            engine_source: "ollama_qwen",
            engine_label: `🟢 本地千问 2.5-3B (Mac实时算力)`
          };
        }
      }
    } catch (e) {}
  }

  // 3. 若配置了云端大模型 API (DeepSeek/Qwen)
  if (!aiAnswer && settings.engine_type === 'openai' && settings.api_key) {
    try {
      const res = await fetch(settings.api_url || 'https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.api_key}`
        },
        body: JSON.stringify({
          model: settings.api_model || 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是专业的四川定向选调备考指导名师。请回答条理清晰、紧扣四川选调考情。' },
            { role: 'user', content: text }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices[0].message.content.trim();
        aiAnswer = {
          title: `云端大模型 (${settings.api_model || 'DeepSeek'}) 深度解答`,
          content: content,
          engine_source: "cloud_api",
          engine_label: `☁️ 云端大模型 (${settings.api_model || 'DeepSeek'})`
        };
      }
    } catch (e) {}
  }

  // 4. 兜底：本地精准考情知识库结构化检索匹配
  if (!aiAnswer) {
    aiAnswer = searchLocalKnowledgeBase(text);
  }

  const isLlm = aiAnswer.engine_source === 'ollama_qwen' || aiAnswer.engine_source === 'cloud_api';
  const sourceBadgeHtml = `<div class="msg-source-tag ${isLlm ? 'source-llm' : 'source-kb'}">${aiAnswer.engine_label}</div>`;

  botMsg.innerHTML = `
    <div class="msg-bubble">
      ${sourceBadgeHtml}
      <h4 style="color:var(--primary); margin-bottom:6px;">${aiAnswer.title}</h4>
      <div style="white-space: pre-wrap; line-height:1.6;">${aiAnswer.content}</div>
    </div>
  `;
  box.scrollTop = box.scrollHeight;
}

// 本地知识库高精匹配
function searchLocalKnowledgeBase(query) {
  const q = query.trim().toLowerCase();

  if (q.includes("弹性") || (q.includes("需求") && q.includes("价格"))) {
    return {
      title: "微观经济学 · 需求价格弹性与总收益原理",
      content: `【核心原理分析】：\n1. 当需求价格弹性 Ed < 1（缺乏弹性，如粮食、生活必需品、自来水等）时：\n   价格变动的百分比 > 需求量变动的百分比。\n2. 总收益 TR = P (价格) × Q (销量)。\n3. 此时提价，虽然销量略微减少，但价格上升的幅度显著大于销量下降的幅度，因此总收益反而【增加】。\n\n💡 备考速记口诀：\n- 缺乏弹性（Ed < 1）➔ “薄利少销，提价增收”（如谷贱伤农原理）；\n- 富有弹性（Ed > 1）➔ “薄利多销，降价增收”。`,
      engine_source: "knowledge_base",
      engine_label: "🔵 本地精准考情知识库 (马克经济学讲义)"
    };
  }

  if (q.includes("志愿") || q.includes("流转") || q.includes("绵阳") || q.includes("保底") || q.includes("成都")) {
    return {
      title: "四川省紧缺专业选调生 · 志愿流转红利深度解读",
      content: `【志愿填报核心法则】：\n1. 第一志愿必须在【省直机关】或【成都市直】二选一（竞争激烈，严格按 1:3 差额进面）；\n2. 若第一志愿遗憾未进面，第二、三志愿（如绵阳市、德阳市等）将【自动升级为第一志愿】；\n3. 政策最大红利：只要笔试成绩达到全省合格分数线（往年约50-55分），非成都地市【全员进面，不设1:3差额限制】！\n\n🎯 推荐策略：第一志愿大胆冲成都/省直，第二志愿绵阳稳稳保底！`,
      engine_source: "knowledge_base",
      engine_label: "🔵 本地精准考情知识库 (四川官方大纲与政策百科)"
    };
  }

  if (q.includes("请示") && q.includes("报告")) {
    return {
      title: "公文写作专项 · ‘请示’与‘报告’核心区别",
      content: `【五大核心区别与易考陷阱】：\n1. 行文目的：请示为‘求批复/求指示’；报告为‘知照/汇报工作/反映情况’；\n2. 行文时效：请示必须【事前行文】；报告可事前、事中或事后；\n3. 主送机关：请示【原则上主送一个上级机关】（切忌多头请示），不得抄送下级机关；报告可主送多个上级机关；\n4. 内容要求：请示必须【一文一事，不得夹带报告事项】；报告可综合一文多事，【严禁夹带请示事项】；\n5. 结束语：请示用“妥否，请批示”；报告用“特此报告”。`,
      engine_source: "knowledge_base",
      engine_label: "🔵 本地精准考情知识库 (金标尺白杨公文)"
    };
  }

  if (q.includes("测绘") || q.includes("专业") || q.includes("岗位")) {
    return {
      title: "中山大学 085704 测绘工程专硕 · 四川选调报考岗位推荐",
      content: `【对口优势部门推荐】：\n1. 四川省自然资源厅 / 成都市规划和自然资源局（国土空间规划、耕地红线卫星遥感监测、不动产测绘）；\n2. 四川省应急管理厅 / 成都市应急管理局（防灾减灾、地质灾害应急遥感遥测、主汛期灾情评估）；\n3. 生态环境厅 / 气象局（生态遥感监测、环境红线核查）；\n4. 各区（市）县委办、政府办（紧缺专业全覆盖选拔）。`,
      engine_source: "knowledge_base",
      engine_label: "🔵 本地精准考情知识库 (中山大学专硕考情库)"
    };
  }

  return {
    title: "四川选调考点备考建议",
    content: `针对您的问题“${query}”：\n四川紧缺选调机考总分100分（48分单选 + 12分多选 + 10分判断 + 30分实务公文）。建议重点抓牢习思想帽子词、行政法高频法条与公文手写规范。坚持每日三段打卡复习，必能成功上岸！`,
    engine_source: "knowledge_base",
    engine_label: "🔵 本地精准考情知识库 (通用备考指南)"
  };
}

function sendPrompt(text) {
  document.getElementById('chat-input-text').value = text;
  submitChat();
}

function handleChatKey(e) {
  if (e.key === 'Enter') submitChat();
}

// ==========================================================================
// 5. 考点专项随机抽测 & AI 实时考点出题
// ==========================================================================

const FULL_QUIZ_BANK = [
  {
    id: 1,
    category: "习近平新时代中国特色社会主义思想",
    type: "single",
    question: "习近平新时代中国特色社会主义思想的世界观和方法论集中体现为“六个必须坚持”。下列哪一项不属于“六个必须坚持”？",
    options: ["A. 必须坚持人民至上", "B. 必须坚持自信自立", "C. 必须坚持深化改革", "D. 必须坚持系统观念"],
    answer: "C",
    explanation: "‘六个必须坚持’是：必须坚持人民至上、必须坚持自信自立、必须坚持守正创新、必须坚持问题导向、必须坚持系统观念、必须坚持胸怀天下。C选项‘必须坚持深化改革’不属于六个必须坚持。"
  },
  {
    id: 2,
    category: "法律常识 - 宪法",
    type: "single",
    question: "根据我国《宪法》规定，关于宪法修改的提议与表决程序，下列说法正确的是：",
    options: [
      "A. 由全国人大常委会或者三分之一以上的全国人大代表提议",
      "B. 由全国人大常委会或者五分之一以上的全国人大代表提议",
      "C. 由全国人民代表大会以到会代表的三分之二以上的多数通过",
      "D. 由全国人大常委会以全体组成人员的三分之二以上的多数通过"
    ],
    answer: "B",
    explanation: "《宪法》第64条规定：宪法的修改，由全国人民代表大会常务委员会或者五分之一以上的全国人民代表大会代表提议，并由全国人民代表大会以全体代表的三分之二以上的多数通过。"
  },
  {
    id: 3,
    category: "法律常识 - 行政法",
    type: "single",
    question: "根据《中华人民共和国行政处罚法》，下列哪一类行政处罚只能由法律设定？",
    options: ["A. 限制人身自由的行政处罚", "B. 责令停产停业", "C. 没收违法所得、没收非法财物", "D. 较大数额罚款"],
    answer: "A",
    explanation: "《行政处罚法》第十条明确规定：限制人身自由的行政处罚，只能由法律设定。行政法规可以设定除限制人身自由以外的行政处罚。"
  },
  {
    id: 4,
    category: "公文写作规范",
    type: "single",
    question: "在党政机关公文格式中，关于‘请示’的规则，下列说法错误的是：",
    options: [
      "A. 请示应当一文一事",
      "B. 请示原则上主送一个上级机关",
      "C. 请示根据需要可以同时抄送下级机关",
      "D. 请示不得夹带报告事项"
    ],
    answer: "C",
    explanation: "《党政机关公文处理工作条例》第15条明确规定：向上级机关行文，原则上主送一个上级机关，根据需要同时抄送相关上级机关和同级机关，不抄送下级机关。"
  },
  {
    id: 5,
    category: "非法律公基 - 经济常识",
    type: "single",
    question: "当经济出现严重通货膨胀、物价持续上涨时，政府和央行通常应采取的宏观调控政策组合是：",
    options: [
      "A. 扩张性财政政策 + 紧缩性货币政策",
      "B. 紧缩性财政政策 + 紧缩性货币政策",
      "C. 扩张性财政政策 + 扩张性货币政策",
      "D. 紧缩性财政政策 + 扩张性货币政策"
    ],
    answer: "B",
    explanation: "通货膨胀即总需求过旺、货币供给过多，应采取‘双紧’政策：紧缩性财政政策（减少政府支出、增加税收）和紧缩性货币政策（提高利率、提高存款准备金率），以平抑物价。"
  },
  {
    id: 6,
    category: "公文改错专项",
    type: "single",
    question: "下列关于党政机关公文发文字号的编写，格式完全正确的是：",
    options: [
      "A. 成府发〔2026〕第18号",
      "B. 成府发【2026】18号",
      "C. 成府发〔2026〕18号",
      "D. 成府发(2026)18号"
    ],
    answer: "C",
    explanation: "发文字号年份必须使用六角括号‘〔 〕’标注，发文顺序号不加‘第’字，不编虚位（即1不编为01）。"
  },
  {
    id: 7,
    category: "四川省情与政策",
    type: "single",
    question: "四川省紧缺专业选调生笔试科目为机考一科《综合能力测试》，满分100分，其中实务公文大题所占分值为：",
    options: ["A. 20分", "B. 30分", "C. 40分", "D. 50分"],
    answer: "B",
    explanation: "四川紧缺选调机考满分100分：单选48分(60题)、多选12分(10题)、判断10分(10题)、公文大题30分(1题)。"
  },
  {
    id: 8,
    category: "公基常识 - 公务员法",
    type: "single",
    question: "根据《中华人民共和国公务员法》，对公务员的处分分为警告、记过、记大过、降级、撤职、开除。其中‘记大过’的受处分期间为：",
    options: ["A. 6个月", "B. 12个月", "C. 18个月", "D. 24个月"],
    answer: "C",
    explanation: "《公务员法》第64条：受处分的期间为：警告（6个月）、记过（12个月）、记大过（18个月）、降级/撤职（24个月）。"
  }
];

function loadRandomQuiz() {
  const shuffled = [...FULL_QUIZ_BANK].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);
  renderQuiz(selected);
  const badge = document.getElementById('quiz-source-badge');
  if (badge) badge.textContent = '🔵 题库源：本地真题母题库 (已随机抽取5题)';
}

async function generateAiQuiz() {
  const container = document.getElementById('quiz-container');
  const badge = document.getElementById('quiz-source-badge');
  if (badge) badge.textContent = '🟢 题库源：本地千问 2.5-3B 现场智能出题中...';

  const loadingItem = document.createElement('div');
  loadingItem.className = 'quiz-item-card';
  loadingItem.innerHTML = `<div style="text-align:center; padding:16px; color:var(--primary); font-size:0.88rem;">✨ 正在调用千问 2.5-3B 模型现场生成 1 道高质量四川选调真题模拟，请稍候约 3~6 秒...</div>`;
  container.prepend(loadingItem);

  const categories = ["习近平新时代中国特色社会主义思想与时政", "法律常识(行政法/宪法)", "非法律公基(经济/党史)", "公文改错与实务"];
  const selectedCat = categories[Math.floor(Math.random() * categories.length)];

  const prompt = `你是一个专业的四川省选调生考试命题名师。请围绕【${selectedCat}】板块，现场出一道高质量的单项选择题。
必须返回合法的单一 JSON 对象，不要输出任何 Markdown 标记或多余文字：
{
  "category": "${selectedCat}",
  "question": "题干内容...",
  "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],
  "answer": "A",
  "explanation": "题目深度解析与考点总结..."
}`;

  const settings = getAiSettings();
  let generatedQuiz = null;

  // 1. 尝试直调本地/隧道 Ollama
  const targetUrl = appState.activeTunnelUrl || settings.ollama_url || 'http://localhost:11434/api/generate';
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollama_model || 'qwen2.5:3b',
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });
    if (res.ok) {
      const data = await res.json();
      const clean = (data.response || '').replace(/```json/g, '').replace(/```/g, '').trim();
      generatedQuiz = JSON.parse(clean);
    }
  } catch (e) {}

  // 2. 尝试云端 API
  if (!generatedQuiz && settings.engine_type === 'openai' && settings.api_key) {
    try {
      const res = await fetch(settings.api_url || 'https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.api_key}`
        },
        body: JSON.stringify({
          model: settings.api_model || 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const clean = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        generatedQuiz = JSON.parse(clean);
      }
    } catch (e) {}
  }

  container.removeChild(loadingItem);

  if (generatedQuiz && generatedQuiz.question && generatedQuiz.options) {
    generatedQuiz.id = Date.now();
    const card = createQuizCardDOM(generatedQuiz, 0, true);
    container.prepend(card);
    if (badge) badge.textContent = '🟢 题库源：千问 2.5-3B 现场即时生成试题';
    alert('✨ 成功为您现场命制 1 道全新考点模拟题！已置顶展示。');
  } else {
    loadRandomQuiz();
    alert('未能连通大模型，已为您从本地核心母题库中随机抽取 5 道精选题！');
  }
}

function renderQuiz(questions) {
  const container = document.getElementById('quiz-container');
  if (!container) return;
  container.innerHTML = '';

  questions.forEach((q, qIndex) => {
    const card = createQuizCardDOM(q, qIndex, false);
    container.appendChild(card);
  });
}

function createQuizCardDOM(q, qIndex, isAiGenerated) {
  const card = document.createElement('div');
  card.className = 'quiz-item-card';
  card.innerHTML = `
    <div class="quiz-header">
      <span class="quiz-cat">【${q.category}】</span>
      <span class="badge ${isAiGenerated ? 'badge-success' : 'badge-primary'}">${isAiGenerated ? '✨ AI 现场生成题' : `第 ${qIndex + 1} 题`}</span>
    </div>
    <div class="quiz-question">${escapeHtml(q.question)}</div>
    <div class="quiz-options">
      ${q.options.map(opt => `
        <button class="quiz-opt-btn" onclick="selectQuizOption(this, '${q.answer}', '${escapeHtml(q.explanation)}')">
          ${escapeHtml(opt)}
        </button>
      `).join('')}
    </div>
    <div class="quiz-explanation-box" style="display:none;"></div>
  `;
  return card;
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

// ==========================================================================
// 6. 公文 30分制智能评分诊断 (千问深度批改 + 15种法定公文要素引擎)
// ==========================================================================

async function submitGradeDoc() {
  const content = document.getElementById('doc-text-input').value.trim();
  if (!content) {
    alert('请先输入公文内容！');
    return;
  }
  const resultBox = document.getElementById('doc-grade-result');
  resultBox.innerHTML = '<div class="result-placeholder"><p>🚀 正在调用千问公文诊断模型全面评估评分中 (约 4~8 秒)...</p></div>';

  const settings = getAiSettings();
  let gradeResult = null;

  // 1. 尝试调用本地后端
  try {
    const res = await fetch('/api/document/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) gradeResult = data.result;
    }
  } catch (e) {}

  // 2. 尝试直调本地/隧道 Ollama 进行深度批改
  if (!gradeResult && (appState.activeTunnelUrl || (settings.engine_type === 'ollama' && settings.ollama_url))) {
    const targetUrl = appState.activeTunnelUrl || settings.ollama_url || 'http://localhost:11434/api/generate';
    try {
      const prompt = `你是一名资深的四川省选调生考试公文大题（30分制）阅卷名师。
请对考生的公文进行严格评审并返回严格合法的单一 JSON 对象（不要输出任何多余标记）：
{
  "score": 26.5,
  "level": "优秀公文 (A级)",
  "char_count": ${content.length},
  "highlights": ["标题准确完整", "发文字号六角括号标准", "结构条理清晰"],
  "deductions": ["缺少主送机关顶格标注(-2分)"],
  "polish_advice": "针对该公文的提分润色建议与金句点缀..."
}

【考生公文作答内容】:
${content}`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollama_model || 'qwen2.5:3b',
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const clean = (data.response || '').replace(/```json/g, '').replace(/```/g, '').trim();
        gradeResult = JSON.parse(clean);
      }
    } catch (e) {}
  }

  // 3. 兜底内置公文规范诊断引擎
  if (!gradeResult) {
    gradeResult = localGradeOfficialDocument(content);
  }

  renderDocGradeResultDOM(gradeResult);
}

function localGradeOfficialDocument(content) {
  let score = 30.0;
  const deductions = [];
  const highlights = [];
  const charCount = content.replace(/\s/g, "").length;

  if (!/(通知|请示|报告|方案|纪要|通报|意见|函)/.test(content.slice(0, 45))) {
    deductions.push("【标题】缺少明确的法定公文文种（如：通知、请示、报告等）(-3分)");
    score -= 3.0;
  } else {
    highlights.push("公文文种清晰准确 (+3分)");
  }

  if (/〔202\d〕|\[202\d\]|\(202\d\)|〔\d{4}〕/.test(content)) {
    highlights.push("包含规范发文字号六角括号要素 (+2分)");
  } else {
    deductions.push("【版头/发文字号】未包含规范的发文字号（如：成府发〔2026〕12号）(-2分)");
    score -= 2.0;
  }

  if (!/(各区|各市|各县|各部门|各单位|市级各部门)[：:]/.test(content)) {
    deductions.push("【主送机关】缺少顶格规范的主送机关标注 (-2分)");
    score -= 2.0;
  } else {
    highlights.push("主送机关顶格规范 (+2分)");
  }

  if (!/特此通知|妥否|请予批复|现将有关事项通知如下|现报告如下/.test(content)) {
    deductions.push("【结语】缺少规范的公文过渡句或结语词 (-1.5分)");
    score -= 1.5;
  }

  if (!/202\d年\d{1,2}月\d{1,2}日|\d{4}年\d{1,2}月\d{1,2}日/.test(content)) {
    deductions.push("【成文日期】缺少规范的阿拉伯数字全称成文日期 (-2分)");
    score -= 2.0;
  } else {
    highlights.push("成文日期格式标准 (+2分)");
  }

  if (charCount < 200) {
    deductions.push(`【字数不足】当前仅 ${charCount} 字，实战公文大题建议 400~600 字 (-4分)`);
    score -= 4.0;
  } else if (charCount >= 350) {
    highlights.push(`篇幅充实（已达 ${charCount} 字）(+3分)`);
  }

  score = Math.max(5.0, Math.min(30.0, score));
  const level = score >= 26 ? "优秀公文 (A级)" : (score >= 20 ? "良好规范 (B级)" : "待规范完善 (C级)");

  return {
    score: score.toFixed(1),
    level: level,
    char_count: charCount,
    highlights: highlights,
    deductions: deductions,
    polish_advice: "注意紧密结合四川省自然资源保护、防汛应急等实务，强化‘一、/（一）/1.’三级标题的对仗工整。"
  };
}

function renderDocGradeResultDOM(r) {
  const resultBox = document.getElementById('doc-grade-result');
  resultBox.innerHTML = `
    <div class="score-display-card">
      <div>
        <span style="font-size:0.8rem;">综合诊断得分</span>
        <div class="score-num">${r.score} <small style="font-size:0.9rem;">/ 30分</small></div>
        <span style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px;">${r.level}</span>
      </div>
      <div style="text-align:right; font-size:0.8rem;">
        <div>有效字数：${r.char_count} 字</div>
      </div>
    </div>
    <div class="result-section" style="margin-bottom:10px;">
      <h5 style="color:var(--accent-green); font-size:0.85rem; margin-bottom:4px;">✨ 亮点要素</h5>
      <ul style="padding-left:18px; font-size:0.82rem; color:var(--accent-green);">
        ${(r.highlights || []).map(h => `<li>${escapeHtml(h)}</li>`).join('')}
      </ul>
    </div>
    <div class="result-section" style="margin-bottom:10px;">
      <h5 style="color:var(--accent-red); font-size:0.85rem; margin-bottom:4px;">⚠️ 扣分项诊断</h5>
      <ul style="padding-left:18px; font-size:0.82rem; color:var(--accent-red);">
        ${(r.deductions && r.deductions.length) ? r.deductions.map(d => `<li>${escapeHtml(d)}</li>`).join('') : '<li>🎉 格式完全规范，无硬伤扣分！</li>'}
      </ul>
    </div>
    ${r.polish_advice ? `
    <div class="result-section" style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm); border-left:3px solid var(--primary); font-size:0.8rem;">
      <strong>💡 名师提分润色建议：</strong>
      <div>${escapeHtml(r.polish_advice)}</div>
    </div>` : ''}
  `;
}

/* ==========================================================================
   3. 错题集与艾宾浩斯抗遗忘连续掌握
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

  // 1. 如果配置了云端 API Key 且选择了 openai 模式，前端优先直接请求云端 LLM
  if (settings.engine_type === 'openai' && settings.api_key) {
    try {
      btn.textContent = '🚀 云端大模型正在深度解析中...';
      parsed = await callCloudLlmParseMistake(rawText, settings);
    } catch (e) {
      console.warn("云端 LLM 调用失败，回退规则引擎:", e);
    }
  }

  // 2. 如果是 ollama 模式（本地后端或公网穿透 HTTPS）
  if (!parsed && settings.engine_type === 'ollama') {
    btn.textContent = '🚀 本地千问 2.5-3B 正在深度推理中 (约 3~6秒)...';
    
    // 优先尝试本地后端中转
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

    // 如果处于在线纯静态页（无后端），尝试前端直连 Ollama (比如 Cloudflare Tunnel 穿透的 HTTPS URL)
    if (!parsed && settings.ollama_url) {
      try {
        parsed = await callDirectOllamaParseMistake(rawText, settings);
      } catch (e) {
        console.warn("前端直接调用 Ollama 地址失败:", e);
      }
    }
  }

  // 3. 兜底内置极速规则引擎
  if (!parsed) {
    parsed = localRuleBasedParseMistake(rawText);
  }

  // 4. 执行高精度板块双重校正引擎 (消除文史/经济/科技常识被误判为行测专项或时政)
  if (parsed) {
    parsed.category = refineParsedCategory(parsed.category, rawText);
  }

  btn.textContent = '🚀 AI 智能提取并结构化';
  btn.disabled = false;

  appState.parsedMistakeData = parsed;
  document.getElementById('parsed-cat-select').value = parsed.category || "非法律公基";
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

// 前端高精度板块双重校正算法
function refineParsedCategory(category, rawText) {
  const low = rawText.toLowerCase();

  // 1. 严格锁定：总书记重要论述、党纪学习教育、二十大/三中全会精神
  const xiModernKeys = [
    "习近平", "总书记", "二十大", "三中全会", "新质生产力", "中国式现代化",
    "六个必须坚持", "十个坚持", "首要任务", "两个确立", "两个维护", "四个意识", "四个自信",
    "党纪学习教育", "政治纪律", "组织纪律", "廉洁纪律", "群众纪律", "工作纪律", "生活纪律"
  ];
  if (xiModernKeys.some(k => low.includes(k))) {
    return "习近平新时代中国特色社会主义思想与时政";
  }

  // 2. 强力识别：中国近代史/古代历史/文学常识/经济学/科技/地理常识 ➔ 100% 归入【非法律公基】
  const historyEconomyScience = [
    "鸦片战争", "洋务运动", "戊戌变法", "辛亥革命", "五四运动", "旧民主主义", "新民主主义",
    "甲午中日战争", "八国联军", "太平天国", "义和团", "百团大战", "抗日战争", "解放战争", "长征",
    "唐代", "宋代", "明代", "清代", "春秋战国", "秦始皇", "汉武帝", "三国", "两晋南北朝",
    "史记", "资治通鉴", "诗经", "楚辞", "唐诗", "宋词", "古文运动", "诸子百家", "儒家", "道家", "法家",
    "需求价格弹性", "供求定理", "边际效用", "恩格尔系数", "基尼系数", "cpi", "gdp", "通货膨胀", "通货紧缩", "宏观调控", "货币政策", "财政政策",
    "光合作用", "牛顿", "电磁感应", "量子", "超导", "板块构造", "季风气候", "喀斯特地貌", "管理学", "组织行为"
  ];
  if (historyEconomyScience.some(k => low.includes(k))) {
    return "非法律公基";
  }

  // 3. 严格识别：法律常识
  const lawKeys = [
    "行政处罚", "行政许可", "行政强制", "行政复议", "行政诉讼", "国家赔偿",
    "宪法", "刑法", "民法", "民法典", "公务员法", "监察法", "拘留", "罚款", "没收违法所得", "侵权责任", "诉讼时效"
  ];
  if (lawKeys.some(k => low.includes(k))) {
    return "法律常识";
  }

  // 4. 严格识别：公文规则 (仅限公文格式条例本身)
  const docKeys = [
    "发文字号", "主送机关", "抄送机关", "成文日期", "公文文种", "行文规则",
    "上行文", "下行文", "平行文", "公文处理工作条例", "六角括号", "请示不得", "报告中不得"
  ];
  if (docKeys.some(k => low.includes(k))) {
    return "公文写作与改错";
  }

  // 5. 严格识别：行测专项 (仅限行测纯方法论题型)
  const xingceKeys = [
    "依次填入", "横线处", "划线部分", "意在说明", "主旨概括", "中心理解",
    "图形推理", "折叠", "定义判断", "类比推理", "得出结论", "削弱论证", "加强论证", "增长率", "同比", "环比", "排列组合"
  ];
  if (xingceKeys.some(k => low.includes(k))) {
    return "行测专项";
  }

  return category || "非法律公基";
}

function localRuleBasedParseMistake(raw) {
  const text = raw.trim();
  const category = refineParsedCategory("非法律公基", text);
  const prompt = `你是一个专业的中国公务员与四川紧缺专业选调生考试智能解析名师。请将以下错题原始文本精准拆解为标准 JSON 格式。

【考试板块精准分类指引 (category 必须严格属于以下5个之一，严禁误判)】:
1. 习近平新时代中国特色社会主义思想与时政：考查党的二十大/二十届三中全会精神、习近平总书记重要论述、中国式现代化、新质生产力、党纪学习教育、党建党史、重大时政会议新闻。
2. 法律常识：考查宪法、行政法(处罚/许可/强制/复议/诉讼/国家赔偿)、民法典、刑法、公务员法、监察法等法条规范。
3. 非法律公基：考查微观/宏观经济学(需求弹性/通胀/财政货币政策)、管理学、历史人文、地理省情、前沿科技常识。
4. 公文写作与改错：【仅且仅当考查公文格式要素规则本身】（如发文字号六角括号、主送机关规范、15种法定文种适用范围、请示与报告区别、成文日期数字、GB/T 9704-2012公文条例）。⚠️ 凡题干仅以某部门《通知/意见/通报》作为背景考查政治方针、法律程序或经济实质内容的，严禁归入公文！
5. 行测专项：考查言语理解(选词填空/中心主旨)、数量关系、资料分析、判断推理(图推/类比/定义)。

【必须返回严格合法的单一 JSON 对象，不要输出任何 Markdown 标记或多余文字】:
{
  "category": "所属板块名称(严格为上述5个之一)",
  "title": "简短考点标题(15字内)",
  "question_type": "single",
  "question": "题干纯文本(剥离选项和答案)",
  "options": ["A. 选项A内容", "B. 选项B内容", "C. 选项C内容", "D. 选项D内容"],
  "correct_answer": "正确选项(如 A 或 ABC)",
  "user_answer": "当时错选项(如 B，若无留空)",
  "correct_analysis": "核心考点解析与关键法条/理论口诀",
  "key_point": "考点关键词(如 行政处罚听证程序)"
}

【原始题目文本】:
${rawText}`;

  const res = await fetch(settings.api_url || 'https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`
    },
    body: JSON.stringify({
      model: settings.api_model || 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    })
  });

  if (!res.ok) throw new Error(`API HTTP Error: ${res.status}`);
  const data = await res.json();
  const rawContent = data.choices[0].message.content.trim();
  const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsedObj = JSON.parse(cleanJsonStr);
  parsedObj.engine_label = `☁️ 云端大模型 (${settings.api_model || 'DeepSeek'}) 实时解析`;
  return parsedObj;
}

// 前端直接调用本地/穿透的 Ollama 接口
async function callDirectOllamaParseMistake(rawText, settings) {
  const prompt = `你是一个专业的中国公务员与四川紧缺专业选调生考试智能解析名师。请将以下错题抽取为严格合法的 JSON 对象。

【考试板块精准分类指引 (category 必须严格属于以下5个之一，严禁误判)】:
1. 习近平新时代中国特色社会主义思想与时政：考查党的二十大/二十届三中全会精神、习近平总书记重要论述、中国式现代化、新质生产力、党纪学习教育、党建党史、重大时政会议新闻。
2. 法律常识：考查宪法、行政法(处罚/许可/强制/复议/诉讼/国家赔偿)、民法典、刑法、公务员法、监察法等法条规范。
3. 非法律公基：考查微观/宏观经济学(需求弹性/通胀/财政货币政策)、管理学、历史人文、地理省情、前沿科技常识。
4. 公文写作与改错：【仅且仅当考查公文格式要素规则本身】（如发文字号六角括号、主送机关规范、15种法定文种适用范围、请示与报告区别、成文日期数字、GB/T 9704-2012公文条例）。⚠️ 凡题干仅以某部门《通知/意见/通报》作为背景考查政治方针、法律程序或经济实质内容的，严禁归入公文！
5. 行测专项：考查言语理解(选词填空/中心主旨)、数量关系、资料分析、判断推理(图推/类比/定义)。

必须返回合法的单一 JSON 对象，不要输出任何多余标记:
{
  "category": "所属板块名称(严格为上述5个之一)",
  "title": "考点简短标题",
  "question_type": "single",
  "question": "题干纯文本(剥离选项与答案)",
  "options": ["A. 选项A内容", "B. 选项B内容", "C. 选项C内容", "D. 选项D内容"],
  "correct_answer": "正确选项(如 A)",
  "user_answer": "当时错选(如 B，若无留空)",
  "correct_analysis": "核心考点解析",
  "key_point": "考点关键词"
}
【题目文本】:
${rawText}`;

  const targetUrl = (settings.ollama_url || 'http://localhost:11434/api/generate').trim();
  const modelName = (settings.ollama_model || 'qwen2.5:3b').trim();

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      prompt: prompt,
      stream: false,
      format: 'json'
    })
  });

  if (!res.ok) throw new Error(`Ollama HTTP Error: ${res.status}`);
  const data = await res.json();
  const rawResponse = (data.response || '').trim();
  const cleanStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsedObj = JSON.parse(cleanStr);
  parsedObj.engine_label = `🟢 本地千问大模型 (${modelName}) 穿透实时推理`;
  return parsedObj;
}

function localRuleBasedParseMistake(raw) {
  const text = raw.trim();
  const low = text.toLowerCase();
  let category = "非法律公基";

  // 1. 优先判定：习近平新时代中国特色社会主义思想与时政
  if (["习思想", "习近平", "总书记", "二十大", "三中全会", "新时代", "六个必须坚持", "新质生产力", "中国式现代化", "党纪学习教育", "全党", "党章", "党史", "立德树人", "首要任务", "两个确立", "两个维护", "四个自信"].some(k => low.includes(k))) {
    category = "习近平新时代中国特色社会主义思想与时政";
  }
  // 2. 判定：法律常识 (行政法/宪法/刑法/民法/诉讼/公务员法)
  else if (["行政处罚", "行政许可", "行政强制", "行政复议", "行政诉讼", "国家赔偿", "宪法", "刑法", "民法", "民法典", "法条", "法律", "拘留", "罚款", "没收", "羁押", "公务员法", "处分", "监察", "人民法院", "检察院", "侵权", "物权", "合同法", "诉讼时效"].some(k => low.includes(k))) {
    category = "法律常识";
  }
  // 3. 严格判定：公文写作与改错 (仅限考查公文格式要素规则本身)
  else if (["发文字号", "主送机关", "抄送机关", "成文日期", "公文文种", "行文规则", "上行文", "下行文", "平行文", "公文处理工作条例", "六角括号", "请示不得", "报告中不得", "公文格式", "党政机关公文"].some(k => low.includes(k))) {
    category = "公文写作与改错";
  }
  // 4. 判定：行测专项
  else if (["依次填入", "横线处", "划线部分", "段落大意", "作者意图", "增长率", "同比", "环比", "资料分析", "图形推理", "定义判断", "类比推理", "得出结论", "言语理解"].some(k => low.includes(k))) {
    category = "行测专项";
  }
  // 5. 兜底：非法律公基 (经济/历史/管理/科技/地理)
  else {
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

function applyProviderPreset(preset) {
  const urlInput = document.getElementById('setting-api-url');
  const modelInput = document.getElementById('setting-api-model');
  
  if (preset === 'deepseek') {
    urlInput.value = 'https://api.deepseek.com/v1/chat/completions';
    modelInput.value = 'deepseek-chat';
  } else if (preset === 'qwen') {
    urlInput.value = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    modelInput.value = 'qwen-plus';
  } else if (preset === 'siliconflow') {
    urlInput.value = 'https://api.siliconflow.cn/v1/chat/completions';
    modelInput.value = 'Qwen/Qwen2.5-7B-Instruct';
  } else if (preset === 'kimi') {
    urlInput.value = 'https://api.moonshot.cn/v1/chat/completions';
    modelInput.value = 'moonshot-v1-8k';
  } else if (preset === 'openai') {
    urlInput.value = 'https://api.openai.com/v1/chat/completions';
    modelInput.value = 'gpt-4o-mini';
  }
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
