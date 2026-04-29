// --- Supabase Init ---
const SUPABASE_URL = 'https://qhnoweceygptxmzwnvaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobm93ZWNleWdwdHhtendudmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTU1NTEsImV4cCI6MjA5Mjk5MTU1MX0.2xqcEV_PbV-nXxzUGm2UD35MKLZLyJnKjN6w1h40MT0';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveStatsToSupabase() {
    const stat = brandStats[currentBrand];
    if (!stat) return;
    await db.from('ops_stats').upsert({
        brand: currentBrand,
        new_followers: stat.new || '',
        total_followers: stat.total || '',
        record_date: stat.date,
        valid_count: stat.valid || 0,
        invalid_count: stat.invalid || 0
    });
}

// --- State & Initialization ---
let entries = JSON.parse(localStorage.getItem('ui_ops_entries')) || [];
let brandStats = JSON.parse(localStorage.getItem('ui_ops_stats')) || {}; 
let currentBrand = 'universe'; 
let editingId = null;

let activeTab = 'realtime'; // 'realtime' or 'history'

const refs = {
    form: document.getElementById('entry-form'),
    tableBody: document.querySelector('#data-table tbody'),
    btnUniverse: document.getElementById('btn-universe'),
    btnIllusion: document.getElementById('btn-illusion'),
    brandLabel: document.getElementById('current-brand-label'),
    statRatio: document.getElementById('stat-ratio'),
    statRatioCount: document.getElementById('stat-ratio-count'),
    statLeads: document.getElementById('stat-leads'),
    statPro: document.getElementById('stat-pro'),
    filterType: document.getElementById('filter-type'),
    btnExport: document.getElementById('btn-export'),
    btnReset: document.getElementById('btn-reset'),
    toast: document.getElementById('toast'),
    inNewFollowers: document.getElementById('in-new-followers'),
    inTotalFollowers: document.getElementById('in-total-followers'),
    inRecordDate: document.getElementById('in-record-date'),
    btnUpdateStats: document.getElementById('btn-update-stats'),
    txtValidCount: document.getElementById('txt-valid-count'),
    txtInvalidCount: document.getElementById('txt-invalid-count'),
    btnAddValid: document.getElementById('btn-add-valid'),
    btnSubValid: document.getElementById('btn-sub-valid'),
    btnAddInvalid: document.getElementById('btn-add-invalid'),
    btnSubInvalid: document.getElementById('btn-sub-invalid'),
    btnSubmitMain: document.getElementById('btn-submit-main'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    tabRealtime: document.getElementById('tab-realtime'),
    tabHistory: document.getElementById('tab-history')
};

// --- Tab Switching ---
function isToday(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    if (isNaN(d)) return true; // 如果解析失败，放行显示
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
}

refs.tabRealtime.addEventListener('click', () => switchTab('realtime'));
refs.tabHistory.addEventListener('click', () => switchTab('history'));

function switchTab(tab) {
    activeTab = tab;
    refs.tabRealtime.classList.toggle('active', tab === 'realtime');
    refs.tabHistory.classList.toggle('active', tab === 'history');
    render();
}

// --- Brand Switching ---
refs.btnUniverse.addEventListener('click', () => setBrand('universe'));
refs.btnIllusion.addEventListener('click', () => setBrand('illusion'));


function setBrand(brand) {
    currentBrand = brand;
    document.body.setAttribute('data-theme', brand);
    
    // Fill stats inputs with current brand's data
    const stats = brandStats[currentBrand] || { new: '', total: '', date: new Date().toISOString().split('T')[0], valid: 0, invalid: 0 };
    refs.inNewFollowers.value = stats.new || '';
    refs.inTotalFollowers.value = stats.total || '';
    refs.inRecordDate.value = stats.date;
    refs.txtValidCount.textContent = stats.valid || 0;
    refs.txtInvalidCount.textContent = stats.invalid || 0;
    
    render();
}

// --- Stats Update (Counters) ---
function updateCounter(type, delta) {
    if (!brandStats[currentBrand]) brandStats[currentBrand] = { valid: 0, invalid: 0 };
    const current = brandStats[currentBrand][type] || 0;
    const newVal = Math.max(0, current + delta);
    brandStats[currentBrand][type] = newVal;
    
    if (type === 'valid') refs.txtValidCount.textContent = newVal;
    else refs.txtInvalidCount.textContent = newVal;
    
    localStorage.setItem('ui_ops_stats', JSON.stringify(brandStats));
    saveStatsToSupabase();
}

refs.btnAddValid.addEventListener('click', () => updateCounter('valid', 1));
refs.btnSubValid.addEventListener('click', () => updateCounter('valid', -1));
refs.btnAddInvalid.addEventListener('click', () => updateCounter('invalid', 1));
refs.btnSubInvalid.addEventListener('click', () => updateCounter('invalid', -1));

refs.btnUpdateStats.addEventListener('click', () => {
    brandStats[currentBrand] = {
        ...brandStats[currentBrand],
        new: refs.inNewFollowers.value,
        total: refs.inTotalFollowers.value,
        date: refs.inRecordDate.value
    };
    localStorage.setItem('ui_ops_stats', JSON.stringify(brandStats));
    saveStatsToSupabase();
    showToast('数据已同步');
    render();
});

// --- Lead Data Management ---
refs.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const tags = Array.from(refs.form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    const entryData = {
        brand: currentBrand,
        source: document.getElementById('in-source').value,
        user: document.getElementById('in-user').value,
        model: document.getElementById('in-model').value,
        content: document.getElementById('in-content').value,
        wechat: document.getElementById('in-wechat').value,
        tags: tags
    };

    if (editingId) {
        // Update existing
        const idx = entries.findIndex(emp => emp.id === editingId);
        if (idx !== -1) {
            entries[idx] = { ...entries[idx], ...entryData };
            db.from('ops_leads').update({
                source: entryData.source,
                "user": entryData.user,
                model: entryData.model,
                content: entryData.content,
                wechat: entryData.wechat,
                tags: entryData.tags
            }).eq('id', editingId).then();
            showToast('线索已更新');
            stopEdit();
        }
    } else {
        // Create new
        const entry = {
            id: Date.now(),
            ...entryData,
            timestamp: new Date().toLocaleString('zh-CN')
        };
        entries.push(entry);
        db.from('ops_leads').insert([{
            id: entry.id,
            brand: entry.brand,
            source: entry.source,
            "user": entry.user,
            model: entry.model,
            content: entry.content,
            wechat: entry.wechat,
            tags: entry.tags,
            timestamp: entry.timestamp
        }]).then();
        showToast('线索已保存');
    }

    save();
    resetLeadFields();
    render();
});

function resetLeadFields(isFullReset = false) {
    if (isFullReset) {
        document.getElementById('in-source').value = '';
        document.getElementById('in-model').value = '';
    }
    document.getElementById('in-user').value = '';
    document.getElementById('in-content').value = '';
    document.getElementById('in-wechat').value = '';
    // Uncheck boxes
    refs.form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
}

window.startEdit = function(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    editingId = id;
    document.getElementById('in-source').value = entry.source;
    document.getElementById('in-user').value = entry.user;
    document.getElementById('in-model').value = entry.model;
    document.getElementById('in-content').value = entry.content;
    document.getElementById('in-wechat').value = entry.wechat;
    
    // Set checkboxes
    refs.form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = entry.tags.includes(cb.value);
    });

    refs.btnSubmitMain.textContent = '更新此条线索';
    refs.btnSubmitMain.style.background = '#ffad33'; // Highlight edit mode
    refs.btnCancelEdit.style.display = 'block';
    
    // Scroll to form
    refs.form.scrollIntoView({ behavior: 'smooth' });
    render();
};

function stopEdit() {
    editingId = null;
    refs.btnSubmitMain.textContent = '保存此条线索';
    refs.btnSubmitMain.style.background = '';
    refs.btnCancelEdit.style.display = 'none';
    resetLeadFields(true); // 彻底重置
    render();
}

window.deleteEntry = function(id) {
    if (confirm('确定要删除这条线索吗？')) {
        entries = entries.filter(e => e.id !== id);
        db.from('ops_leads').delete().eq('id', id).then();
        save();
        render();
        showToast('线索已删除', '#ff4242');
    }
};

refs.btnCancelEdit.addEventListener('click', stopEdit);

function save() {
    localStorage.setItem('ui_ops_entries', JSON.stringify(entries));
}

// --- Rendering ---
function render() {
    const filter = refs.filterType.value;
    
    // Total combined statistics for the current brand
    const brandCombined = entries.filter(e => e.brand === currentBrand);

    const stats = brandStats[currentBrand] || { new: 0, total: 0 };
    
    const purchaseCount = brandCombined.filter(e => e.tags.includes('purchase')).length;
    const total = brandCombined.length;
    
    refs.statRatio.textContent = total === 0 ? '0%' : `${Math.round((purchaseCount / total) * 100)}%`;
    refs.statRatioCount.textContent = `${purchaseCount} / ${total}`;
    
    refs.statLeads.textContent = stats.new || 0;
    refs.statPro.textContent = stats.total || 0;

    // Table Data: filter by tab
    let displayEntries = (activeTab === 'realtime') 
        ? entries.filter(e => e.brand === currentBrand && isToday(e.timestamp))
        : entries.filter(e => e.brand === currentBrand && !isToday(e.timestamp));

    // DEDUPLICATION: Prevent same records from showing multiple times
    // Create a unique key for each entry based on its main content
    const seen = new Set();
    const deduped = [];
    for (const e of displayEntries) {
        const key = `${e.timestamp}-${e.user}-${e.wechat}-${e.content}`;
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(e);
        }
    }
    displayEntries = deduped;

    // Apply category filter
    if (filter !== 'all') displayEntries = displayEntries.filter(e => e.tags.includes(filter));

    // Sort: Newest first
    const sorted = displayEntries.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    console.log(`🎨 [render] 准备渲染表格，当前标签页: ${activeTab}, 品牌: ${currentBrand}, 即将渲染 ${sorted.length} 条数据`);

    if (sorted.length === 0) {
        refs.tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-dim)">
            ${activeTab === 'realtime' ? '今日暂无实时录入' : '云端暂无历史数据'}
        </td></tr>`;
        return;
    }

    refs.tableBody.innerHTML = sorted.map(e => `
        <tr class="${editingId === e.id ? 'editing-row' : ''}">
            <td style="color:var(--text-dim); font-size:11px">${e.timestamp}</td>
            <td style="font-weight:600">${e.source}</td>
            <td>${e.user}</td>
            <td>${e.model || '-'}</td>
            <td>${e.tags.map(t => '<span class="table-tag">' + getTagLabel(t) + '</span>').join('')}</td>
            <td style="color:var(--accent); font-weight:600">${e.wechat || '-'}</td>
            <td>
                <div style="display:flex; gap:6px">
                    <button onclick="startEdit(${e.id})" class="btn-edit">编辑</button>
                    <button onclick="deleteEntry(${e.id})" class="btn-delete">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getTagLabel(tag) {
    const labels = { purchase: '💰', lead: '👤', pro: '📦', order: '🛒' };
    return labels[tag] || tag;
}

refs.filterType.addEventListener('change', render);

// --- Actions ---
refs.btnExport.addEventListener('click', () => {
    const todayEntries = entries.filter(e => e.brand === currentBrand && isToday(e.timestamp));
    if (todayEntries.length === 0) return alert('今日没有线索数据可导出');
    
    const stats = brandStats[currentBrand] || { valid: 0, invalid: 0 };
    const headers = ['录入时间', '品牌', '归属帖子', '用户身份', '车型', '线索分类', '微信/联系方式', '备注内容', '今日有效评论总计', '今日无效评论总计'];
    const rows = todayEntries.map((e, idx) => [
        `"${e.timestamp}"`,
        `"${e.brand === 'universe' ? '宇宙自行车' : '幻驰illusion'}"`,
        `"${e.source}"`,
        `"${e.user}"`,
        `"${e.model}"`,
        `"${e.tags.join(',')}"`,
        `"${e.wechat}"`,
        `"${e.content.replace(/"/g, '""')}"`,
        idx === 0 ? `"${stats.valid || 0}"` : '""',
        idx === 0 ? `"${stats.invalid || 0}"` : '""'
    ]);
    let csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `UI-Report-${currentBrand}-${new Date().toLocaleDateString()}.csv`);
    link.click();
});

refs.btnReset.addEventListener('click', () => {
    if (confirm('重置今日看盘统计？这会将当前的计数器归零。线索记录由于已保存在云端，将自动根据日期为您隔离，无需手动删除。')) {
        brandStats[currentBrand] = {
            new: '', total: '', date: new Date().toISOString().split('T')[0], valid: 0, invalid: 0
        };
        saveStatsToSupabase();
        render();
        showToast('已重置计数器', '#ffad33');
    }
});

function showToast(msg, bg = null) {
    refs.toast.textContent = msg;
    if (bg) refs.toast.style.background = bg;
    refs.toast.classList.add('show');
    setTimeout(() => {
        refs.toast.classList.remove('show');
        if (bg) refs.toast.style.background = '';
    }, 2000);
}

// Init
async function initApp() {
    console.log("👉 [initApp] 开始初始化，尝试从 Supabase 拉取数据...");
    try {
        const { data: leadsData, error: leadsError } = await db.from('ops_leads').select('*');
        if (leadsError) {
            console.error("❌ [initApp] 拉取线索失败:", leadsError);
        } else {
            console.log("✅ [initApp] 成功拉取到线索数据:", leadsData);
            if (leadsData && leadsData.length > 0) {
                const remoteIds = new Set(leadsData.map(d => d.id));
                const onlyLocal = entries.filter(e => !remoteIds.has(e.id));
                entries = [...leadsData, ...onlyLocal];
                console.log("🔄 [initApp] 合并后的 entries 数量:", entries.length);
            }
        }

        const { data: statsData, error: statsError } = await db.from('ops_stats').select('*');
        if (statsError) {
            console.error("❌ [initApp] 拉取统计失败:", statsError);
        } else {
            console.log("✅ [initApp] 成功拉取到统计数据:", statsData);
            if (statsData && statsData.length > 0) {
                statsData.forEach(stat => {
                brandStats[stat.brand] = {
                    new: stat.new_followers,
                    total: stat.total_followers,
                    date: stat.record_date,
                    valid: stat.valid_count,
                    invalid: stat.invalid_count
                };
            });
            }
        }
    } catch (e) {
        console.error('Supabase fetch failed:', e);
    }
    
    setBrand('universe');
}

initApp();

