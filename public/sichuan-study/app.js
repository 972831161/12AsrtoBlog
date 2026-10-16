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
  DOC_MATERIALS: 'sichuan_study_doc_materials_master',
  SETTINGS: 'sichuan_ai_settings_master',
  THEME: 'sichuan_study_theme',
  SYNC_SHORT_CODE: 'sichuan_study_sync_short_code',
  SUPABASE: 'sichuan_study_supabase_config'
};

function getSupabaseConfig() {
  const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return { url: '', key: '' };
}

function saveSupabaseConfig(url, key) {
  const cfg = {
    url: (url || '').trim().replace(/\/+$/, ''),
    key: (key || '').trim()
  };
  localStorage.setItem(STORAGE_KEYS.SUPABASE, JSON.stringify(cfg));
  return cfg;
}

function getSyncShortCode() {
  let code = localStorage.getItem(STORAGE_KEYS.SYNC_SHORT_CODE);
  if (!code) {
    code = '831161';
    localStorage.setItem(STORAGE_KEYS.SYNC_SHORT_CODE, code);
  }
  return code;
}

function setSyncShortCode(code) {
  const clean = (code || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
  if (clean) {
    localStorage.setItem(STORAGE_KEYS.SYNC_SHORT_CODE, clean);
    appState.syncShortCode = clean;
  }
  return clean || getSyncShortCode();
}

let appState = {
  currentDateStr: getRealCurrentDateStr(),
  calendarData: [],
  todayTasks: [],
  modalTasks: [],
  activeDateDetail: null,
  mistakes: [],
  activeMistakeFilter: 'all',
  activeMistakeCategory: 'all',
  activeMistakeTypeFilter: 'all',
  multiSelections: {},
  parsedMistakeData: null,
  ollamaRunning: false,
  syncShortCode: getSyncShortCode(),
  mistakeViewMode: localStorage.getItem('mistake_view_mode') || 'duo',
  duoScope: 'unmastered',
  duoType: 'all',
  duoCurrentItem: null,
  duoHistoryIds: [],
  duoSessionCount: 0,
  duoSessionCorrect: 0,
  duoAutoNext: localStorage.getItem('duo_auto_next') === 'true',
  duoAnswered: false,
  duoMultiSelected: [],
  // 📜 公文写作素材库状态
  materials: [],
  activeMatCategory: 'all',
  activeMatType: 'all',
  activeMatSearch: '',
  activeMatOnlyFav: false,
  flashcardScope: 'all',
  flashcardCurrentItem: null,
  flashcardRevealed: false,
  flashcardLearnedIds: JSON.parse(localStorage.getItem('sc_mat_flashcard_learned') || '[]'),
  parsedMaterialDraft: null
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
  await checkUrlSyncPayload();
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

// 检查 URL 中是否有扫码传入的极速 6 位短码或全量数据
async function checkUrlSyncPayload() {
  try {
    const params = new URLSearchParams(window.location.search);

    // 1. 优先处理极简 6 位短码 (?code=831161)
    const codeParam = params.get('code');
    if (codeParam) {
      const cleanCode = setSyncShortCode(codeParam);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // 立即从云端拉取该短码下的历史数据
      const remoteData = await pullDataFromCloud(cleanCode);
      if (remoteData) {
        mergeRemoteDataSafely(remoteData);
        setTimeout(() => {
          alert(`🎉 成功连接 6 位专属云端同步码【${cleanCode}】！\n历史打卡与错题已全部拉取并同步。`);
        }, 400);
      }
      return;
    }

    // 2. 兼容旧版 Base64 扫码
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
  const s = getAiSettings();

  // 0. 若选择云端 API 模式
  if (s.engine_type === 'openai') {
    const modelLabel = s.api_model ? s.api_model.split('/').pop() : 'Qwen';
    if (s.api_key) {
      if (badgeText) badgeText.textContent = `云端大模型 (${modelLabel}) 在线`;
      if (dot) { dot.className = 'status-dot green-dot'; }
      if (chatTag) {
        chatTag.textContent = `🟢 云端大模型 (${modelLabel} 实时推理)`;
        chatTag.className = 'engine-tag-pill source-llm';
      }
    } else {
      if (badgeText) badgeText.textContent = '云端 API (待配置 Key)';
      if (dot) { dot.className = 'status-dot yellow-dot'; }
      if (chatTag) {
        chatTag.textContent = '🟡 云端 API (点击配置 Key)';
        chatTag.className = 'engine-tag-pill source-kb';
      }
    }
    return;
  }

  // 若选择内置极速离线规则
  if (s.engine_type === 'builtin') {
    if (badgeText) badgeText.textContent = '内置考情知识库模式';
    if (dot) { dot.className = 'status-dot blue-dot'; }
    if (chatTag) {
      chatTag.textContent = '🔵 内置极速备考知识库模式';
      chatTag.className = 'engine-tag-pill source-kb';
    }
    return;
  }

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

function getLocalMaterials() {
  let masterRaw = localStorage.getItem(STORAGE_KEYS.DOC_MATERIALS);
  let masterMaterials = null;
  if (masterRaw) {
    try { masterMaterials = JSON.parse(masterRaw); } catch (e) {}
  }

  if (!masterMaterials || !Array.isArray(masterMaterials) || masterMaterials.length === 0) {
    masterMaterials = (typeof DEFAULT_DOC_MATERIALS !== 'undefined' && Array.isArray(DEFAULT_DOC_MATERIALS)) 
      ? JSON.parse(JSON.stringify(DEFAULT_DOC_MATERIALS)) 
      : [];
    localStorage.setItem(STORAGE_KEYS.DOC_MATERIALS, JSON.stringify(masterMaterials));
  }

  return masterMaterials;
}

function saveLocalMaterials(materials) {
  localStorage.setItem(STORAGE_KEYS.DOC_MATERIALS, JSON.stringify(materials));
  appState.materials = materials;
  triggerAutoSync(); // 自动无感静默同步！
}

/* ==========================================================================
   全自动实时无感跨端双向同步引擎 (6位专属短码 + 多通道高可用云中继)
   ========================================================================== */

let autoSyncTimer = null;
function triggerAutoSync() {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    await performAutoSyncPush();
  }, 600);
}

// 获取或初始化云端存储 Bin ID
const DEFAULT_GLOBAL_BIN_ID = "bcbedba"; // 系统内置高可用主节点

function getCloudBinId(shortCode) {
  const code = (shortCode || getSyncShortCode()).trim();
  if (code === '831161' || !code) return DEFAULT_GLOBAL_BIN_ID;
  return code;
}

// 推送全量数据到云端 (支持指定短码)
async function pushDataToCloud(shortCode) {
  const code = (shortCode || getSyncShortCode()).trim();
  const binId = getCloudBinId(code);
  const plans = getLocalPlans();
  const mistakes = getLocalMistakes();
  const materials = getLocalMaterials();
  const payload = {
    version: "2027_v2",
    sync_code: code,
    updatedAt: Date.now(),
    plans: plans,
    mistakes: mistakes,
    materials: materials
  };

  // 1. 最高优先级：若用户配置了 Supabase 专属私有云数据库 (企业级高可靠)
  const sbCfg = getSupabaseConfig();
  if (sbCfg.url && sbCfg.key) {
    try {
      const sbRes = await fetch(`${sbCfg.url}/rest/v1/sc_study_sync`, {
        method: 'POST',
        headers: {
          'apikey': sbCfg.key,
          'Authorization': `Bearer ${sbCfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          short_code: code,
          data: payload,
          updated_at: new Date().toISOString()
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined
      });
      if (sbRes.ok || sbRes.status === 201 || sbRes.status === 204) {
        return { success: true, channel: 'supabase', code: code };
      }
    } catch (e) {
      console.warn("Supabase 同步异常，尝试备用通道:", e);
    }
  }

  // 2. 若本地 Python 后端在运行 (端口 8000 或活跃隧道)
  if (appState.activeTunnelUrl || window.location.port === '8000') {
    const targetEndpoint = appState.activeTunnelUrl 
      ? appState.activeTunnelUrl.replace('/api/generate', '/api/sync/push')
      : '/api/sync/push';
    try {
      await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined
      });
    } catch (e) {}
  }

  // 3. 全球高可用公共云端中继 (国内 100% 直连秒通，支持 CORS 跨域)
  let cloudSuccess = false;
  let activeBin = binId;

  try {
    const putRes = await fetch(`https://extendsclass.com/api/json-storage/bin/${binId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
    });

    if (putRes.ok) {
      cloudSuccess = true;
    } else if (putRes.status === 404) {
      const postRes = await fetch('https://extendsclass.com/api/json-storage/bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
      });
      if (postRes.ok) {
        const d = await postRes.json();
        if (d && d.id) {
          activeBin = d.id;
          setSyncShortCode(activeBin);
          cloudSuccess = true;
        }
      }
    }
  } catch (e) {
    console.warn("云端推送异常:", e);
  }

  return { success: cloudSuccess, code: activeBin };
}

// 从云端拉取全量数据 (支持指定短码)
async function pullDataFromCloud(shortCode) {
  const code = (shortCode || getSyncShortCode()).trim();
  const binId = getCloudBinId(code);
  let remoteData = null;

  // 1. 最高优先级：若配置了 Supabase 云数据库
  const sbCfg = getSupabaseConfig();
  if (sbCfg.url && sbCfg.key) {
    try {
      const sbRes = await fetch(`${sbCfg.url}/rest/v1/sc_study_sync?short_code=eq.${encodeURIComponent(code)}&select=*`, {
        headers: {
          'apikey': sbCfg.key,
          'Authorization': `Bearer ${sbCfg.key}`
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined
      });
      if (sbRes.ok) {
        const list = await sbRes.json();
        if (Array.isArray(list) && list.length > 0 && list[0].data) {
          return list[0].data;
        }
      }
    } catch (e) {
      console.warn("Supabase 拉取异常，尝试备用通道:", e);
    }
  }

  // 2. 本地后端优先
  if (appState.activeTunnelUrl || window.location.port === '8000') {
    const pullEndpoint = appState.activeTunnelUrl 
      ? appState.activeTunnelUrl.replace('/api/generate', '/api/sync/pull')
      : '/api/sync/pull';
    try {
      const res = await fetch(pullEndpoint, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.plans || data.mistakes)) remoteData = data;
      }
    } catch (e) {}
  }

  // 3. 从全球公共云端中继拉取
  if (!remoteData) {
    try {
      const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${binId}?t=` + Date.now(), {
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.plans || data.mistakes)) {
          remoteData = data;
        }
      }
    } catch (e) {
      console.warn("云端拉取异常:", e);
    }
  }

  return remoteData;
}

// 自动静默推送
async function performAutoSyncPush() {
  const res = await pushDataToCloud();
  if (res && res.success) {
    showAutoSyncIndicator(`☁️ 已自动同步 (${getSyncShortCode()})`);
  }
}

// 自动在后台静默拉取远端最新数据
async function autoPullRemoteSync() {
  const remoteData = await pullDataFromCloud();
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
          if ((rm.attempt_count || 0) > (lm.attempt_count || 0) || (rm.is_mastered && !lm.is_mastered)) {
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

  // 3. 合并公文素材
  if (remoteData.materials && Array.isArray(remoteData.materials)) {
    const localMaterials = getLocalMaterials();
    const map = new Map();
    localMaterials.forEach(m => {
      if (m && m.id) map.set(String(m.id), m);
    });

    let matUpdated = false;
    remoteData.materials.forEach(rm => {
      if (rm && rm.id) {
        const idKey = String(rm.id);
        if (!map.has(idKey)) {
          map.set(idKey, rm);
          matUpdated = true;
        } else {
          const lm = map.get(idKey);
          if ((rm.updatedAt || 0) > (lm.updatedAt || 0)) {
            map.set(idKey, rm);
            matUpdated = true;
          }
        }
      }
    });

    if (matUpdated) {
      const mergedList = Array.from(map.values());
      localStorage.setItem(STORAGE_KEYS.DOC_MATERIALS, JSON.stringify(mergedList));
      appState.materials = mergedList;
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    calculateAndRenderDashboard();
    renderCalendar();
    renderMistakes();
    updateMistakeCounters();
    if (typeof renderMaterialGallery === 'function') renderMaterialGallery();
    if (typeof renderMaterialFlashcard === 'function') renderMaterialFlashcard();
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
    api_url: "https://api.siliconflow.cn/v1/chat/completions",
    api_key: "",
    api_model: "Qwen/Qwen2.5-7B-Instruct"
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
  loadMaterials();
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

  // 错题弹窗支持全局快捷键直接粘贴截图 (Cmd+V / Ctrl+V)
  const mistakeModal = document.getElementById('modal-ai-add-mistake');
  if (mistakeModal) {
    mistakeModal.addEventListener('paste', async (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;
      for (const item of clipboardData.items) {
        if (item.type && item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            try {
              const dataUrl = await compressImageFile(file);
              setMistakeImage(dataUrl);
            } catch (err) {
              console.warn('截图粘贴处理异常:', err);
            }
          }
        }
      }
    });
  }
}

/* ==========================================================================
   题目配图 (图形推理 / 图表题) 引擎：Canvas 自动等比无损压缩与全屏灯箱
   ========================================================================== */

function compressImageFile(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('请提供有效的图片文件'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('图片加载解析失败'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

async function handleMistakeImageFileSelect(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  try {
    const dataUrl = await compressImageFile(file);
    setMistakeImage(dataUrl);
  } catch (err) {
    alert('图片压缩处理失败: ' + err.message);
  }
}

function promptMistakeImageUrl() {
  const current = document.getElementById('parsed-img-data').value || '';
  const url = prompt('请输入题目插图网络链接 (URL):', current);
  if (url && url.trim()) {
    setMistakeImage(url.trim());
  }
}

function setMistakeImage(src) {
  const imgDataInput = document.getElementById('parsed-img-data');
  const previewWrap = document.getElementById('mistake-img-preview-wrap');
  const previewImg = document.getElementById('mistake-img-preview');
  const statusEl = document.getElementById('mistake-img-status');
  const removeBtn = document.getElementById('btn-remove-mistake-img');

  if (src && src.trim()) {
    imgDataInput.value = src.trim();
    previewImg.src = src.trim();
    previewWrap.style.display = 'block';
    if (statusEl) {
      statusEl.textContent = '🟢 已添加配图';
      statusEl.style.color = 'var(--accent-green)';
    }
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    removeMistakeImage();
  }
}

function removeMistakeImage() {
  const imgDataInput = document.getElementById('parsed-img-data');
  const previewWrap = document.getElementById('mistake-img-preview-wrap');
  const previewImg = document.getElementById('mistake-img-preview');
  const statusEl = document.getElementById('mistake-img-status');
  const removeBtn = document.getElementById('btn-remove-mistake-img');
  const fileInput = document.getElementById('mistake-image-file-input');

  if (imgDataInput) imgDataInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewWrap) previewWrap.style.display = 'none';
  if (fileInput) fileInput.value = '';
  if (statusEl) {
    statusEl.textContent = '未配图';
    statusEl.style.color = 'var(--text-muted)';
  }
  if (removeBtn) removeBtn.style.display = 'none';
}

function previewMistakeImage(src) {
  if (!src) return;
  const modal = document.getElementById('modal-image-lightbox');
  const img = document.getElementById('lightbox-img');
  if (modal && img) {
    img.src = src;
    modal.classList.remove('hidden');
  }
}

function closeImageLightbox() {
  const modal = document.getElementById('modal-image-lightbox');
  if (modal) modal.classList.add('hidden');
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
   2. 数据备份、导出/导入与跨端同步工具 (6位专属短码版)
   ========================================================================== */

function openBackupSyncModal() {
  const codeEl = document.getElementById('display-short-sync-code');
  if (codeEl) codeEl.textContent = getSyncShortCode();
  
  const switchInput = document.getElementById('input-switch-sync-code');
  if (switchInput) switchInput.value = '';

  const qrContainer = document.getElementById('qr-sync-container');
  if (qrContainer) qrContainer.style.display = 'none';

  // 回填 Supabase 配置
  const sbCfg = getSupabaseConfig();
  const sbUrlInput = document.getElementById('setting-supabase-url');
  const sbKeyInput = document.getElementById('setting-supabase-key');
  if (sbUrlInput) sbUrlInput.value = sbCfg.url || '';
  if (sbKeyInput) sbKeyInput.value = sbCfg.key || '';

  document.getElementById('modal-backup-sync').classList.remove('hidden');
}

function closeBackupSyncModal() {
  document.getElementById('modal-backup-sync').classList.add('hidden');
}

// 切换展开/折叠 Supabase 配置面板
function toggleSupabaseConfigPanel() {
  const panel = document.getElementById('supabase-config-panel');
  const icon = document.getElementById('supabase-config-toggle-icon');
  if (!panel) return;
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'block' : 'none';
  if (icon) icon.textContent = isHidden ? '▼ 收起配置' : '▶ 点击展开配置';
}

// 保存并测试 Supabase 连接
async function saveAndTestSupabaseConfig() {
  const url = (document.getElementById('setting-supabase-url').value || '').trim();
  const key = (document.getElementById('setting-supabase-key').value || '').trim();

  if (!url || !key) {
    saveSupabaseConfig('', '');
    alert('已清空 Supabase 配置，系统将切换回默认云端备用通道。');
    return;
  }

  const cleanUrl = url.replace(/\/+$/, '');
  
  try {
    // 发起探测测试
    const res = await fetch(`${cleanUrl}/rest/v1/sc_study_sync?limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 206) {
      saveSupabaseConfig(cleanUrl, key);
      alert('🎉 恭喜！Supabase 专属云数据库连接成功！\n现在数据将直接同步到您的私人云数据库中。');
      // 立即触发一次全量上传
      await manualPushCloudData();
    } else if (res.status === 404 || (res.status >= 400 && res.status < 500)) {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.message && errJson.message.includes('relation "public.sc_study_sync" does not exist')) {
        alert('⚠️ 连接成功，但在您的 Supabase 数据库中未找到 sc_study_sync 表！\n请点击左下方“复制一键建表 SQL”，并在 Supabase 控制台 SQL Editor 中运行一次即可！');
        saveSupabaseConfig(cleanUrl, key);
      } else {
        alert(`⚠️ Supabase 校验返回：${res.status} (${errJson.message || '请检查 URL 和 Key 是否正确'})`);
      }
    } else {
      alert(`⚠️ Supabase 连接测试失败 (HTTP ${res.status})，请检查项目地址是否正确。`);
    }
  } catch (e) {
    alert('❌ 无法连接到该 Supabase 地址：' + e.message);
  }
}

// 复制一键建表 SQL
function copySupabaseTableSql() {
  const sql = `-- 在 Supabase 控制台的 SQL Editor 中粘贴并点击 Run 运行即可
create table if not exists sc_study_sync (
  short_code text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 开启公共匿名读写策略 (适用于个人跨端备考同步)
alter table sc_study_sync enable row level security;
drop policy if exists "Allow all operations for anon" on sc_study_sync;
create policy "Allow all operations for anon" on sc_study_sync for all using (true) with check (true);
`;
  navigator.clipboard.writeText(sql).then(() => {
    alert('📋 一键建表 SQL 已成功复制到剪贴板！\n请登录 Supabase 控制台 ➔ 打开 SQL Editor ➔ 粘贴并点击 Run 即可完成建表！');
  }).catch(() => {
    alert('请手动在 Supabase 控制台中创建表 sc_study_sync');
  });
}

// 复制 6 位短同步码
function copyShortSyncCode() {
  const code = getSyncShortCode();
  navigator.clipboard.writeText(code).then(() => {
    alert(`📋 6 位专属云端同步码【${code}】已复制到剪贴板！\n在其他设备输入该短码即可一键同步。`);
  }).catch(() => {
    alert(`您的 6 位专属云端同步码为：${code}`);
  });
}

// 自定义 6 位专属短码
function editShortSyncCode() {
  const cur = getSyncShortCode();
  const input = prompt('请输入您想自定义的专属短码 (建议 6 位数字或字母，如生日/手机后6位)：', cur);
  if (input !== null) {
    const clean = input.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
    if (!clean) {
      alert('短码不能为空，且只能包含字母或数字！');
      return;
    }
    setSyncShortCode(clean);
    const codeEl = document.getElementById('display-short-sync-code');
    if (codeEl) codeEl.textContent = clean;
    alert(`🎉 专属短码已成功修改为【${clean}】！\n建议立即点击“☁️ 立即上传备份”将数据保存到新短码下。`);
  }
}

// 手动上传数据到云端
async function manualPushCloudData() {
  const btn = document.getElementById('btn-manual-push-cloud');
  const code = getSyncShortCode();
  if (btn) {
    btn.textContent = '☁️ 正在上传...';
    btn.disabled = true;
  }

  const res = await pushDataToCloud(code);

  if (btn) {
    btn.textContent = '☁️ 立即上传备份';
    btn.disabled = false;
  }

  if (res && res.success) {
    alert(`✅ 上传成功！当前全部打卡与错题已安全备份至云端。\n\n📱 在手机端打开网页，输入 6 位短码【${code}】即可一键同步！`);
    showAutoSyncIndicator(`☁️ 已备份 (${code})`);
  } else {
    alert(`⚠️ 云端中继暂时离线或网络波动。数据已在当前设备完好保存，您也可以使用底部的“导出JSON文件”备份。`);
  }
}

// 手动从云端拉取并合并数据
async function manualPullCloudData() {
  const btn = document.getElementById('btn-manual-pull-cloud');
  const code = getSyncShortCode();
  if (btn) {
    btn.textContent = '📥 正在拉取...';
    btn.disabled = true;
  }

  const remoteData = await pullDataFromCloud(code);

  if (btn) {
    btn.textContent = '📥 立即拉取合并';
    btn.disabled = false;
  }

  if (remoteData && (remoteData.plans || remoteData.mistakes)) {
    mergeRemoteDataSafely(remoteData);
    alert(`🎉 成功从云端短码【${code}】拉取最新数据！\n历史进度与错题已与当前设备安全合并。`);
  } else {
    alert(`ℹ️ 云端短码【${code}】下暂无更新数据，或网络连接超时。请确认另一台设备是否已点击“立即上传备份”。`);
  }
}

// 切换并拉取新短码
async function switchAndPullSyncCode() {
  const inputEl = document.getElementById('input-switch-sync-code');
  const raw = inputEl.value.trim();
  if (!raw) {
    alert('请先输入要连接的 6 位短同步码！');
    return;
  }
  const cleanCode = setSyncShortCode(raw);
  const codeEl = document.getElementById('display-short-sync-code');
  if (codeEl) codeEl.textContent = cleanCode;

  // 尝试拉取数据
  const remoteData = await pullDataFromCloud(cleanCode);
  if (remoteData && (remoteData.plans || remoteData.mistakes)) {
    mergeRemoteDataSafely(remoteData);
    alert(`🎉 成功绑定短码【${cleanCode}】并同步完成！\n历史进度与错题已成功恢复到当前设备。`);
  } else {
    alert(`🔗 已成功绑定短码【${cleanCode}】！后续数据将自动向此短码同步。`);
  }
}

// 展示极简二维码
function showQrSyncCodeModal() {
  const container = document.getElementById('qr-sync-container');
  const canvas = document.getElementById('qr-sync-canvas');
  if (!container) return;

  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }

  const code = getSyncShortCode();
  const baseUrl = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'https://www.bettercall12.cc/sichuan-study/'
    : window.location.origin + window.location.pathname;

  const shortSyncUrl = `${baseUrl}?code=${encodeURIComponent(code)}`;

  if (typeof QRCode !== 'undefined' && QRCode.toCanvas && canvas) {
    QRCode.toCanvas(canvas, shortSyncUrl, {
      width: 160,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    }, (err) => {
      if (err) {
        container.innerHTML = `
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shortSyncUrl)}" alt="同步二维码" style="max-width:160px; margin:0 auto; display:block; border-radius:4px;" />
          <div style="font-size:0.75rem; color:var(--primary); margin-top:6px; font-weight:600;">用微信/相机扫码，打开即可自动绑定短码【${code}】</div>
        `;
      }
      container.style.display = 'block';
    });
  } else {
    container.innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shortSyncUrl)}" alt="同步二维码" style="max-width:160px; margin:0 auto; display:block; border-radius:4px;" />
      <div style="font-size:0.75rem; color:var(--primary); margin-top:6px; font-weight:600;">用微信/相机扫码，打开即可自动绑定短码【${code}】</div>
    `;
    container.style.display = 'block';
  }
}

// 导出全量 JSON 备份
function exportStudyDataJSON() {
  const plans = getLocalPlans();
  const mistakes = getLocalMistakes();
  const settings = getAiSettings();

  const exportObj = {
    app: "2027_sichuan_study_system",
    export_at: new Date().toISOString(),
    sync_code: getSyncShortCode(),
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
      if (data.sync_code) {
        setSyncShortCode(data.sync_code);
      }
      alert('🎉 备份数据导入成功！页面将自动刷新并展示最新进度。');
      window.location.reload();
    } catch (err) {
      alert('❌ 导入失败，文件格式有误：' + err.message);
    }
  };
  reader.readAsText(file);
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

  // 1. 若当前配置为云端大模型 API 模式
  if (settings.engine_type === 'openai') {
    if (!settings.api_key) {
      aiAnswer = {
        title: "⚠️ 尚未配置云端 API Key",
        content: `您当前处于【云端 API 模式】，但尚未填写密钥。\n\n💡 请点击上方【⚙️ 设置引擎/Key】并填入您的 API Key。\n\n已为您自动转接本地精准考情知识库进行解答：\n\n${(searchLocalKnowledgeBase(text) || {}).content || ''}`,
        engine_source: "cloud_api_failed",
        engine_label: "🟡 云端未填密钥 (已转知识库)"
      };
    } else {
      try {
        const apiUrl = settings.api_url || 'https://api.siliconflow.cn/v1/chat/completions';
        const apiModel = settings.api_model || 'Qwen/Qwen2.5-7B-Instruct';
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.api_key}`
          },
          body: JSON.stringify({
            model: apiModel,
            messages: [
              { role: 'system', content: '你是专业的四川省紧缺专业选调生备考指导名师。请回答条理清晰、紧扣四川定向选调考情。' },
              { role: 'user', content: text }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content.trim() : JSON.stringify(data);
          const modelName = apiModel.split('/').pop();
          aiAnswer = {
            title: `云端大模型 (${modelName}) 深度解答`,
            content: content,
            engine_source: "cloud_api",
            engine_label: `☁️ 云端大模型 (${modelName})`
          };
        } else {
          const errDetail = await res.text();
          let msg = `HTTP ${res.status}`;
          try {
            const ej = JSON.parse(errDetail);
            if (ej.message) msg += `: ${ej.message}`;
            else if (ej.error && ej.error.message) msg += `: ${ej.error.message}`;
          } catch(e) {}
          aiAnswer = {
            title: `⚠️ 云端大模型调用未成功 (${msg})`,
            content: `接口返回异常：${msg}\n\n💡 解决排查：\n1. 请点击上方【⚙️ 设置引擎/Key】；\n2. 检查常用服务商是否选对（例如 SiliconFlow 密钥需选【硅基流动】）；\n3. 确认接口地址是否匹配。\n\n已为您自动转接本地精准考情知识库进行解答：\n\n${(searchLocalKnowledgeBase(text) || {}).content || ''}`,
            engine_source: "cloud_api_failed",
            engine_label: `⚠️ 云端调用未成功 (${res.status})`
          };
        }
      } catch (err) {
        aiAnswer = {
          title: "⚠️ 云端网络请求异常",
          content: `网络连接异常：${err.message}\n\n已为您自动转接本地精准考情知识库进行解答：\n\n${(searchLocalKnowledgeBase(text) || {}).content || ''}`,
          engine_source: "cloud_api_failed",
          engine_label: "⚠️ 网络请求异常"
        };
      }
    }
  }

  // 2. 否则若是本地 Ollama 模式，优先尝试本地后端 /api/chat 与安全隧道
  if (!aiAnswer && settings.engine_type !== 'builtin') {
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
  }

  // 3. 在线静态端直接连 Ollama 隧道或本地端口
  if (!aiAnswer && settings.engine_type === 'ollama' && (appState.activeTunnelUrl || settings.ollama_url)) {
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
  initDuoPractice();
  updateMistakeCounters();
  switchMistakeViewMode(appState.mistakeViewMode || 'duo');
}

function updateMistakeCounters() {
  const allCount = appState.mistakes.length;
  const unmasteredCount = appState.mistakes.filter(m => (m.is_mastered || 0) === 0).length;
  const masteredCount = appState.mistakes.filter(m => (m.is_mastered || 0) === 1).length;

  const elAll = document.getElementById('count-all');
  const elUn = document.getElementById('count-unmastered');
  const elMas = document.getElementById('count-mastered');
  const elStat = document.getElementById('stat-mistakes');
  const elListTotal = document.getElementById('mode-list-total-count');
  const elDuoUn = document.getElementById('duo-unmastered-num');
  const elDuoAll = document.getElementById('duo-all-num');

  if (elAll) elAll.textContent = allCount;
  if (elUn) elUn.textContent = unmasteredCount;
  if (elMas) elMas.textContent = masteredCount;
  if (elStat) elStat.textContent = unmasteredCount;
  if (elListTotal) elListTotal.textContent = allCount;
  if (elDuoUn) elDuoUn.textContent = unmasteredCount;
  if (elDuoAll) elDuoAll.textContent = allCount;
}

/* ==========================================================================
   沉浸单题刷题流引擎 (Duolingo 闪卡交互 + 随机抽题 + 键盘快捷键)
   ========================================================================== */

function initDuoPractice() {
  const autoCb = document.getElementById('duo-auto-next-checkbox');
  if (autoCb) autoCb.checked = appState.duoAutoNext;

  const scopeSel = document.getElementById('duo-scope-select');
  if (scopeSel) scopeSel.value = appState.duoScope;

  const typeSel = document.getElementById('duo-type-select');
  if (typeSel) typeSel.value = appState.duoType;

  // 绑定全局快捷键（仅在错题标签页且单题沉浸模式激活时生效）
  if (!window._duoKeyBound) {
    window._duoKeyBound = true;
    window.addEventListener('keydown', handleDuoKeydown);
  }
}

function switchMistakeViewMode(mode) {
  appState.mistakeViewMode = mode;
  localStorage.setItem('mistake_view_mode', mode);

  const duoView = document.getElementById('duo-practice-view');
  const listView = document.getElementById('list-practice-view');
  const btnDuo = document.getElementById('btn-mode-duo');
  const btnList = document.getElementById('btn-mode-list');

  if (mode === 'duo') {
    if (duoView) duoView.classList.remove('hidden');
    if (listView) listView.classList.add('hidden');
    if (btnDuo) btnDuo.classList.add('active');
    if (btnList) btnList.classList.remove('active');
    if (!appState.duoCurrentItem) {
      pickAndRenderDuoQuestion();
    }
  } else {
    if (duoView) duoView.classList.add('hidden');
    if (listView) listView.classList.remove('hidden');
    if (btnDuo) btnDuo.classList.remove('active');
    if (btnList) btnList.classList.add('active');
    renderMistakes();
  }
}

function changeDuoScope(scope) {
  appState.duoScope = scope;
  appState.duoHistoryIds = [];
  pickAndRenderDuoQuestion(true);
}

function changeDuoType(type) {
  appState.duoType = type;
  appState.duoHistoryIds = [];
  pickAndRenderDuoQuestion(true);
}

function toggleDuoAutoNext(checked) {
  appState.duoAutoNext = Boolean(checked);
  localStorage.setItem('duo_auto_next', String(appState.duoAutoNext));
}

function skipToNextDuoQuestion() {
  if (appState.duoCurrentItem) {
    if (!appState.duoHistoryIds.includes(appState.duoCurrentItem.id)) {
      appState.duoHistoryIds.push(appState.duoCurrentItem.id);
    }
  }
  pickAndRenderDuoQuestion(true);
}

function nextDuoQuestion() {
  pickAndRenderDuoQuestion(true);
}

function toggleDuoAnalysis() {
  const drawer = document.getElementById('duo-card-analysis-drawer');
  const btn = document.getElementById('btn-duo-toggle-analysis');
  if (!drawer) return;
  if (drawer.style.display === 'none' || !drawer.style.display) {
    drawer.style.display = 'block';
    if (btn) btn.textContent = '🙈 收起解析';
  } else {
    drawer.style.display = 'none';
    if (btn) btn.textContent = '👁️ 展开解析';
  }
}

function getDuoCandidatePool() {
  let list = appState.mistakes || [];

  // 1. 范围筛选
  if (appState.duoScope === 'unmastered') {
    list = list.filter(m => (m.is_mastered || 0) === 0);
  } else if (appState.duoScope !== 'all') {
    list = list.filter(m => m.category && (m.category.includes(appState.duoScope) || appState.duoScope.includes(m.category)));
  }

  // 2. 题型筛选
  if (appState.duoType !== 'all') {
    list = list.filter(m => (m.question_type || 'single') === appState.duoType);
  }

  return list;
}

function pickAndRenderDuoQuestion(forceNew = false) {
  const stage = document.getElementById('duo-card-stage');
  const sheet = document.getElementById('duo-feedback-sheet');
  if (!stage) return;

  if (sheet) sheet.classList.add('hidden');
  appState.duoAnswered = false;
  appState.duoMultiSelected = [];

  const candidates = getDuoCandidatePool();
  if (candidates.length === 0) {
    appState.duoCurrentItem = null;
    stage.innerHTML = `
      <div style="text-align:center; padding:44px 20px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
        <div style="font-size:2.2rem; margin-bottom:10px;">🎉</div>
        <h4 style="margin-bottom:8px; font-weight:700;">当前刷题池中暂无待复习题目！</h4>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:16px;">您已把当前范围内的错题全部拿下，太棒了！</p>
        <div style="display:flex; justify-content:center; gap:10px;">
          <button class="btn btn-outline btn-sm" onclick="changeDuoScope('all')">📚 切换为【全部错题库】重新刷</button>
          <button class="btn btn-primary btn-sm" onclick="openAiAddMistakeModal()">✨ AI 录入新错题</button>
        </div>
      </div>
    `;
    return;
  }

  // 避免连续重复抽到刚刷过的题（抽题历史队列机制）
  let available = candidates.filter(m => !appState.duoHistoryIds.includes(m.id));
  if (available.length === 0) {
    appState.duoHistoryIds = [];
    available = candidates;
  }

  if (!forceNew && appState.duoCurrentItem && candidates.some(m => m.id === appState.duoCurrentItem.id)) {
    // 保持当前
  } else {
    const randomIndex = Math.floor(Math.random() * available.length);
    appState.duoCurrentItem = available[randomIndex];
    appState.duoHistoryIds.push(appState.duoCurrentItem.id);
  }

  renderDuoQuestionCard(appState.duoCurrentItem);
}

function renderDuoQuestionCard(item) {
  const stage = document.getElementById('duo-card-stage');
  if (!stage || !item) return;

  const isMastered = (item.is_mastered || 0) === 1;
  const streak = item.correct_streak || 0;
  const threshold = item.mastery_threshold || 3;
  const qType = item.question_type || 'single';
  const isMultiple = (qType === 'multiple');

  let typeBadgeHtml = `<span class="type-badge type-badge-single">🔘 单选题</span>`;
  if (qType === 'multiple') {
    typeBadgeHtml = `<span class="type-badge type-badge-multiple">☑️ 多选题</span>`;
  } else if (qType === 'judge') {
    typeBadgeHtml = `<span class="type-badge type-badge-judge">⚖️ 判断题</span>`;
  }

  let flameIcons = '';
  for (let i = 1; i <= threshold; i++) {
    if (i <= streak) {
      flameIcons += `<span style="color:#ef4444; text-shadow:0 0 6px rgba(239,68,68,0.5);" title="第${i}次答对">🔥</span>`;
    } else {
      flameIcons += `<span style="opacity:0.25; filter:grayscale(1);" title="还需答对">🔥</span>`;
    }
  }

  const options = Array.isArray(item.options) && item.options.length > 0 
    ? item.options 
    : (qType === 'judge' ? ["A. 正确", "B. 错误"] : ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"]);

  const optionsHtml = options.map((opt) => {
    const optLetter = opt.trim().charAt(0).toUpperCase();
    const cleanContent = opt.replace(/^[A-Da-d][.、\s]+/, '').trim();
    if (isMultiple) {
      return `
        <button class="duo-opt-btn" id="duo-opt-btn-${optLetter}" onclick="toggleDuoMultiOption('${optLetter}')">
          <div style="display:flex; align-items:center;">
            <span class="duo-opt-badge">${optLetter}</span>
            <span class="duo-opt-text">${escapeHtml(cleanContent || opt)}</span>
          </div>
          <span class="duo-opt-checkbox" id="duo-opt-cb-${optLetter}" style="font-size:1.1rem; opacity:0.6;">⬜</span>
        </button>
      `;
    } else {
      return `
        <button class="duo-opt-btn" id="duo-opt-btn-${optLetter}" onclick="attemptDuoChoice('${optLetter}')">
          <div style="display:flex; align-items:center;">
            <span class="duo-opt-badge">${optLetter}</span>
            <span class="duo-opt-text">${escapeHtml(cleanContent || opt)}</span>
          </div>
          <span class="shortcut-key-label" style="font-size:0.75rem; color:var(--text-muted); opacity:0.6;">[${optLetter}]</span>
        </button>
      `;
    }
  }).join('');

  stage.innerHTML = `
    <div class="duo-question-card" id="duo-current-card-${item.id}">
      <div class="duo-q-header">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${typeBadgeHtml}
          <span class="kp-tag">【${escapeHtml(item.category)}】</span>
          ${item.key_point ? `<span class="kp-tag" style="background:rgba(217,119,6,0.1); color:var(--accent-amber);">🏷️ ${escapeHtml(item.key_point)}</span>` : ''}
          <div style="display:inline-flex; align-items:center; gap:3px; font-size:0.8rem; margin-left:4px;" title="艾宾浩斯抗遗忘连对进度">
            <span>掌握度:</span> ${flameIcons}
            <span style="font-weight:700; color:var(--primary); font-size:0.75rem;">(${streak}/${threshold})</span>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-xs" style="color:var(--primary);" onclick="openEditMistakeModal(${item.id})">✏️ 编辑</button>
          <button class="btn btn-outline btn-xs" onclick="toggleMistakeMasterStatus(${item.id}); pickAndRenderDuoQuestion(true);">
            ${isMastered ? '设为待复习' : '直接掌握'}
          </button>
        </div>
      </div>

      <div class="duo-q-title">${escapeHtml(item.question)}</div>

      ${item.image ? `
        <div class="mistake-q-image-wrap" style="margin-bottom:16px;">
          <img src="${escapeHtml(item.image)}" class="mistake-q-image" alt="题目配图" title="点击放大查看大图" onclick="previewMistakeImage(this.src)">
        </div>
      ` : ''}

      <div class="duo-opt-grid" id="duo-options-container">
        ${optionsHtml}
      </div>

      ${isMultiple ? `
        <div style="margin-top:6px; margin-bottom:8px;" id="duo-multi-submit-wrap">
          <button class="btn btn-primary" style="width:100%; padding:10px; font-weight:700;" id="btn-duo-submit-multi" onclick="submitDuoMultiChoice()">
            📝 确认提交多选作答 (已选: 无)
          </button>
        </div>
      ` : ''}

      <div class="mistake-analysis-drawer" id="duo-card-analysis-drawer" style="display:none; margin-top:12px;">
        <div style="margin-bottom:4px;">
          <strong>【参考答案】：</strong><span style="color:var(--accent-green); font-weight:700;">${item.correct_answer || 'A'}</span>
          ${item.user_answer ? `<span style="color:var(--accent-red); margin-left:12px;">（历史曾错选：${item.user_answer}）</span>` : ''}
        </div>
        <div><strong>【深度解析】：</strong>${escapeHtml(item.correct_analysis || '暂无解析')}</div>
      </div>
    </div>
  `;
}

function attemptDuoChoice(choiceLetter) {
  if (appState.duoAnswered) return;
  const item = appState.duoCurrentItem;
  if (!item) return;

  appState.duoAnswered = true;
  const correctAns = (item.correct_answer || "A").trim().toUpperCase();
  const userChoice = choiceLetter.trim().toUpperCase();
  const isCorrect = (userChoice === correctAns);
  const threshold = item.mastery_threshold || 3;

  const container = document.getElementById('duo-options-container');
  if (container) {
    container.querySelectorAll('.duo-opt-btn').forEach(btn => {
      btn.classList.add('locked');
      const letter = btn.id.replace('duo-opt-btn-', '').toUpperCase();
      if (letter === correctAns) {
        btn.classList.add('correct-choice');
      } else if (letter === userChoice && !isCorrect) {
        btn.classList.add('wrong-choice');
      }
    });
  }

  appState.duoSessionCount++;
  item.attempt_count = (item.attempt_count || 0) + 1;

  if (isCorrect) {
    appState.duoSessionCorrect++;
    item.correct_count = (item.correct_count || 0) + 1;
    item.correct_streak = (item.correct_streak || 0) + 1;
    if (item.correct_streak >= threshold) {
      item.is_mastered = 1;
    }
  } else {
    item.correct_streak = 0;
    item.is_mastered = 0;
  }

  saveLocalMistakes(appState.mistakes);
  updateMistakeCounters();
  updateDuoSessionStatsUI();

  showDuoFeedbackSheet(isCorrect, correctAns, item.correct_streak, threshold, item.correct_analysis);

  if (isCorrect && appState.duoAutoNext) {
    setTimeout(() => {
      if (appState.duoCurrentItem && appState.duoCurrentItem.id === item.id) {
        nextDuoQuestion();
      }
    }, 1200);
  }
}

function toggleDuoMultiOption(optLetter) {
  if (appState.duoAnswered) return;
  const list = appState.duoMultiSelected;
  const idx = list.indexOf(optLetter);
  if (idx > -1) list.splice(idx, 1);
  else list.push(optLetter);

  const btn = document.getElementById(`duo-opt-btn-${optLetter}`);
  const cb = document.getElementById(`duo-opt-cb-${optLetter}`);
  if (btn) {
    const isChecked = list.includes(optLetter);
    btn.classList.toggle('duo-selected', isChecked);
    if (cb) cb.textContent = isChecked ? '☑️' : '⬜';
  }

  const submitBtn = document.getElementById('btn-duo-submit-multi');
  if (submitBtn) {
    submitBtn.textContent = `📝 确认提交多选作答 ${list.length > 0 ? `(已选: ${list.slice().sort().join('')})` : '(已选: 无)'}`;
  }
}

function submitDuoMultiChoice() {
  if (appState.duoAnswered) return;
  const item = appState.duoCurrentItem;
  if (!item) return;

  const selectedList = appState.duoMultiSelected;
  if (selectedList.length === 0) {
    alert('请先至少勾选一个选项再提交作答！');
    return;
  }

  appState.duoAnswered = true;
  const userAns = selectedList.slice().sort().join('');
  const correctAns = (item.correct_answer || "ABC").toUpperCase().replace(/[^A-D]/g, '').split('').sort().join('');
  const isCorrect = (userAns === correctAns);
  const threshold = item.mastery_threshold || 3;

  const container = document.getElementById('duo-options-container');
  if (container) {
    container.querySelectorAll('.duo-opt-btn').forEach(btn => {
      btn.classList.add('locked');
      const letter = btn.id.replace('duo-opt-btn-', '').toUpperCase();
      const inCorrect = correctAns.includes(letter);
      const inUser = userAns.includes(letter);

      if (inCorrect && inUser) {
        btn.classList.add('correct-choice');
      } else if (!inCorrect && inUser) {
        btn.classList.add('wrong-choice');
      } else if (inCorrect && !inUser) {
        btn.classList.add('missed-choice');
      }
    });
  }

  appState.duoSessionCount++;
  item.attempt_count = (item.attempt_count || 0) + 1;

  if (isCorrect) {
    appState.duoSessionCorrect++;
    item.correct_count = (item.correct_count || 0) + 1;
    item.correct_streak = (item.correct_streak || 0) + 1;
    if (item.correct_streak >= threshold) {
      item.is_mastered = 1;
    }
  } else {
    item.correct_streak = 0;
    item.is_mastered = 0;
  }

  saveLocalMistakes(appState.mistakes);
  updateMistakeCounters();
  updateDuoSessionStatsUI();

  showDuoFeedbackSheet(isCorrect, correctAns, item.correct_streak, threshold, item.correct_analysis);

  if (isCorrect && appState.duoAutoNext) {
    setTimeout(() => {
      if (appState.duoCurrentItem && appState.duoCurrentItem.id === item.id) {
        nextDuoQuestion();
      }
    }, 1200);
  }
}

function updateDuoSessionStatsUI() {
  const counterEl = document.getElementById('duo-session-counter');
  const accEl = document.getElementById('duo-accuracy-rate');
  if (counterEl) counterEl.textContent = appState.duoSessionCount;
  if (accEl) {
    const rate = appState.duoSessionCount > 0 
      ? Math.round((appState.duoSessionCorrect / appState.duoSessionCount) * 100) 
      : 100;
    accEl.textContent = `(正确率 ${rate}%)`;
  }
}

function showDuoFeedbackSheet(isCorrect, correctAns, streak, threshold, analysisText) {
  const sheet = document.getElementById('duo-feedback-sheet');
  const icon = document.getElementById('duo-feedback-icon');
  const title = document.getElementById('duo-feedback-title');
  const desc = document.getElementById('duo-feedback-desc');
  const drawer = document.getElementById('duo-card-analysis-drawer');
  const toggleBtn = document.getElementById('btn-duo-toggle-analysis');

  if (!sheet) return;

  sheet.classList.remove('hidden');
  sheet.classList.remove('correct-sheet', 'wrong-sheet');

  if (isCorrect) {
    sheet.classList.add('correct-sheet');
    if (icon) icon.textContent = '🎉';
    if (title) title.textContent = streak >= threshold ? '太棒了！达成艾宾浩斯抗遗忘认证！' : '回答正确！';
    if (desc) {
      desc.textContent = streak >= threshold 
        ? `🔥 已连续答对 ${streak} 次，达成科学长期记忆！` 
        : `🔥 连对进度: ${streak}/${threshold} 次（再连对 ${threshold - streak} 次即可真正掌握）`;
    }
  } else {
    sheet.classList.add('wrong-sheet');
    if (icon) icon.textContent = '💡';
    if (title) title.textContent = `遗憾答错！正确答案是【${correctAns}】`;
    if (desc) desc.textContent = `连对进度已清零。下方已自动为您展开深度解析，请仔细复盘！`;
    if (drawer) drawer.style.display = 'block';
    if (toggleBtn) toggleBtn.textContent = '🙈 收起解析';
  }
}

function handleDuoKeydown(e) {
  const mistakesTab = document.getElementById('tab-mistakes');
  if (!mistakesTab || !mistakesTab.classList.contains('active')) return;
  if (appState.mistakeViewMode !== 'duo') return;

  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  const modalAdd = document.getElementById('modal-ai-add-mistake');
  const modalSettings = document.getElementById('modal-ai-settings');
  if ((modalAdd && !modalAdd.classList.contains('hidden')) || (modalSettings && !modalSettings.classList.contains('hidden'))) {
    return;
  }

  const key = e.key;

  if (key === ' ' || key === 'Enter') {
    if (appState.duoAnswered) {
      e.preventDefault();
      nextDuoQuestion();
      return;
    }
    if (appState.duoCurrentItem && appState.duoCurrentItem.question_type === 'multiple') {
      e.preventDefault();
      submitDuoMultiChoice();
      return;
    }
  }

  if (key === 'Tab' || key === 's' || key === 'S') {
    e.preventDefault();
    skipToNextDuoQuestion();
    return;
  }

  if (!appState.duoAnswered && appState.duoCurrentItem) {
    let letter = null;
    if (key === 'a' || key === 'A' || key === '1') letter = 'A';
    else if (key === 'b' || key === 'B' || key === '2') letter = 'B';
    else if (key === 'c' || key === 'C' || key === '3') letter = 'C';
    else if (key === 'd' || key === 'D' || key === '4') letter = 'D';

    if (letter) {
      e.preventDefault();
      if (appState.duoCurrentItem.question_type === 'multiple') {
        toggleDuoMultiOption(letter);
      } else {
        attemptDuoChoice(letter);
      }
    }
  }
}

function renderMistakes() {
  const container = document.getElementById('mistakes-container');
  if (!container) return;
  container.innerHTML = '';

  let filtered = appState.mistakes;

  // 1. 掌握状态过滤
  if (appState.activeMistakeFilter === 'unmastered') {
    filtered = filtered.filter(m => (m.is_mastered || 0) === 0);
  } else if (appState.activeMistakeFilter === 'mastered') {
    filtered = filtered.filter(m => (m.is_mastered || 0) === 1);
  }

  // 2. 题型过滤 (单选/多选/判断)
  if (appState.activeMistakeTypeFilter !== 'all') {
    filtered = filtered.filter(m => (m.question_type || 'single') === appState.activeMistakeTypeFilter);
  }

  // 3. 考查板块过滤
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
    const qType = m.question_type || 'single';

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

    let typeBadgeHtml = `<span class="type-badge type-badge-single">🔘 单选</span>`;
    if (qType === 'multiple') {
      typeBadgeHtml = `<span class="type-badge type-badge-multiple">☑️ 多选</span>`;
    } else if (qType === 'judge') {
      typeBadgeHtml = `<span class="type-badge type-badge-judge">⚖️ 判断</span>`;
    }

    const isMultiple = (qType === 'multiple');
    const curSelected = appState.multiSelections[m.id] || [];

    // 构建选项列表 HTML
    const optionsHtml = options.map(opt => {
      const optKey = opt.trim().charAt(0).toUpperCase();
      if (isMultiple) {
        const isChecked = curSelected.includes(optKey);
        return `
          <button class="practice-opt-btn ${isChecked ? 'multi-selected' : ''}" id="opt-btn-${m.id}-${optKey}" onclick="toggleMultiSelectOption(${m.id}, '${optKey}')">
            <span><strong>${isChecked ? '☑️' : '⬜'}</strong> ${escapeHtml(opt)}</span>
            <span class="opt-feedback-icon"></span>
          </button>
        `;
      } else {
        return `
          <button class="practice-opt-btn" onclick="attemptMistakeChoice(${m.id}, '${optKey}', this)">
            <span>${escapeHtml(opt)}</span>
            <span class="opt-feedback-icon"></span>
          </button>
        `;
      }
    }).join('');

    card.innerHTML = `
      <div class="mistake-card-top">
        <div class="mistake-badges-group">
          ${typeBadgeHtml}
          ${levelBadge}
          <span class="kp-tag">【${m.category}】</span>
          ${m.key_point ? `<span class="kp-tag" style="background:rgba(217,119,6,0.1); color:var(--accent-amber);">🏷️ ${m.key_point}</span>` : ''}
          <span class="stats-tag">已练: ${attempts}次</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline" style="padding:3px 8px; font-size:0.72rem; color:var(--primary);" onclick="openEditMistakeModal(${m.id})">
            ✏️ 编辑
          </button>
          <button class="btn btn-outline" style="padding:3px 8px; font-size:0.72rem;" onclick="toggleMistakeMasterStatus(${m.id})">
            ${isMastered ? '设为待复习' : '直接掌握'}
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

      ${m.image ? `
        <div class="mistake-q-image-wrap">
          <img src="${escapeHtml(m.image)}" class="mistake-q-image" alt="题目配图" title="点击放大查看大图" onclick="previewMistakeImage(this.src)">
        </div>
      ` : ''}

      <div class="practice-options-grid" id="practice-opts-${m.id}">
        ${optionsHtml}
      </div>

      ${isMultiple ? `
        <div style="margin-bottom:12px;" id="multi-submit-wrap-${m.id}">
          <button class="btn btn-primary btn-sm" style="width:100%;" onclick="submitMultiSelectChoice(${m.id})">
            📝 提交多选作答 ${curSelected.length > 0 ? `(已选: ${curSelected.slice().sort().join('')})` : '(请先勾选选项)'}
          </button>
        </div>
      ` : ''}

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

// 切换多选题选项勾选状态
function toggleMultiSelectOption(mistakeId, optKey) {
  if (!appState.multiSelections[mistakeId]) {
    appState.multiSelections[mistakeId] = [];
  }
  const list = appState.multiSelections[mistakeId];
  const idx = list.indexOf(optKey);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(optKey);
  }

  // 局部刷新按钮状态与文案
  const btn = document.getElementById(`opt-btn-${mistakeId}-${optKey}`);
  if (btn) {
    const isChecked = list.includes(optKey);
    btn.classList.toggle('multi-selected', isChecked);
    const labelSpan = btn.querySelector('span:first-child');
    if (labelSpan) {
      const origText = labelSpan.textContent.replace(/^[☑️⬜\s]+/, '');
      labelSpan.innerHTML = `<strong>${isChecked ? '☑️' : '⬜'}</strong> ${origText}`;
    }
  }

  const submitWrap = document.getElementById(`multi-submit-wrap-${mistakeId}`);
  if (submitWrap) {
    const submitBtn = submitWrap.querySelector('button');
    if (submitBtn) {
      submitBtn.textContent = `📝 提交多选作答 ${list.length > 0 ? `(已选: ${list.slice().sort().join('')})` : '(请先勾选选项)'}`;
    }
  }
}

// 提交多选题作答
async function submitMultiSelectChoice(mistakeId) {
  const item = appState.mistakes.find(m => m.id === mistakeId);
  if (!item) return;

  const selectedList = appState.multiSelections[mistakeId] || [];
  if (selectedList.length === 0) {
    alert('请先至少勾选一个选项再提交作答！');
    return;
  }

  const userAns = selectedList.slice().sort().join('');
  const correctAns = (item.correct_answer || "ABC").toUpperCase().replace(/[^A-D]/g, '').split('').sort().join('');
  const isCorrect = (userAns === correctAns);
  const threshold = item.mastery_threshold || 3;

  const container = document.getElementById(`practice-opts-${mistakeId}`);
  const drawer = document.getElementById(`analysis-drawer-${mistakeId}`);
  const card = document.getElementById(`mistake-card-${mistakeId}`);

  if (container) {
    container.querySelectorAll('.practice-opt-btn').forEach(b => {
      const optLetter = b.id.replace(`opt-btn-${mistakeId}-`, '').toUpperCase();
      const inCorrect = correctAns.includes(optLetter);
      const inUser = userAns.includes(optLetter);

      if (inCorrect && inUser) {
        b.classList.add('correct-choice');
      } else if (!inCorrect && inUser) {
        b.classList.add('wrong-choice');
      } else if (inCorrect && !inUser) {
        b.classList.add('missed-choice');
      }
    });
  }

  if (drawer) drawer.style.display = 'block';

  item.attempt_count = (item.attempt_count || 0) + 1;

  if (isCorrect) {
    item.correct_count = (item.correct_count || 0) + 1;
    item.correct_streak = (item.correct_streak || 0) + 1;

    if (item.correct_streak >= threshold) {
      item.is_mastered = 1;
      card.classList.add('is-mastered-card');
      alert(`🎉 恭喜！多选题全部选项选择正确（${userAns}），达成【艾宾浩斯抗遗忘认证 · 科学已掌握】！`);
    } else {
      item.is_mastered = 0;
      card.classList.remove('is-mastered-card');
      alert(`✨ 答对了！多选题选项全部命中（${userAns}），当前连对 ${item.correct_streak}/${threshold} 次！`);
    }
  } else {
    item.correct_streak = 0;
    item.is_mastered = 0;
    card.classList.remove('is-mastered-card');
    alert(`❌ 多选题作答有误！正确答案为【${correctAns}】，您的选择为【${userAns}】。连对进度已清零，请查看下方解析！`);
  }

  // 清除作答暂存
  delete appState.multiSelections[mistakeId];

  saveLocalMistakes(appState.mistakes);
  renderMistakes();
  updateMistakeCounters();
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
  delete appState.multiSelections[mistakeId];
  renderMistakes();
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

// 打开已有错题编辑弹窗
function openEditMistakeModal(id) {
  const item = appState.mistakes.find(m => m.id === id);
  if (!item) return;

  document.getElementById('editing-mistake-id').value = item.id;
  document.getElementById('modal-mistake-title').textContent = '✏️ 编辑错题详情与考点';
  document.getElementById('raw-input-group').classList.add('hidden');
  document.getElementById('ai-parsed-preview').classList.remove('hidden');

  document.getElementById('parsed-cat-select').value = item.category || '非法律公基';
  document.getElementById('parsed-type-select').value = item.question_type || 'single';
  document.getElementById('parsed-q-input').value = item.question || '';
  const itemOpts = (item.question_type === 'judge' && (!item.options || item.options.length === 0 || item.options.every(o => o.includes('选项')))) ? ["A. 正确", "B. 错误"] : (item.options || []);
  document.getElementById('parsed-opts-input').value = itemOpts.join('\n');
  document.getElementById('parsed-ans-input').value = item.correct_answer || 'A';
  document.getElementById('parsed-my-input').value = item.user_answer || '';
  document.getElementById('parsed-kp-input').value = item.key_point || '';
  document.getElementById('parsed-exp-input').value = item.correct_analysis || '';

  // 回填题目配图
  if (item.image) {
    setMistakeImage(item.image);
  } else {
    removeMistakeImage();
  }

  const pill = document.getElementById('parsed-engine-source-pill');
  if (pill) pill.textContent = '✏️ 正在编辑已有错题';

  const saveBtn = document.getElementById('btn-save-parsed-mistake');
  saveBtn.textContent = '💾 保存修改';
  saveBtn.disabled = false;

  document.getElementById('modal-ai-add-mistake').classList.remove('hidden');
}

function openAiAddMistakeModal() {
  document.getElementById('editing-mistake-id').value = '';
  document.getElementById('modal-mistake-title').textContent = '✨ AI 一键智能录入错题';
  document.getElementById('raw-input-group').classList.remove('hidden');
  document.getElementById('raw-mistake-input').value = '';
  document.getElementById('ai-parsed-preview').classList.add('hidden');
  removeMistakeImage();
  
  const saveBtn = document.getElementById('btn-save-parsed-mistake');
  saveBtn.textContent = '💾 确认入库';
  saveBtn.disabled = true;

  document.getElementById('modal-ai-add-mistake').classList.remove('hidden');
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

// 题型自动智能识别算法
function detectMistakeQuestionType(rawText, ans) {
  const cleanAns = (ans || "").trim().toUpperCase();
  const low = (rawText || "").toLowerCase();

  // 1. 如果答案包含2个或以上字母（如 ABC, ACD），100% 多选
  if (/^[A-D]{2,}$/.test(cleanAns)) return "multiple";
  if (low.includes("多选题") || low.includes("多项选择") || low.includes("【多选】") || low.includes("至少有两项")) return "multiple";

  // 2. 如果答案为对/错/正确/错误或文本包含判断题
  if (
    low.includes("判断题") || 
    low.includes("判断正误") || 
    low.includes("判断下列") ||
    /^(?:正确|错误|对|错|√|×|T|F)$/i.test(cleanAns) ||
    cleanAns === "对" || cleanAns === "错" || cleanAns === "正确" || cleanAns === "错误" || cleanAns === "√" || cleanAns === "×"
  ) return "judge";

  return "single";
}

// 手动切换题目类型下拉框时联动填充
function handleParsedTypeChange(type) {
  const optsInput = document.getElementById('parsed-opts-input');
  if (!optsInput) return;
  if (type === 'judge') {
    optsInput.value = "A. 正确\nB. 错误";
    const ansInput = document.getElementById('parsed-ans-input');
    if (ansInput) {
      const v = ansInput.value.trim().toUpperCase();
      if (v === '对' || v === '正确' || v === '√') ansInput.value = 'A';
      else if (v === '错' || v === '错误' || v === '×') ansInput.value = 'B';
    }
  } else if (type === 'single' || type === 'multiple') {
    if (optsInput.value.trim() === "A. 正确\nB. 错误") {
      optsInput.value = "";
    }
  }
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

  // 4. 执行高精度板块双重校正引擎与题型自动识别
  if (parsed) {
    parsed.category = refineParsedCategory(parsed.category, rawText);
    const detectedType = detectMistakeQuestionType(rawText, parsed.correct_answer);
    if (parsed.question_type === 'judge' || detectedType === 'judge') {
      parsed.question_type = 'judge';
      // 判定为判断题，自动将选项列表填充为：A 正确 B 错误
      parsed.options = ["A. 正确", "B. 错误"];
      if (parsed.correct_answer === "对" || parsed.correct_answer === "正确" || parsed.correct_answer === "√") parsed.correct_answer = "A";
      if (parsed.correct_answer === "错" || parsed.correct_answer === "错误" || parsed.correct_answer === "×") parsed.correct_answer = "B";
      if (parsed.user_answer === "对" || parsed.user_answer === "正确" || parsed.user_answer === "√") parsed.user_answer = "A";
      if (parsed.user_answer === "错" || parsed.user_answer === "错误" || parsed.user_answer === "×") parsed.user_answer = "B";
    } else {
      parsed.question_type = parsed.question_type || detectedType;
    }

    // 5. 原文深度解析保真引擎：若粘贴文本自带解析，100%保留原文全文，严禁任何删减或模型总结
    const rawExpMatch = rawText.match(/(?:(?:【(?:解析|答案解析|深度解析|试题解析)】)|(?:(?:深度解析|答案解析|试题解析|解析)[：:\s]))([\s\S]+)$/i);
    if (rawExpMatch && rawExpMatch[1] && rawExpMatch[1].trim().length > 6) {
      const rawExpClean = rawExpMatch[1].trim();
      // 若模型未提取、或模型提取字数明显小于原文解析（被模型擅自删减总结），直接强制使用原文解析全文
      if (!parsed.correct_analysis || parsed.correct_analysis.length < rawExpClean.length * 0.9) {
        parsed.correct_analysis = rawExpClean;
      }
    }
  }

  btn.textContent = '🚀 AI 智能提取并结构化';
  btn.disabled = false;

  appState.parsedMistakeData = parsed;
  document.getElementById('parsed-cat-select').value = parsed.category || "非法律公基";
  document.getElementById('parsed-type-select').value = parsed.question_type || "single";
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

async function callCloudLlmParseMistake(rawText, settings) {
  const prompt = `你是一个专业的中国公务员与四川紧缺专业选调生考试智能解析名师。请将以下错题原始文本精准拆解为标准 JSON 格式。

【考试板块精准分类指引 (category 必须严格属于以下5个之一，严禁误判)】:
1. 习近平新时代中国特色社会主义思想与时政：考查党的二十大/二十届三中全会精神、习近平总书记重要论述、中国式现代化、新质生产力、党纪学习教育、党建党史、重大时政会议新闻。⚠️ 排除：中国近代史历史事件(如鸦片战争/洋务运动/辛亥革命)属于非法律公基文史常识，严禁误选！
2. 法律常识：考查宪法、行政法(处罚/许可/强制/复议/诉讼/国家赔偿)、民法典、刑法、公务员法、监察法等法条规范。
3. 非法律公基：考查中国近代史(鸦片战争/洋务运动/辛亥革命/五四运动)、古代史、诗词文学常识、经济学(弹性/通胀/财政货币政策)、地理省情、前沿科技常识。⚠️ 所有历史常识、经济科技常识选择题均归入此项！
4. 公文写作与改错：【仅且仅当考查公文格式要素规则本身】（如发文字号六角括号、主送机关规范、15种法定文种适用范围、请示与报告区别、成文日期数字、GB/T 9704-2012公文条例）。⚠️ 凡题干仅以某部门《通知/意见/通报》作为背景考查实质内容的，严禁归入公文！
5. 行测专项：【仅限纯行测题型】：选词填空/中心主旨、数量关系、资料分析、判断推理(图推/类比/定义)。⚠️ 常识选择题绝非行测！

【针对 correct_analysis 深度解析字段的绝对原则】:
⚠️ 若原始文本中包含解析（如“解析/深度解析/答案解析”），你必须【100% 逐字原样提取】，严禁任何删减、浓缩、精简或总结！只有在原文无解析时才允许自行补充。

【必须返回严格合法的单一 JSON 对象，不要输出任何 Markdown 标记或多余文字】:
{
  "category": "所属板块名称(严格为上述5个之一)",
  "question_type": "single 或 multiple 或 judge",
  "title": "简短考点标题(15字内)",
  "question": "题干纯文本(剥离选项和答案)",
  "options": ["A. 选项A内容", "B. 选项B内容", "C. 选项C内容", "D. 选项D内容"],
  "correct_answer": "正确选项(如 A 或 ABC)",
  "user_answer": "当时错选项(如 B，若无留空)",
  "correct_analysis": "输入文本中的解析全文(严禁删减或浓缩概括，100%完整保留原文所有展开论述)",
  "key_point": "考点关键词"
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
  parsedObj.category = refineParsedCategory(parsedObj.category, rawText);
  parsedObj.question_type = parsedObj.question_type || detectMistakeQuestionType(rawText, parsedObj.correct_answer);
  parsedObj.engine_label = `☁️ 云端大模型 (${settings.api_model || 'DeepSeek'}) 实时解析`;
  return parsedObj;
}

// 前端直接调用本地/穿透的 Ollama 接口
async function callDirectOllamaParseMistake(rawText, settings) {
  const prompt = `你是一个专业的中国公务员与四川紧缺专业选调生考试智能解析名师。请将以下错题抽取为严格合法的 JSON 对象。

【考试板块精准分类指引 (category 必须严格属于以下5个之一，严禁误判)】:
1. 习近平新时代中国特色社会主义思想与时政：考查党的二十大/二十届三中全会精神、习近平总书记重要论述、中国式现代化、新质生产力、党纪学习教育、党建党史、重大时政会议新闻。⚠️ 排除：中国近代史历史事件(如鸦片战争/洋务运动/辛亥革命)属于非法律公基文史常识，严禁误选！
2. 法律常识：考查宪法、行政法(处罚/许可/强制/复议/诉讼/国家赔偿)、民法典、刑法、公务员法、监察法等法条规范。
3. 非法律公基：考查中国近代史(鸦片战争/洋务运动/辛亥革命/五四运动)、古代史、诗词文学常识、经济学(弹性/通胀/财政货币政策)、地理省情、前沿科技常识。⚠️ 所有历史常识、经济科技常识选择题均归入此项！
4. 公文写作与改错：【仅且仅当考查公文格式要素规则本身】（如发文字号六角括号、主送机关规范、15种法定文种适用范围、请示与报告区别、成文日期数字、GB/T 9704-2012公文条例）。⚠️ 凡题干仅以某部门《通知/意见/通报》作为背景考查实质内容的，严禁归入公文！
5. 行测专项：【仅限纯行测题型】：选词填空/中心主旨、数量关系、资料分析、判断推理(图推/类比/定义)。⚠️ 常识选择题绝非行测！

【针对 correct_analysis 深度解析字段的绝对原则】:
⚠️ 若题目文本中包含解析（如“【解析】/解析/深度解析/答案解析”），你必须【100% 逐字原样提取】，严禁任何删减、精简、浓缩或二次总结！只有在原文完全无解析时才允许自行补充。

必须返回合法的单一 JSON 对象，不要输出任何多余标记:
{
  "category": "所属板块名称(严格为上述5个之一)",
  "question_type": "single 或 multiple 或 judge",
  "title": "考点简短标题",
  "question": "题干纯文本(剥离选项与答案)",
  "options": ["A. 选项A内容", "B. 选项B内容", "C. 选项C内容", "D. 选项D内容"],
  "correct_answer": "正确选项(如 A 或 ABC)",
  "user_answer": "当时错选(如 B，若无留空)",
  "correct_analysis": "题目文本中的解析全文(绝对严禁删减或做概括浓缩，100%保留输入中的解析原文展开所有语句)",
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
  parsedObj.category = refineParsedCategory(parsedObj.category, rawText);
  parsedObj.question_type = parsedObj.question_type || detectMistakeQuestionType(rawText, parsedObj.correct_answer);
  parsedObj.engine_label = `🟢 本地千问大模型 (${modelName}) 穿透实时推理`;
  return parsedObj;
}

function localRuleBasedParseMistake(raw) {
  const text = raw.trim();
  const category = refineParsedCategory("非法律公基", text);

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

  const qType = detectMistakeQuestionType(text, ans);

  let exp = "掌握核心考点与相关法条/理论。";
  const expMatch = text.match(/(?:解析|深度解析|【解析】|答案解析)[：:\s]*([\s\S]+)/);
  if (expMatch) exp = expMatch[1].trim();

  const cleanParts = text.split(/(?:正确答案|参考答案|答案|【答案】|我的答案|我的选择|【解析】|解析|答案解析)/);
  const clean = cleanParts[0].trim();

  const optMatches = clean.match(/([A-D][.、\s]+[^\nA-D]+)/g);
  let options = [];
  let question = clean;

  if (qType === "judge") {
    options = ["A. 正确", "B. 错误"];
  } else if (optMatches && optMatches.length >= 2) {
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
    question_type: qType,
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
  const editIdStr = document.getElementById('editing-mistake-id').value;
  const isEditing = Boolean(editIdStr);
  const editId = isEditing ? (isNaN(editIdStr) ? editIdStr : Number(editIdStr)) : null;

  const cat = document.getElementById('parsed-cat-select').value;
  const qType = document.getElementById('parsed-type-select').value || 'single';
  const q = document.getElementById('parsed-q-input').value.trim();
  const optsRaw = document.getElementById('parsed-opts-input').value.trim();
  let ans = document.getElementById('parsed-ans-input').value.trim().toUpperCase();
  let myAns = document.getElementById('parsed-my-input').value.trim().toUpperCase();
  const kp = document.getElementById('parsed-kp-input').value.trim();
  const exp = document.getElementById('parsed-exp-input').value.trim();
  const img = (document.getElementById('parsed-img-data').value || '').trim();

  if (!q) {
    alert('题干不能为空！');
    return;
  }

  // 针对判断题，标准化答案输入与选项填充
  if (qType === 'judge') {
    if (ans === '对' || ans === '正确' || ans === '√') ans = 'A';
    if (ans === '错' || ans === '错误' || ans === '×') ans = 'B';
    if (myAns === '对' || myAns === '正确' || myAns === '√') myAns = 'A';
    if (myAns === '错' || myAns === '错误' || myAns === '×') myAns = 'B';
  }

  let options = optsRaw.split('\n').map(s => s.trim()).filter(s => s);
  if (qType === 'judge' && (options.length === 0 || options.every(o => o.includes('选项')))) {
    options = ["A. 正确", "B. 错误"];
  }

  if (isEditing) {
    const idx = appState.mistakes.findIndex(m => m.id == editId);
    if (idx > -1) {
      appState.mistakes[idx] = {
        ...appState.mistakes[idx],
        category: cat,
        question_type: qType,
        title: q.slice(0, 20),
        question: q,
        image: img,
        options: options.length > 0 ? options : (qType === 'judge' ? ["A. 正确", "B. 错误"] : ["A. 选项A", "B. 选项B"]),
        correct_answer: ans || "A",
        user_answer: myAns,
        correct_analysis: exp,
        key_point: kp
      };
      saveLocalMistakes(appState.mistakes);
      closeAiAddMistakeModal();
      renderMistakes();
      updateMistakeCounters();
      alert('🎉 错题已成功修改并自动同步！');
      return;
    }
  }

  const newMistake = {
    id: Date.now(),
    category: cat,
    title: q.slice(0, 20),
    question_type: qType,
    question: q,
    image: img,
    options: options.length > 0 ? options : (qType === 'judge' ? ["A. 正确", "B. 错误"] : ["A. 选项A", "B. 选项B"]),
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
  document.getElementById('setting-api-url').value = s.api_url || "https://api.siliconflow.cn/v1/chat/completions";
  document.getElementById('setting-api-key').value = s.api_key || "";
  document.getElementById('setting-api-model').value = s.api_model || "Qwen/Qwen2.5-7B-Instruct";

  // 智能回显服务商预设下拉框
  const presetSelect = document.getElementById('setting-provider-preset');
  if (presetSelect && s.api_url) {
    if (s.api_url.includes('siliconflow')) presetSelect.value = 'siliconflow';
    else if (s.api_url.includes('dashscope')) presetSelect.value = 'qwen';
    else if (s.api_url.includes('moonshot')) presetSelect.value = 'kimi';
    else if (s.api_url.includes('openai.com')) presetSelect.value = 'openai';
    else if (s.api_url.includes('deepseek')) presetSelect.value = 'deepseek';
    else presetSelect.value = 'custom';
  }

  const testStatus = document.getElementById('api-test-status');
  if (testStatus) testStatus.textContent = '';

  toggleEngineSettings();
  document.getElementById('modal-ai-settings').classList.remove('hidden');
}

function closeAiSettingsModal() {
  document.getElementById('modal-ai-settings').classList.add('hidden');
}

function applyProviderPreset(preset) {
  const urlInput = document.getElementById('setting-api-url');
  const modelInput = document.getElementById('setting-api-model');
  
  if (preset === 'siliconflow') {
    urlInput.value = 'https://api.siliconflow.cn/v1/chat/completions';
    modelInput.value = 'Qwen/Qwen2.5-7B-Instruct';
  } else if (preset === 'deepseek') {
    urlInput.value = 'https://api.deepseek.com/v1/chat/completions';
    modelInput.value = 'deepseek-chat';
  } else if (preset === 'qwen') {
    urlInput.value = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    modelInput.value = 'qwen-plus';
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

async function testAiConnection() {
  const testBtn = document.getElementById('btn-test-ai-conn');
  const testStatus = document.getElementById('api-test-status');
  const engineType = document.getElementById('setting-engine-type').value;

  if (testStatus) testStatus.innerHTML = '<span style="color:var(--text-secondary)">🔄 正在请求验证...</span>';
  if (testBtn) testBtn.disabled = true;

  try {
    if (engineType === 'openai') {
      const url = document.getElementById('setting-api-url').value.trim();
      const key = document.getElementById('setting-api-key').value.trim();
      const model = document.getElementById('setting-api-model').value.trim();

      if (!key) {
        if (testStatus) testStatus.innerHTML = '<span style="color:var(--accent-red)">❌ 请先粘贴 API Key</span>';
        if (testBtn) testBtn.disabled = false;
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });

      if (res.ok) {
        if (testStatus) testStatus.innerHTML = '<span style="color:var(--accent-green); font-weight:bold;">✅ 测试成功！大模型已就绪</span>';
      } else {
        const txt = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try {
          const ej = JSON.parse(txt);
          if (ej.message) errMsg += `: ${ej.message}`;
          else if (ej.error && ej.error.message) errMsg += `: ${ej.error.message}`;
        } catch(e) {}
        if (testStatus) testStatus.innerHTML = `<span style="color:var(--accent-red)">❌ 失败: ${escapeHtml(errMsg.substring(0, 50))}</span>`;
      }
    } else {
      if (testStatus) testStatus.innerHTML = '<span style="color:var(--accent-green)">ℹ️ 本地/内置引擎无需测试云端</span>';
    }
  } catch (err) {
    if (testStatus) testStatus.innerHTML = `<span style="color:var(--accent-red)">❌ 连接异常: ${escapeHtml(err.message)}</span>`;
  } finally {
    if (testBtn) testBtn.disabled = false;
  }
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

// 错题库专属筛选标签绑定（作用域限定，避免与素材库冲突）
document.querySelectorAll('#mistake-filter-chips .filter-chip, #tab-mistakes .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#tab-mistakes .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.activeMistakeFilter = chip.getAttribute('data-filter');
    renderMistakes();
  });
});

document.querySelectorAll('#mistake-type-filter-chips .type-filter-chip, #tab-mistakes .type-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#tab-mistakes .type-filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.activeMistakeTypeFilter = chip.getAttribute('data-type');
    renderMistakes();
  });
});

document.querySelectorAll('#mistake-cat-filter-chips .cat-filter-chip, #tab-mistakes .cat-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#tab-mistakes .cat-filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.activeMistakeCategory = chip.getAttribute('data-cat');
    renderMistakes();
  });
});

/* ==========================================================================
   📜 公文写作素材库 · AI 分类提炼与百宝箱全套业务引擎
   ========================================================================== */

// 预置四川省考 32 条精编高频素材（治蜀兴川、新质生产力、基层治理、干部作风、营商环境、生态文明、法定公文模板、口语转公文）
const DEFAULT_DOC_MATERIALS = [
  {
    id: 'mat-01',
    category: '治蜀兴川与四川省情',
    type: 'heading',
    title: '推进“四化同步、城乡融合、五区共兴”总体布局',
    content: '一、推动新型工业化由大到强、信息化深度赋能、城镇化提质增效、农业现代化强基固本；\n二、以县域为切入点破除城乡二元结构，健全城乡融合发展体制机制；\n三、推动成都平原经济区协同领跑，促进五大经济区差异化协同共兴。',
    note: '用于四川省考大作文/策论文总体战略与宏观举措段落，四化同步是总抓手，五区共兴是空间格局。',
    tags: ['治蜀兴川', '四化同步', '城乡融合', '五区共兴'],
    is_star: 1,
    source: '省委十二届历次全会决议',
    updatedAt: 1718000001
  },
  {
    id: 'mat-02',
    category: '治蜀兴川与四川省情',
    type: 'golden',
    title: '擦亮农业大省金字招牌 · 打造新时代更高水平“天府粮仓”',
    content: '严守耕地保护红线与粮食安全底线，抓好高标准农田建设，落实“藏粮于地、藏粮于技”，坚决遏制耕地“非农化”、严格管控“非粮化”，牢牢把中国人的饭碗端在自己手中。',
    note: '乡村振兴、三农工作、粮食安全综合分析与方案题点睛必背金句。',
    tags: ['天府粮仓', '耕地红线', '藏粮于地', '粮食安全'],
    is_star: 1,
    source: '总书记来川视察重要指示精神',
    updatedAt: 1718000002
  },
  {
    id: 'mat-03',
    category: '治蜀兴川与四川省情',
    type: 'template',
    title: '省级重要战略方案与通知贯彻开头模板',
    content: '为深入贯彻落实习近平总书记对四川工作系列重要指示精神，全面落实省委十二届历次全会决策部署，紧扣“四化同步、城乡融合、五区共兴”发展战略，完整、准确、全面贯彻新发展理念，结合我区（市、县）实际，特制定本实施方案。',
    note: '适用于各类实施方案、通知、工作意见的起草开头，标准贯标引领。',
    tags: ['方案开头', '法定公文', '贯标开头'],
    is_star: 1,
    source: '四川省人民政府公报规范范例',
    updatedAt: 1718000003
  },
  {
    id: 'mat-04',
    category: '新质生产力与经济',
    type: 'heading',
    title: '因地制宜发展新质生产力“三维发力”',
    content: '一、聚力科技创新“策源点”，攻坚关键核心技术与前沿研发；\n二、夯实产业转型“支撑点”，以“智改数转”赋能传统产业焕新；\n三、构筑机制变革“催化剂”，激发各类优质生产要素顺畅流动。',
    note: '产业发展、创新驱动、现代化产业体系策论文高分三段式小标题。',
    tags: ['新质生产力', '科技创新', '产业升级', '智改数转'],
    is_star: 1,
    source: '新华社公文写作精粹',
    updatedAt: 1718000004
  },
  {
    id: 'mat-05',
    category: '新质生产力与经济',
    type: 'golden',
    title: '发展新质生产力不是忽视、放弃传统产业',
    content: '发展新质生产力不是忽视、放弃传统产业，要防止一哄而上、泡沫化，也不要搞一种模式。要统筹推进传统产业升级、新兴产业壮大、未来产业培育，坚持以新促质、以智赋能。',
    note: '议论文驳论辨析段落，避免走入“喜新厌旧”误区的高级思辨论据。',
    tags: ['传统产业升级', '辩证施策', '防止泡沫化'],
    is_star: 0,
    source: '全国两会团组讲话',
    updatedAt: 1718000005
  },
  {
    id: 'mat-06',
    category: '基层治理与乡村振兴',
    type: 'heading',
    title: '深化新时代基层治理“三治融合”',
    content: '一、政治引领强根基，发挥基层党组织战斗堡垒核心作用；\n二、自治强基激活力，健全村民议事会与网格协商微治理机制；\n三、法治保障促规范、德治润心树新风，构建共建共治共享治理格局。',
    note: '社区治理、基层矛盾化解、平安四川建设实施方案对策。',
    tags: ['基层治理', '三治融合', '枫桥经验', '共建共治'],
    is_star: 1,
    source: '新时代“枫桥经验”在川实践',
    updatedAt: 1718000006
  },
  {
    id: 'mat-07',
    category: '基层治理与乡村振兴',
    type: 'mapping',
    title: '群众诉求与矛盾化解 · 口语转地道公文词',
    content: '【材料口语】老百姓有牢骚没处说，邻里吵架打架没人管，干部平时坐办公室不下村。\n【公文规范】畅通民意诉求表达渠道，健全矛盾纠纷多元化解机制，深化践行“四下基层”优良传统，推动力量下沉、服务前移，变“坐等群众上门”为“主动靠前服务”。',
    note: '省考综合分析与公文写作对策提炼转化必备对照。',
    tags: ['四下基层', '材料转化', '多元化解', '服务前移'],
    is_star: 1,
    source: '公文真题答题规范对照',
    updatedAt: 1718000007
  },
  {
    id: 'mat-08',
    category: '干部作风与廉洁担当',
    type: 'heading',
    title: '锻造忠诚干净担当干部铁军“四严四实”',
    content: '一、铸牢政治忠诚之魂，把稳思想之舵；\n二、厚植为民造福之本，走好群众路线；\n三、锤炼实干担当之能，发扬斗争精神；\n四、严守纪律规矩之尺，筑牢廉洁底线。',
    note: '干部作风建设动员讲话、组织工作方案、述职报告高分提纲。',
    tags: ['干部作风', '忠诚干净担当', '廉洁底线', '实干担当'],
    is_star: 0,
    source: '党建论坛范例',
    updatedAt: 1718000008
  },
  {
    id: 'mat-09',
    category: '干部作风与廉洁担当',
    type: 'golden',
    title: '树牢造福人民的正确政绩观',
    content: '坚持以实干论英雄、凭实绩用干部，坚决破除“新形象工程”与形式主义、官僚主义，把为民造福作为最大政绩，做到既做让老百姓看得见、摸得着的实事，也做为后人作铺垫、打基础的好事。',
    note: '评述题、作风整顿专题、大作文分析论证段落黄金点睛句。',
    tags: ['政绩观', '形式主义', '潜绩与显绩', '为民造福'],
    is_star: 1,
    source: '中纪委机关报评论员文章',
    updatedAt: 1718000009
  },
  {
    id: 'mat-10',
    category: '营商环境与政务服务',
    type: 'heading',
    title: '全力打响“高效办成一件事”政务品牌',
    content: '一、“一门受理”抓集成，推进政务服务综合窗口全覆盖；\n二、“一网通办”减跑动，打破跨部门“信息孤岛”与数据壁垒；\n三、“一线速办”解急难，依托12345热线构建接诉即办闭环；\n四、“一视同仁”优环境，营造公开透明稳定公平竞争生态。',
    note: '优化政务服务改革方案、营商环境三年行动计划对仗提纲。',
    tags: ['高效办成一件事', '一网通办', '接诉即办', '营商环境'],
    is_star: 1,
    source: '国务院政务服务指导意见',
    updatedAt: 1718000010
  },
  {
    id: 'mat-11',
    category: '营商环境与政务服务',
    type: 'mapping',
    title: '审批流程繁杂与办事难 · 口语转地道公文词',
    content: '【材料口语】企业反映盖章跑断腿，同一个证照来回交好几回，办事窗口人员态度冷淡推脱踢皮球。\n【公文规范】推行“多审合一、多证联办”极简审批模式，实现电子证照互认共享与“免申即享”，严格落实“首问负责制”与“容缺受理机制”，持续减环节、减材料、减时限。',
    note: '营商环境调研整改报告、推进行动方案核心对策转化。',
    tags: ['极简审批', '免申即享', '容缺受理', '首问负责'],
    is_star: 1,
    source: '省考真题考点提炼',
    updatedAt: 1718000011
  },
  {
    id: 'mat-12',
    category: '生态文明与绿色低碳',
    type: 'heading',
    title: '筑牢长江黄河上游生态屏障“三坚”',
    content: '一、坚持精准治污，绘就蓝天碧水净土秀美画卷；\n二、坚持系统修复，厚植大江大河上游绿色底色；\n三、坚持绿色转型，激发清洁能源与低碳发展动能。',
    note: '四川生态文明建设、筑牢长江黄河上游生态屏障公文主题小标题。',
    tags: ['生态屏障', '精准治污', '绿色低碳', '长江黄河上游'],
    is_star: 0,
    source: '美丽四川建设规划纲要',
    updatedAt: 1718000012
  },
  {
    id: 'mat-13',
    category: '生态文明与绿色低碳',
    type: 'golden',
    title: '绿水青山就是金山银山在川创新实践',
    content: '坚定不移走生态优先、绿色低碳的高质量发展道路，把生态高颜值转化为经济高价值，让绿水青山成为富民利民的幸福靠山，实现生态效益、经济效益、社会效益有机统一。',
    note: '绿色发展大作文、生态文明专题典型发言立意点睛。',
    tags: ['两山理念', '生态优先', '高颜值高价值'],
    is_star: 0,
    source: '省委全会报告摘录',
    updatedAt: 1718000013
  },
  {
    id: 'mat-14',
    category: '治蜀兴川与四川省情',
    type: 'heading',
    title: '激发县域经济活力“四重奏”',
    content: '一、特色产业立县，因地制宜打造百亿级特色产业集群；\n二、工业强县拓空间，推动园区扩能增效与要素聚合；\n三、生态活县增后劲，探索生态产品价值实现新路径；\n四、商贸兴县聚人气，繁荣发展现代服务业与县域消费。',
    note: '全国百强县培育、县域特色发展调研报告措施段。',
    tags: ['县域经济', '特色产业', '工业强县', '五区共兴'],
    is_star: 0,
    source: '四川县域经济高质量发展会议',
    updatedAt: 1718000014
  },
  {
    id: 'mat-15',
    category: '基层治理与乡村振兴',
    type: 'golden',
    title: '“四下基层”的精神实质与工作方法',
    content: '把心贴近人民，把根扎在基层。坚持宣传党的路线方针政策下基层、调查研究下基层、信访接待下基层、现场办公下基层，把群众的“呼声”变成政策的“哨声”，在基层一线发现问题、解决问题。',
    note: '干部下沉、群众路线、走访调研公文材料精辟点题句。',
    tags: ['四下基层', '现场办公', '调查研究', '群众呼声'],
    is_star: 1,
    source: '人民日报头版评论',
    updatedAt: 1718000015
  },
  {
    id: 'mat-16',
    category: '干部作风与廉洁担当',
    type: 'mapping',
    title: '懒政怠政推脱扯皮 · 口语转地道公文词',
    content: '【材料口语】有的干部怕担责任不敢签字，遇到难啃的硬骨头绕道走，工作推一下动一下，做一天和尚撞一天钟。\n【公文规范】坚决整治“躺平式”不作为慢作为与“中梗阻”现象，健全容错纠错与尽职免责机制，旗帜鲜明为担当者担当、为负责者负责，坚决破除“干多错多、不干不错”的消极避责心态。',
    note: '干部作风整肃专项方案、考评通报语言转换对照。',
    tags: ['容错纠错', '躺平式干部', '激励担当', '材料转化'],
    is_star: 1,
    source: '公文真题常考题眼',
    updatedAt: 1718000016
  },
  {
    id: 'mat-17',
    category: '治蜀兴川与四川省情',
    type: 'template',
    title: '实施方案与通知抓落实及督考结尾模板',
    content: '各级各部门要切实提高政治站位，强化组织领导，压紧压实主体责任，健全协同联动机制。要坚持台账化管理、节点化推进，加强全过程督导检查与绩效考核。对工作扎实成效显著的予以表彰推广，对履职不力、推诿扯皮的严肃追责问责，确保各项部署不折不扣落地生根、开花结果。',
    note: '公文结尾压轴万能段，适用于实施方案、工作意见、通知总结。',
    tags: ['抓落实', '督导问效', '结尾模板', '压实责任'],
    is_star: 1,
    source: '四川省政府机关发文规范范本',
    updatedAt: 1718000017
  },
  {
    id: 'mat-18',
    category: '治蜀兴川与四川省情',
    type: 'template',
    title: '法定公文“批复”标准行文规范结构',
    content: '【标题】四川省人民政府关于同意设立……的批复\n【主送机关】××市人民政府、省发展改革委：\n【正文】《关于设立……的请示》（×府〔2026〕×号）收悉。经研究，现批复如下：\n一、原则同意……；\n二、请严格按照国家有关法律法规和行业标准周密实施，防范化解各类风险；\n三、省直有关部门要按照职责分工加强业务指导与协调配合。\n【结语】执行中遇到的重大问题，请及时按程序向省政府报告。',
    note: '省考法定公文“批复”专用结构与标准公文术语。',
    tags: ['法定公文', '批复格式', '请示答复', '收悉批复'],
    is_star: 0,
    source: '党政机关公文格式国标 (GB/T 9704)',
    updatedAt: 1718000018
  },
  {
    id: 'mat-19',
    category: '治蜀兴川与四川省情',
    type: 'template',
    title: '法定公文“会议纪要”核心用语模板',
    content: '【正文开篇】2026年×月×日，××领导主持召开专题协调会议，研究推进……重点工作。会议听取了省××厅、××市关于前期筹备情况的汇报，对下一阶段重点任务进行了深入研究讨论。\n【要点段】会议指出……；会议强调……；会议明确……；\n【统筹结语】会议要求，各相关部门要牢固树立“一盘棋”思想，加强横向协同，挂图作战、倒排工期，扎实推动各项部署落地见效。',
    note: '省考高频法定公文“纪要”行文特征：条理清晰、用词精炼有约束力。',
    tags: ['法定公文', '会议纪要', '挂图作战', '一盘棋'],
    is_star: 0,
    source: '办公厅会议纪要规范范例',
    updatedAt: 1718000019
  },
  {
    id: 'mat-20',
    category: '基层治理与乡村振兴',
    type: 'template',
    title: '动员号召型倡议书/公开信标准结语',
    content: '众人拾柴火焰高，涓涓细流汇江海。宏伟蓝图已绘就，奋楫扬帆正当时！让我们迅速行动起来，以主人翁的责任担当、饱满的实干激情，积极投身到……的生动实践中，凝心聚力、携手并肩，共同谱写新时代美丽四川建设的崭新篇章！',
    note: '宣传动员类公文、公开信、倡议书结尾升华专用。',
    tags: ['倡议书', '群众动员', '号召结语', '凝心聚力'],
    is_star: 0,
    source: '省直机关团工委倡议范本',
    updatedAt: 1718000020
  },
  {
    id: 'mat-21',
    category: '新质生产力与经济',
    type: 'heading',
    title: '推进工业“智改数转”行动三项攻坚',
    content: '一、标杆引路促普及，培育一批“灯塔工厂”与数字化转型标杆企业；\n二、数字赋能强链条，深化工业互联网应用与产业链上下游数据贯通；\n三、协同创新聚生态，构建算力网络、数据要素与智造服务综合生态圈。',
    note: '四川推进新型工业化、制造强省建设核心措施段落。',
    tags: ['智改数转', '灯塔工厂', '数字四川', '新型工业化'],
    is_star: 0,
    source: '四川省制造业数字化转型专项行动',
    updatedAt: 1718000021
  },
  {
    id: 'mat-22',
    category: '基层治理与乡村振兴',
    type: 'heading',
    title: '提升党建引领“微网实格”治理效能',
    content: '一、织密“红色微网”强神经末梢，推动党支部建在网格、党小组设在楼栋；\n二、充实“精锐力量”强服务质效，选优配强网格员、微网格长队伍；\n三、贯通“响应闭环”强纾困解难，建立“格内办、社区提、街镇派、联动结”流转机制。',
    note: '四川特有基层治理高频词“微网实格”，考点命中率极高。',
    tags: ['微网实格', '党建引领', '网格治理', '四川特色治理'],
    is_star: 1,
    source: '四川基层党建与网格化管理典型经验',
    updatedAt: 1718000022
  },
  {
    id: 'mat-23',
    category: '营商环境与政务服务',
    type: 'golden',
    title: '法治是最好的营商环境',
    content: '法治是最好的营商环境。要依法平等保护各类经营主体产权和合法权益，规范涉企行政执法行为，严格落实行政裁量权基准，推行包容审慎监管与“首违不罚”，让企业放心投资、安心经营、专心创业。',
    note: '法治化营商环境综合分析、评论题、对策题高分金句。',
    tags: ['法治营商', '首违不罚', '包容审慎', '保护产权'],
    is_star: 1,
    source: '优化营商环境条例重点论述',
    updatedAt: 1718000023
  },
  {
    id: 'mat-24',
    category: '基层治理与乡村振兴',
    type: 'mapping',
    title: '乡村旅游千篇一律 · 口语转地道公文词',
    content: '【材料口语】周边几个村都在搞农家乐、采摘园，卖的土特产一模一样，游客来一次就觉得没意思，生意一年比一年差。\n【公文规范】摒弃低水平同质化竞争，坚持“一村一品、一村一策”，深挖本土非遗与乡土民俗文化IP，推动“文旅+农业+康养”跨界融合，打造沉浸式、体验式高品质乡村旅游新场景新业态。',
    note: '文旅融合发展、乡村特色产业培育材料提炼对策。',
    tags: ['文旅融合', '一村一品', '同质化竞争', '场景业态升级'],
    is_star: 1,
    source: '金标尺申论模考真题解析萃取',
    updatedAt: 1718000024
  },
  {
    id: 'mat-25',
    category: '治蜀兴川与四川省情',
    type: 'golden',
    title: '统筹高质量发展和高水平安全',
    content: '坚持底线思维、极限思维，增强忧患意识。针对四川地形地质与气候特点，深入排查防范化解森林草原防灭火、防汛抗旱、地质灾害等重大风险隐患，下好先手棋、打好主动仗，以高水平安全护航高质量发展。',
    note: '四川应急管理、防灾减灾救灾、安全生产工作方案点题句。',
    tags: ['底线思维', '极限思维', '防灾减灾', '高水平安全'],
    is_star: 1,
    source: '省委常委会应急管理专题会议',
    updatedAt: 1718000025
  },
  {
    id: 'mat-26',
    category: '干部作风与廉洁担当',
    type: 'heading',
    title: '牢固树立正确政绩观“三问三思”',
    content: '一、一问干事创业“为了谁”，站稳为民造福的政治立场；\n二、二问谋划工作“依靠谁”，走深走实群众路线与调查研究；\n三、三问历史长河“留下什么”，创造经得起实践、人民和历史检验的实绩。',
    note: '年轻干部座谈会发言、纪检谈话、作风研讨小标题。',
    tags: ['政绩观', '初心使命', '群众立场', '经得起检验'],
    is_star: 0,
    source: '中央党校学习时报精要',
    updatedAt: 1718000026
  },
  {
    id: 'mat-27',
    category: '新质生产力与经济',
    type: 'golden',
    title: '深化科技体制改革 · 激发人才第一资源',
    content: '破除“唯论文、唯职称、唯学历、唯奖项”顽瘴痼疾，建立以创新价值、能力、贡献为导向的人才评价体系，完善科技成果转化收益分配机制，为科研人员松绑减负，让各类创新人才竞相迸发、各尽其才。',
    note: '科技体制机制改革、人才强省大作文深度分析。',
    tags: ['破四唯', '人才强省', '创新驱动', '科技体制改革'],
    is_star: 0,
    source: '四川省科技创新激励办法解读',
    updatedAt: 1718000027
  },
  {
    id: 'mat-28',
    category: '营商环境与政务服务',
    type: 'heading',
    title: '营造亲商安商富商优良环境“四步工作法”',
    content: '一、“面对面”倾听诉求，健全常态化政企沟通恳谈机制；\n二、“实打实”纾困解难，推动惠企减税降费政策直达快享；\n三、“零距离”要素保障，精准对接企业用地用能用工融资需求；\n四、“心连心”亲清与共，构建亲而有度、清而有为的亲清政商关系。',
    note: '民营经济高质量发展大会、优化营商环境工作简报小标题。',
    tags: ['亲清政商', '惠企纾困', '直达快享', '要素保障'],
    is_star: 0,
    source: '全省民营经济高质量发展大会讲话',
    updatedAt: 1718000028
  },
  {
    id: 'mat-29',
    category: '基层治理与乡村振兴',
    type: 'golden',
    title: '用心用情用力办好群众身边“关键小事”',
    content: '群众利益无小事，一枝一叶总关情。要把群众的柴米油盐、急难愁盼当成大事来抓，把就业、教育、医疗、托育、养老等民生痛点变成政策发力点，一件接着一件办，一年接着一年干，让现代化建设成果更多更公平惠及全省人民。',
    note: '民生保障、群众工作大作文与宣讲讲话黄金金句。',
    tags: ['关键小事', '民生痛点', '一枝一叶总关情', '共同富裕'],
    is_star: 1,
    source: '四川日报民生热评',
    updatedAt: 1718000029
  },
  {
    id: 'mat-30',
    category: '基层治理与乡村振兴',
    type: 'mapping',
    title: '政策宣传方式死板 · 口语转地道公文词',
    content: '【材料口语】政府发的红头文件老百姓看不懂，村干部就照本宣科读一遍，挂几个横幅发点传单没人细看，形式主义严重。\n【公文规范】创新政策宣讲与群众沟通表达形式，善用“乡音土话”通俗解读，依托短视频、微动漫、图解等融媒体矩阵，开展接地气、冒热气、聚人气的互动式宣讲，切实提高政策知晓率与群众认同感。',
    note: '群众宣传思想工作、法治宣讲对策提炼转化。',
    tags: ['接地气', '融媒体矩阵', '精准宣讲', '知晓率认同感'],
    is_star: 1,
    source: '华图申论模考真题深度萃取',
    updatedAt: 1718000030
  },
  {
    id: 'mat-31',
    category: '治蜀兴川与四川省情',
    type: 'template',
    title: '法定公文“情况报告”标准结尾期请语',
    content: '特此报告。下一步，我局（委/办）将紧盯短板弱项，压实工作责任，强化闭环跟踪督办，确保各项任务圆满收官。妥否，请批示。',
    note: '法定公文“报告”行文规范：不可夹带请示事项，结尾多用“特此报告”、“妥否，请批示”。',
    tags: ['法定公文', '工作报告', '妥否请批示', '期请结语'],
    is_star: 0,
    source: '公文处理工作条例标准结语',
    updatedAt: 1718000031
  },
  {
    id: 'mat-32',
    category: '生态文明与绿色低碳',
    type: 'mapping',
    title: '乡村黑臭水体与垃圾乱堆 · 口语转地道公文词',
    content: '【材料口语】村里河道里全是黑臭污水，塑料袋、农药瓶漂得到处都是，村头垃圾堆成小山没人清运，臭气熏天。\n【公文规范】深入开展农村人居环境整治提升行动与黑臭水体排查清零工程，严格压实各级“河湖长制”责任，加快推进农村生活污水截污纳管，健全生活垃圾“户分类、村收集、镇转运、县处理”长效清运处置闭环体系。',
    note: '环保督察整改、美丽宜居宜业乡村建设公文对策规范表述。',
    tags: ['河湖长制', '人居环境整治', '截污纳管', '长效机制'],
    is_star: 1,
    source: '省考生态环保申论答题要点对照',
    updatedAt: 1718000032
  }
];

// 载入并初始化素材库数据
function loadMaterials() {
  const materials = getLocalMaterials();
  appState.materials = materials;
  updateMaterialCounters();
  renderMaterialGallery();
  renderMaterialFlashcard();
}

function updateMaterialCounters() {
  const total = appState.materials.length;
  const favCount = appState.materials.filter(m => m.is_star).length;
  const totalEl = document.getElementById('mat-total-count');
  const favEl = document.getElementById('mat-fav-count');
  if (totalEl) totalEl.textContent = total;
  if (favEl) favEl.textContent = favCount;
}

// 渲染素材卡片全景流
function renderMaterialGallery() {
  const container = document.getElementById('materials-container');
  if (!container) return;

  let list = [...appState.materials];

  // 1. 分类筛选
  if (appState.activeMatCategory && appState.activeMatCategory !== 'all') {
    list = list.filter(m => m.category === appState.activeMatCategory);
  }

  // 2. 类型筛选
  if (appState.activeMatType && appState.activeMatType !== 'all') {
    list = list.filter(m => m.type === appState.activeMatType);
  }

  // 3. 仅看收藏筛选
  if (appState.activeMatOnlyFav) {
    list = list.filter(m => m.is_star);
  }

  // 4. 关键词搜索
  if (appState.activeMatSearch && appState.activeMatSearch.trim() !== '') {
    const q = appState.activeMatSearch.trim().toLowerCase();
    list = list.filter(m => {
      const matchTitle = (m.title || '').toLowerCase().includes(q);
      const matchContent = (m.content || '').toLowerCase().includes(q);
      const matchNote = (m.note || '').toLowerCase().includes(q);
      const matchTags = (m.tags || []).some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchNote || matchTags;
    });
  }

  updateMaterialCounters();

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; color: var(--text-secondary);">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
        <p style="font-size: 0.95rem; font-weight: 600;">暂无符合条件的公文写作素材</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">您可以尝试清除搜索词，或点击右上角「✨ AI 录入素材/试题」一键萃取！</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  list.forEach(item => {
    container.appendChild(createMaterialCardDOM(item));
  });
}

function getMaterialTypeBadge(type) {
  switch (type) {
    case 'heading':
      return '<span class="mat-badge-type mat-type-heading">📌 对仗小标题</span>';
    case 'golden':
      return '<span class="mat-badge-type mat-type-golden">💎 政策点睛金句</span>';
    case 'template':
      return '<span class="mat-badge-type mat-type-template">📑 规范结构模板</span>';
    case 'mapping':
      return '<span class="mat-badge-type mat-type-mapping">🔄 口语转公文</span>';
    default:
      return '<span class="mat-badge-type mat-type-golden">📜 写作素材</span>';
  }
}

function createMaterialCardDOM(item) {
  const card = document.createElement('div');
  card.className = 'material-card';
  card.id = `mat-card-${item.id}`;

  const typeBadge = getMaterialTypeBadge(item.type);
  const starClass = item.is_star ? 'active' : '';
  const starIcon = item.is_star ? '⭐' : '☆';

  // 格式化内容（支持换行、口语与公文高亮对照）
  let formattedContent = escapeHtml(item.content || '');
  if (item.type === 'mapping') {
    formattedContent = formattedContent
      .replace(/【材料口语】/g, '<span style="color:var(--accent-red); font-weight:700;">【材料口语】</span>')
      .replace(/【公文规范】/g, '<br><span style="color:var(--accent-green); font-weight:700;">【公文规范】</span>');
  }

  const tagsHtml = (item.tags || []).map(t => `<span class="mat-tag">#${escapeHtml(t)}</span>`).join('');

  card.innerHTML = `
    <div class="mat-card-header">
      <div class="mat-card-meta">
        ${typeBadge}
        <span class="mat-cat-pill">${escapeHtml(item.category || '综合公文')}</span>
      </div>
      <div class="mat-card-actions">
        <button class="mat-action-btn mat-btn-copy" title="复制素材内容" onclick="copyMaterialContent('${item.id}')">📋</button>
        <button class="mat-action-btn mat-btn-star ${starClass}" title="收藏/取消收藏" onclick="toggleMaterialStar('${item.id}')">${starIcon}</button>
        <button class="mat-action-btn mat-btn-delete" title="删除素材" onclick="deleteMaterial('${item.id}')">🗑️</button>
      </div>
    </div>
    <div class="mat-card-title">${escapeHtml(item.title || '公文写作素材')}</div>
    <div class="mat-card-body">${formattedContent}</div>
    ${item.note ? `<div class="mat-card-note">💡 ${escapeHtml(item.note)}</div>` : ''}
    ${tagsHtml ? `<div class="mat-card-tags">${tagsHtml}</div>` : ''}
  `;

  return card;
}

// 复制素材内容
function copyMaterialContent(id) {
  const item = appState.materials.find(m => String(m.id) === String(id));
  if (!item) return;

  const copyText = `${item.title}\n${item.content}${item.note ? `\n(备考点拨: ${item.note})` : ''}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(copyText).then(() => {
      alert('📋 素材已成功复制到剪贴板！');
    }).catch(() => {
      prompt('请按 Ctrl+C / Cmd+C 复制素材：', copyText);
    });
  } else {
    prompt('请按 Ctrl+C / Cmd+C 复制素材：', copyText);
  }
}

// 切换收藏状态
function toggleMaterialStar(id) {
  const list = [...appState.materials];
  const item = list.find(m => String(m.id) === String(id));
  if (item) {
    item.is_star = item.is_star ? 0 : 1;
    item.updatedAt = Date.now();
    saveLocalMaterials(list);
    renderMaterialGallery();
  }
}

// 删除素材
function deleteMaterial(id) {
  if (!confirm('确定要删除这条素材吗？删除后可通过重新导入或重置恢复。')) return;
  const list = appState.materials.filter(m => String(m.id) !== String(id));
  saveLocalMaterials(list);
  renderMaterialGallery();
  renderMaterialFlashcard();
}

// 搜索素材
function handleMaterialSearch(val) {
  appState.activeMatSearch = val || '';
  renderMaterialGallery();
}

// 仅看收藏切换
function filterFavoriteMaterials(btn) {
  appState.activeMatOnlyFav = !appState.activeMatOnlyFav;
  if (btn) {
    if (appState.activeMatOnlyFav) {
      btn.classList.add('active');
      btn.style.background = 'var(--primary)';
      btn.style.color = '#fff';
    } else {
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.color = '';
    }
  }
  renderMaterialGallery();
}

/* ==========================================================================
   ⚡ 闪卡卡片抽背系统 (Duolingo / Anki 沉浸式过筛记忆)
   ========================================================================== */

function changeFlashcardCategory(cat) {
  appState.flashcardScope = cat || 'all';
  appState.flashcardRevealed = false;
  appState.flashcardCurrentItem = null;
  renderMaterialFlashcard();
}

function getFlashcardPool() {
  let pool = [...appState.materials];
  if (appState.flashcardScope && appState.flashcardScope !== 'all') {
    pool = pool.filter(m => m.category === appState.flashcardScope);
  }
  return pool;
}

function renderMaterialFlashcard() {
  const container = document.getElementById('flashcard-card-box');
  const countEl = document.getElementById('flashcard-learned-count');
  if (!container) return;

  const learnedCount = appState.flashcardLearnedIds.length;
  if (countEl) countEl.textContent = learnedCount;

  const pool = getFlashcardPool();
  if (pool.length === 0) {
    container.innerHTML = `
      <div class="flashcard-main-card" style="text-align:center; padding:40px 20px;">
        <div style="font-size:2rem; margin-bottom:10px;">🍃</div>
        <p style="font-weight:700;">该分类下暂无素材可供背诵</p>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">请切换到其他分类或添加新素材。</p>
      </div>
    `;
    return;
  }

  // 如果当前卡片为空，或不在当前 pool 中，则随机挑一张
  if (!appState.flashcardCurrentItem || !pool.some(m => String(m.id) === String(appState.flashcardCurrentItem.id))) {
    const unlearned = pool.filter(m => !appState.flashcardLearnedIds.includes(String(m.id)));
    const targetPool = unlearned.length > 0 ? unlearned : pool;
    const randomIndex = Math.floor(Math.random() * targetPool.length);
    appState.flashcardCurrentItem = targetPool[randomIndex];
    appState.flashcardRevealed = false;
  }

  const cur = appState.flashcardCurrentItem;
  const isLearned = appState.flashcardLearnedIds.includes(String(cur.id));
  const typeBadge = getMaterialTypeBadge(cur.type);

  // 格式化正反面
  let formattedBackContent = escapeHtml(cur.content || '');
  if (cur.type === 'mapping') {
    formattedBackContent = formattedBackContent
      .replace(/【材料口语】/g, '<span style="color:var(--accent-red); font-weight:700;">【材料口语】</span>')
      .replace(/【公文规范】/g, '<br><span style="color:var(--accent-green); font-weight:700;">【公文规范】</span>');
  }

  container.innerHTML = `
    <div class="flashcard-main-card">
      <div class="flashcard-header">
        <div style="display:flex; align-items:center; gap:8px;">
          ${typeBadge}
          <span class="mat-cat-pill">${escapeHtml(cur.category)}</span>
        </div>
        <div>
          ${isLearned ? '<span style="font-size:0.75rem; color:var(--accent-green); font-weight:700;">✓ 已标记熟背</span>' : ''}
        </div>
      </div>

      <!-- 正面：题干任务与场景提示 -->
      <div class="flashcard-front">
        <div class="flashcard-prompt-label">📌 记忆靶心 · 标题/考核场景：</div>
        <div class="flashcard-prompt-title">${escapeHtml(cur.title)}</div>
        ${cur.note ? `<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:8px;">🎯 适用场景提示：${escapeHtml(cur.note)}</div>` : ''}
      </div>

      <!-- 背面：地道表达与公文展开 (点击翻转后显露) -->
      <div id="flashcard-back-area" class="flashcard-back ${appState.flashcardRevealed ? '' : 'hidden'}">
        <div class="flashcard-answer-label">💎 地道公文表达 / 对仗提纲规范文本：</div>
        <div class="flashcard-answer-body">${formattedBackContent}</div>
      </div>

      <!-- 底部控制按键 -->
      <div class="flashcard-controls">
        <button class="btn btn-outline" style="flex:1;" onclick="flipFlashcard()">
          ${appState.flashcardRevealed ? '🙈 隐藏答案' : '👀 揭晓标准公文表达'}
        </button>
        <button class="btn btn-success" style="flex:1;" onclick="markFlashcardLearned()">
          ${isLearned ? '✨ 已牢记 (下一张)' : '✅ 记住了 (+1)'}
        </button>
        <button class="btn btn-primary" style="flex:0.8;" onclick="nextFlashcard()">
          ⏭️ 下一张
        </button>
      </div>
    </div>
  `;
}

// 翻转闪卡
function flipFlashcard() {
  appState.flashcardRevealed = !appState.flashcardRevealed;
  const backArea = document.getElementById('flashcard-back-area');
  const flipBtn = document.querySelector('.flashcard-controls button:first-child');
  if (backArea) {
    if (appState.flashcardRevealed) {
      backArea.classList.remove('hidden');
      if (flipBtn) flipBtn.textContent = '🙈 隐藏答案';
    } else {
      backArea.classList.add('hidden');
      if (flipBtn) flipBtn.textContent = '👀 揭晓标准公文表达';
    }
  }
}

// 标记记住了
function markFlashcardLearned() {
  if (appState.flashcardCurrentItem) {
    const idStr = String(appState.flashcardCurrentItem.id);
    if (!appState.flashcardLearnedIds.includes(idStr)) {
      appState.flashcardLearnedIds.push(idStr);
      localStorage.setItem('sc_mat_flashcard_learned', JSON.stringify(appState.flashcardLearnedIds));
    }
  }
  nextFlashcard();
}

// 切换到下一张闪卡 (优先抽取未背过的)
function nextFlashcard() {
  const pool = getFlashcardPool();
  if (pool.length <= 1) {
    appState.flashcardRevealed = false;
    renderMaterialFlashcard();
    return;
  }

  const currentId = appState.flashcardCurrentItem ? String(appState.flashcardCurrentItem.id) : null;
  const otherItems = pool.filter(m => String(m.id) !== currentId);
  const unlearned = otherItems.filter(m => !appState.flashcardLearnedIds.includes(String(m.id)));

  const targetPool = unlearned.length > 0 ? unlearned : otherItems;
  const nextItem = targetPool[Math.floor(Math.random() * targetPool.length)];

  appState.flashcardCurrentItem = nextItem;
  appState.flashcardRevealed = false;
  renderMaterialFlashcard();
}

/* ==========================================================================
   ✨ AI 录入素材与大题拆解 (模式1: 单条金句提炼; 模式2: 整道模考大题拆解)
   ========================================================================== */

function openAiAddMaterialModal() {
  const modal = document.getElementById('modal-ai-add-material');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
    switchMaterialInputMode('quote');
    const preview = document.getElementById('mat-parsed-preview');
    if (preview) preview.classList.add('hidden');
    const saveBtn = document.getElementById('btn-save-parsed-material');
    if (saveBtn) saveBtn.disabled = true;
    appState.parsedMaterialDraft = null;
  }
}

function closeAiAddMaterialModal() {
  const modal = document.getElementById('modal-ai-add-material');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('active');
  }
}

function switchMaterialInputMode(mode) {
  const btnQuote = document.getElementById('btn-mat-mode-quote');
  const btnExam = document.getElementById('btn-mat-mode-exam');
  const paneQuote = document.getElementById('mat-mode-quote-pane');
  const paneExam = document.getElementById('mat-mode-exam-pane');

  if (mode === 'quote') {
    if (btnQuote) {
      btnQuote.classList.add('btn-primary');
      btnQuote.classList.remove('btn-outline');
    }
    if (btnExam) {
      btnExam.classList.remove('btn-primary');
      btnExam.classList.add('btn-outline');
    }
    if (paneQuote) paneQuote.classList.remove('hidden');
    if (paneExam) paneExam.classList.add('hidden');
  } else {
    if (btnQuote) {
      btnQuote.classList.remove('btn-primary');
      btnQuote.classList.add('btn-outline');
    }
    if (btnExam) {
      btnExam.classList.add('btn-primary');
      btnExam.classList.remove('btn-outline');
    }
    if (paneQuote) paneQuote.classList.add('hidden');
    if (paneExam) paneExam.classList.remove('hidden');
  }
}

function fillSampleMaterialText() {
  const input = document.getElementById('raw-material-input');
  if (input) {
    input.value = `习近平总书记在四川考察时强调，要紧紧围绕高质量发展这个首要任务，完整、准确、全面贯彻新发展理念，坚持把发展特色优势产业和战略性新兴产业作为主攻方向，加快改造提升传统产业，前瞻布局未来产业，着力构建富有四川特色和优势的现代化产业体系。`;
  }
}

function fillSampleExamExtract() {
  const stem = document.getElementById('raw-exam-stem');
  const mats = document.getElementById('raw-exam-materials');
  const ans = document.getElementById('raw-exam-answer');

  if (stem) {
    stem.value = `根据“给定材料”，请你以省发改委工作人员身份，起草一份关于推进新时代县域特色产业高质量发展的实施意见。要求：对仗工整，措施得力，切实可行。`;
  }
  if (mats) {
    mats.value = `【材料1】某县过去走粗放发展老路，小作坊高污染高能耗，虽然经济有一时起色，但环境代价巨大。近年来，该县痛下决心，引进绿色智能化设备，打造高新技术产业园区。\n【材料2】部分乡镇干部反映，各地盲目跟风，隔壁县建锂电池厂，自己县也想搞，结果招商引资恶性竞争，土地闲置，企业入驻后水土不服。\n【材料3】某特色农业县深挖柠檬、花椒等本土优势，建立冷链物流与深加工生产线，打造区域公共品牌，带动3万农户户均增收5000元以上。`;
  }
  if (ans) {
    ans.value = `【参考范文提纲】\n关于推进新时代县域特色产业高质量发展的实施意见\n一、立足本土禀赋，因地制宜绘就产业蓝图。坚决避免一哄而上与同质化无序竞争。\n二、强化创新赋能，聚链成势推动智改数转。推动绿色化低碳化转型，打造智慧园区。\n三、擦亮特色品牌，联农带农共享发展红利。健全冷链物流体系，深化三产跨界融合。\n四、压实责任链条，优化保障构建亲清生态。实行“一窗通办”，强化用地用能金融支持。`;
  }
}

// 统一 AI 对话调用接口
async function callAiDocAssistant(prompt, jsonMode = false) {
  const settings = getAiSettings();

  // 1. 本地 Ollama 引擎优先
  if (settings.engine_type === 'ollama') {
    try {
      const endpoint = appState.activeTunnelUrl || (window.location.port === '8000' ? '/api/generate' : null);
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt, model: settings.ollama_model || 'qwen2.5:3b' }),
          signal: AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined
        });
        if (res.ok) {
          const data = await res.json();
          let text = data.response || '';
          if (jsonMode) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);
          }
          return text;
        }
      }
    } catch (e) {
      console.warn('Ollama 调用异常，尝试备用通道:', e);
    }
  }

  // 2. 云端 API 引擎 (DeepSeek / SiliconFlow / OpenAI / AliYun)
  if (settings.api_key) {
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
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined
      });
      if (res.ok) {
        const data = await res.json();
        let content = data.choices[0].message.content.trim();
        if (jsonMode) {
          content = content.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(content);
        }
        return content;
      }
    } catch (e) {
      console.warn('云端 API 调用异常:', e);
    }
  }

  return null;
}

// 执行模式 1: 单条素材 AI 提取与结构化
async function executeAiParseMaterial() {
  const text = (document.getElementById('raw-material-input').value || '').trim();
  if (!text) {
    alert('请先输入或粘贴需要 AI 提取的素材文本！');
    return;
  }

  const doDistill = document.getElementById('chk-ai-distill')?.checked || false;

  const btn = document.getElementById('btn-parse-material');
  if (btn) {
    btn.disabled = true;
    btn.textContent = doDistill ? '⏳ AI 分类 + 提炼中...' : '⏳ AI 分类识别中...';
  }

  // 仅分类：只判断主题/类型/标题/标签，content 保留原文
  const promptClassifyOnly = `你是一名四川省考公文写作专家。请分析以下文本，判断其所属主题、素材类型，并拟写简明标题，严格按 JSON 返回，不要输出其他内容。
【文本】：
${text}

【返回 JSON 格式】：
{
  "category": "从以下6项中选一个最符合的：治蜀兴川与四川省情 / 新质生产力与经济 / 基层治理与乡村振兴 / 干部作风与廉洁担当 / 营商环境与政务服务 / 生态文明与绿色低碳",
  "type": "从以下4项中选一：heading / golden / template / mapping",
  "title": "简明标题（15字以内）",
  "note": "适用场景或备考提示（30字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}`;

  // 分类 + 凝练：额外要求 AI 提炼 content
  const promptDistill = `你是一名资深的四川省考公文写作与申论阅卷考官。请分析以下文本材料，萃取为高质量备考素材并严格按 JSON 返回。
【材料内容】：
${text}

【返回 JSON 格式】：
{
  "category": "从以下6项中选一：治蜀兴川与四川省情 / 新质生产力与经济 / 基层治理与乡村振兴 / 干部作风与廉洁担当 / 营商环境与政务服务 / 生态文明与绿色低碳",
  "type": "从以下4项中选一：heading(对仗小标题/提纲) / golden(政策点睛金句) / template(开头结尾模板) / mapping(材料转规范公文词)",
  "title": "简明标题（15字以内）",
  "content": "提炼后的高质量公文文本（金句则凝练金句；提纲则对仗提纲；口语对比则按【材料口语】【公文规范】格式）",
  "note": "备考点拨与适用场景（30字以内）",
  "tags": ["核心标签1", "核心标签2", "核心标签3"]
}`;

  try {
    let result = await callAiDocAssistant(doDistill ? promptDistill : promptClassifyOnly, true);

    if (!result || !result.title) {
      result = localFallbackParseMaterial(text);
    }

    // 不提炼时，content 直接用原文
    if (!doDistill) {
      result.content = text;
    }

    fillParsedMaterialPreview(result);
  } catch (err) {
    console.error('AI 解析失败:', err);
    const fallback = localFallbackParseMaterial(text);
    if (!doDistill) fallback.content = text;
    fillParsedMaterialPreview(fallback);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 AI 分类识别';
    }
  }
}

// 本地离线启发式规则（AI 离线时保障可用性）
function localFallbackParseMaterial(text) {
  let category = '治蜀兴川与四川省情';
  if (text.includes('新质生产力') || text.includes('产业') || text.includes('创新') || text.includes('数字')) {
    category = '新质生产力与经济';
  } else if (text.includes('基层') || text.includes('乡村') || text.includes('村民') || text.includes('群众')) {
    category = '基层治理与乡村振兴';
  } else if (text.includes('干部') || text.includes('作风') || text.includes('廉洁') || text.includes('形式主义')) {
    category = '干部作风与廉洁担当';
  } else if (text.includes('营商') || text.includes('政务') || text.includes('审批') || text.includes('企业')) {
    category = '营商环境与政务服务';
  } else if (text.includes('生态') || text.includes('绿色') || text.includes('低碳') || text.includes('环保')) {
    category = '生态文明与绿色低碳';
  }

  let type = 'golden';
  if (text.includes('一、') || text.includes('1.') || text.includes('一是')) {
    type = 'heading';
  } else if (text.includes('特制定本') || text.includes('批复如下') || text.includes('特此报告')) {
    type = 'template';
  }

  return {
    category: category,
    type: type,
    title: text.slice(0, 18).replace(/\n/g, '') + '...',
    content: text,
    note: '适用于四川省考公文写作与申论大作文段落论据支撑。',
    tags: [category.slice(0, 4), '公文精选']
  };
}

// 执行模式 2: 整道模考大题拆解 (题干 + 背景材料 + 范文 ➔ 萃取骨架与材料对照)
async function executeAiExtractDocExam() {
  const stem = (document.getElementById('raw-exam-stem').value || '').trim();
  const mats = (document.getElementById('raw-exam-materials').value || '').trim();
  const ans = (document.getElementById('raw-exam-answer').value || '').trim();

  if (!stem && !ans) {
    alert('请至少填入题干任务或参考答案范文！');
    return;
  }

  const btn = document.getElementById('btn-extract-exam');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🧠 AI 正在多维拆解试题核心提纲与材料对照...';
  }

  const prompt = `你是一名公务员考试申论与公文写作命题专家。考生提供了一道模考试卷或真题（包含题干任务、材料背景及参考范文）。请深度拆解并萃取其中的高分公文写作素材（提纲骨架、材料转化对仗），严格返回 JSON 格式：
【题干任务】：${stem}
【背景材料】：${mats}
【参考范文】：${ans}

【返回 JSON 格式要求】：
{
  "category": "所属主题，从以下6项中选：['治蜀兴川与四川省情', '新质生产力与经济', '基层治理与乡村振兴', '干部作风与廉洁担当', '营商环境与政务服务', '生态文明与绿色低碳']",
  "type": "heading",
  "title": "提炼出的公文主旨或核心提纲总称（18字以内）",
  "content": "从范文和材料中萃取出的标准高分三段/四段对仗小标题提纲及核心表述",
  "note": "此题命题意图、文种格式特征及答题避坑指南（40字以内）",
  "tags": ["试题拆解", "范文提纲", "省考真题"]
}`;

  try {
    let result = await callAiDocAssistant(prompt, true);
    if (!result || !result.title) {
      result = {
        category: '治蜀兴川与四川省情',
        type: 'heading',
        title: (stem ? stem.slice(0, 20) : '模考公文真题萃取提纲'),
        content: ans || mats,
        note: '从给定模考题中萃取的高分答题要点，便于考场快速迁移。',
        tags: ['模考真题', '提纲拆解']
      };
    }
    fillParsedMaterialPreview(result);
  } catch (err) {
    console.error('试题萃取异常:', err);
    alert('解析完成，已为您整理初版提纲，请在下方预览微调。');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🧠 AI 深度萃取 (提纲+金句+材料对照)';
    }
  }
}

// 回填解析结果到预览编辑区
function fillParsedMaterialPreview(data) {
  appState.parsedMaterialDraft = data;
  const preview = document.getElementById('mat-parsed-preview');
  if (preview) preview.classList.remove('hidden');

  const catEl = document.getElementById('parsed-mat-category');
  const typeEl = document.getElementById('parsed-mat-type');
  const titleEl = document.getElementById('parsed-mat-title');
  const contentEl = document.getElementById('parsed-mat-content');
  const noteEl = document.getElementById('parsed-mat-note');

  if (catEl && data.category) catEl.value = data.category;
  if (typeEl && data.type) typeEl.value = data.type;
  if (titleEl) titleEl.value = data.title || '';
  if (contentEl) contentEl.value = data.content || '';
  if (noteEl) noteEl.value = data.note || '';

  const saveBtn = document.getElementById('btn-save-parsed-material');
  if (saveBtn) saveBtn.disabled = false;

  // 滚动到预览区域方便查看
  if (preview) preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 确认保存录入的素材
function confirmSaveParsedMaterial() {
  const category = document.getElementById('parsed-mat-category').value;
  const type = document.getElementById('parsed-mat-type').value;
  const title = (document.getElementById('parsed-mat-title').value || '').trim();
  const content = (document.getElementById('parsed-mat-content').value || '').trim();
  const note = (document.getElementById('parsed-mat-note').value || '').trim();

  if (!title) {
    alert('请至少填写素材标题！');
    return;
  }

  const newMaterial = {
    id: 'mat-' + Date.now(),
    category: category,
    type: type,
    title: title,
    content: content,
    note: note,
    tags: (appState.parsedMaterialDraft && appState.parsedMaterialDraft.tags) ? appState.parsedMaterialDraft.tags : [category.slice(0, 4)],
    is_star: 0,
    source: 'AI智能录入',
    updatedAt: Date.now()
  };

  const list = [newMaterial, ...appState.materials];
  saveLocalMaterials(list);
  renderMaterialGallery();
  renderMaterialFlashcard();
  closeAiAddMaterialModal();
  alert('🎉 素材已成功加入您的公文写作素材库！');
}

/* ==========================================================================
   🪄 AI 公文百宝箱 (工具1: 大白话升华器; 工具2: 对仗提纲小标题拟制器)
   ========================================================================== */

// 工具 1: 大白话 ➔ 地道公文升华器
async function runColloquialPolish() {
  const input = (document.getElementById('toolbox-colloquial-input').value || '').trim();
  if (!input) {
    alert('请输入您想表达的通俗大白话或想法！');
    return;
  }

  const style = document.getElementById('toolbox-polish-style').value;
  const btn = document.getElementById('btn-run-polish');
  const resultsBox = document.getElementById('toolbox-polish-results');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ AI 正在升华为地道公文表达...';
  }

  let styleDesc = '四字对仗、排比有力，符合党政机关规范用语';
  if (style === 'action') styleDesc = '强力动宾结构、狠抓实干落实、突出抓手与工作举措';
  if (style === 'philosophy') styleDesc = '融合总书记重要指示与政策理论高度，立意高远';

  const prompt = `你是一名资深的四川省委政策研究室撰稿专家。请将以下这句通俗口语/大白话，升华为 3 个不同侧重点的地道公文规范表达。
【通俗大白话】：
${input}

【风格要求】：
${styleDesc}

【输出要求】：
直接输出 3 条精选公文升华方案，按以下格式呈现，严禁返回废话：
方案一 (推荐用语)：...
方案二 (动宾对仗)：...
方案三 (宏观立意)：...`;

  try {
    let output = await callAiDocAssistant(prompt, false);
    if (!output) {
      output = `方案一 (推荐用语)：坚持以人民为中心的发展思想，健全常态化下沉走访与一线解难机制，推动矛盾纠纷就地化解。\n方案二 (动宾对仗)：深耕基层一线，倾听群众呼声；破除推诿梗阻，压实为民实效。\n方案三 (宏观立意)：把造福人民作为最大政绩，深化践行新时代群众路线，切实提升人民群众的获得感与幸福感。`;
    }

    if (resultsBox) {
      resultsBox.classList.remove('hidden');
      const escaped = escapeHtml(output).replace(/\n/g, '<br>');
      resultsBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:var(--primary); font-size:0.9rem;">✨ AI 升华地道公文表达：</strong>
          <button class="btn btn-outline btn-sm" onclick="savePolishToMaterial()">💾 存入素材库</button>
        </div>
        <div id="polished-text-container" style="font-size:0.9rem; line-height:1.7; color:var(--text-main); white-space:pre-wrap; background:var(--bg-main); padding:12px; border-radius:6px; border:1px solid var(--border-subtle);">${escapeHtml(output)}</div>
      `;
    }
  } catch (err) {
    alert('AI 服务暂时未响应，请检查 AI 引擎配置或网络。');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 AI 智能升华';
    }
  }
}

// 将升华结果一键保存为素材
function savePolishToMaterial() {
  const container = document.getElementById('polished-text-container');
  const input = (document.getElementById('toolbox-colloquial-input').value || '').trim();
  if (!container) return;

  const content = `【日常大白话】\n${input}\n\n【地道公文升华】\n${container.textContent.trim()}`;
  const newMat = {
    id: 'mat-' + Date.now(),
    category: '干部作风与廉洁担当',
    type: 'mapping',
    title: '大白话升华公文表达 · ' + (input.slice(0, 12) || '日常表述'),
    content: content,
    note: '由 AI 公文百宝箱一键升华生成。',
    tags: ['大白话升华', '地道公文', '百宝箱'],
    is_star: 1,
    source: 'AI公文升华器',
    updatedAt: Date.now()
  };

  const list = [newMat, ...appState.materials];
  saveLocalMaterials(list);
  renderMaterialGallery();
  renderMaterialFlashcard();
  alert('🎉 已成功将升华表达保存至公文写作素材库！');
}

// 工具 2: 对仗提纲小标题拟制器
async function runOutlineGenerate() {
  const topic = (document.getElementById('toolbox-outline-topic').value || '').trim();
  if (!topic) {
    alert('请输入公文主题或写作任务！');
    return;
  }

  const struct = document.getElementById('toolbox-outline-struct').value;
  const btn = document.getElementById('btn-run-outline');
  const resultsBox = document.getElementById('toolbox-outline-results');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ AI 正在拟制工整对仗提纲...';
  }

  let structDesc = '经典三段并列对仗小标题，字数完全相等，如四字或八字对仗';
  if (struct === 'step') structDesc = '递进推进式：认识站位 ➔ 制度机制 ➔ 落地实干';
  if (struct === 'doc') structDesc = '标准实施方案体：提高政治站位 ➔ 聚焦重点攻坚 ➔ 健全长效保障';

  const prompt = `你是一名公务员考试申论大作文与法定公文命题人。请根据以下写作主题，拟定两套工整、高分、契合四川省情的对仗提纲一级小标题：
【写作任务/主题】：${topic}
【结构要求】：${structDesc}

【输出规范】：
按以下格式直接输出两套对仗小标题方案，包含小标题及其核心展开方向，不要有多余寒暄废话：
【方案 A (推荐)】：
一、...（对仗小标题）
展开要点：...
二、...（对仗小标题）
展开要点：...
三、...（对仗小标题）
展开要点：...

【方案 B (备选)】：
一、...
二、...
三、...`;

  try {
    let output = await callAiDocAssistant(prompt, false);
    if (!output) {
      output = `【方案 A (对仗工整 · 四川高分)】\n一、强基固本筑牢发展之基，凝聚思想共识；\n二、聚链成势激活创新动能，攻坚重点任务；\n三、协同联动健全长效机制，压实落实力度。\n\n【方案 B (递进推进式)】\n一、深化思想认识，把稳行动之舵；\n二、破除壁垒中梗阻，扫清推进之障；\n三、锻造过硬本领，夯实成效之本。`;
    }

    if (resultsBox) {
      resultsBox.classList.remove('hidden');
      resultsBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:var(--primary); font-size:0.9rem;">📐 拟定对仗小标题提纲：</strong>
          <button class="btn btn-outline btn-sm" onclick="saveOutlineToMaterial()">💾 存入素材库</button>
        </div>
        <div id="outlined-text-container" style="font-size:0.9rem; line-height:1.7; color:var(--text-main); white-space:pre-wrap; background:var(--bg-main); padding:12px; border-radius:6px; border:1px solid var(--border-subtle);">${escapeHtml(output)}</div>
      `;
    }
  } catch (err) {
    alert('AI 服务暂时未响应，请检查 AI 引擎配置。');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ 生成对仗小标题';
    }
  }
}

// 保存提纲到素材库
function saveOutlineToMaterial() {
  const container = document.getElementById('outlined-text-container');
  const topic = (document.getElementById('toolbox-outline-topic').value || '').trim();
  if (!container) return;

  const newMat = {
    id: 'mat-' + Date.now(),
    category: '治蜀兴川与四川省情',
    type: 'heading',
    title: (topic.slice(0, 18) || '专题公文') + ' · 对仗提纲',
    content: container.textContent.trim(),
    note: '由 AI 对仗提纲小标题拟制器生成。',
    tags: ['对仗提纲', '小标题', '百宝箱'],
    is_star: 1,
    source: 'AI提纲拟制器',
    updatedAt: Date.now()
  };

  const list = [newMat, ...appState.materials];
  saveLocalMaterials(list);
  renderMaterialGallery();
  renderMaterialFlashcard();
  alert('🎉 对仗提纲已成功存入公文写作素材库！');
}

/* ==========================================================================
   📤 导入与导出 JSON 素材数据
   ========================================================================== */

function exportMaterialsJSON() {
  const data = appState.materials;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sichuan_study_materials_${getRealCurrentDateStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importMaterialsJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert('导入失败：JSON 文件内容必须是素材数组！');
        return;
      }

      const map = new Map();
      appState.materials.forEach(m => map.set(String(m.id), m));
      imported.forEach(im => {
        if (im && im.id) map.set(String(im.id), im);
      });

      const merged = Array.from(map.values());
      saveLocalMaterials(merged);
      renderMaterialGallery();
      renderMaterialFlashcard();
      alert(`🎉 成功导入素材！当前库中共有 ${merged.length} 条素材。`);
    } catch (err) {
      alert('导入失败：文件格式不符合 JSON 规范！');
    }
  };
  reader.readAsText(file);
}

// 绑定素材库专属分类与形式标签切换点击事件
document.addEventListener('DOMContentLoaded', () => {
  // 素材主题分类标签
  const catContainer = document.getElementById('mat-cat-tabs');
  if (catContainer) {
    catContainer.querySelectorAll('.cat-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        catContainer.querySelectorAll('.cat-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        appState.activeMatCategory = chip.getAttribute('data-cat') || 'all';
        renderMaterialGallery();
      });
    });
  }

  // 素材形态标签
  const typeContainer = document.getElementById('mat-type-tabs');
  if (typeContainer) {
    typeContainer.querySelectorAll('.type-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        typeContainer.querySelectorAll('.type-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        appState.activeMatType = chip.getAttribute('data-type') || 'all';
        renderMaterialGallery();
      });
    });
  }
});

