// --- State & Initialization ---
let entries = JSON.parse(localStorage.getItem('ui_ops_entries')) || [];
let brandStats = JSON.parse(localStorage.getItem('ui_ops_stats')) || {}; 
let currentBrand = 'universe'; 
let editingId = null;

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
    btnCancelEdit: document.getElementById('btn-cancel-edit')
};

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
    const brandEntries = entries.filter(e => e.brand === currentBrand);
    const stats = brandStats[currentBrand] || { new: 0, total: 0 };
    
    const purchaseCount = brandEntries.filter(e => e.tags.includes('purchase')).length;
    const total = brandEntries.length;
    
    refs.statRatio.textContent = total === 0 ? '0%' : `${Math.round((purchaseCount / total) * 100)}%`;
    refs.statRatioCount.textContent = `${purchaseCount} / ${total}`;
    
    refs.statLeads.textContent = stats.new || 0;
    refs.statPro.textContent = stats.total || 0;

    // Render Table (Leads only)
    let filtered = brandEntries;
    if (filter !== 'all') filtered = brandEntries.filter(e => e.tags.includes(filter));

    refs.tableBody.innerHTML = filtered.reverse().map(e => `
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
    if (entries.length === 0) return alert('没有线索数据可导出');
    
    const stats = brandStats[currentBrand] || { valid: 0, invalid: 0 };
    const headers = ['录入时间', '品牌', '归属帖子', '用户身份', '车型', '线索分类', '微信/联系方式', '备注内容', '今日有效评论总计', '今日无效评论总计'];
    const rows = entries.map((e, idx) => [
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
    if (confirm('清空所有数据？')) {
        entries = [];
        brandStats = {};
        localStorage.clear();
        render();
        showToast('已彻底清空', '#ff4242');
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
setBrand('universe');
