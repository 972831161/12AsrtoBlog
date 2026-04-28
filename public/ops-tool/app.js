// --- State & Initialization ---
let entries = JSON.parse(localStorage.getItem('ui_ops_entries')) || [];
let currentBrand = 'universe'; // 'universe' or 'illusion'

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
    toast: document.getElementById('toast')
};

// --- Brand Switching ---
refs.btnUniverse.addEventListener('click', () => setBrand('universe'));
refs.btnIllusion.addEventListener('click', () => setBrand('illusion'));

function setBrand(brand) {
    currentBrand = brand;
    document.body.setAttribute('data-theme', brand);
    refs.btnUniverse.classList.toggle('active', brand === 'universe');
    refs.btnIllusion.classList.toggle('active', brand === 'illusion');
    refs.brandLabel.textContent = brand === 'universe' ? 'Universe E-bike' : 'Illusion 幻驰';
    render();
}

// --- Data Management ---
refs.form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get checked tags
    const tags = Array.from(refs.form.querySelectorAll('input[type="checkbox"]:checked'))
                      .map(cb => cb.value);
    
    const entry = {
        id: Date.now(),
        brand: currentBrand,
        source: document.getElementById('in-source').value,
        user: document.getElementById('in-user').value,
        model: document.getElementById('in-model').value,
        content: document.getElementById('in-content').value,
        wechat: document.getElementById('in-wechat').value,
        tags: tags,
        timestamp: new Date().toLocaleString('zh-CN')
    };

    entries.push(entry);
    save();
    refs.form.reset();
    showToast('记录已保存');
    render();
});

function save() {
    localStorage.setItem('ui_ops_entries', JSON.stringify(entries));
}

// --- Rendering ---
function render() {
    const filter = refs.filterType.value;
    const brandEntries = entries.filter(e => e.brand === currentBrand);
    
    // Stats calculation
    const purchaseCount = brandEntries.filter(e => e.tags.includes('purchase')).length;
    const leadCount = brandEntries.filter(e => e.tags.includes('lead')).length;
    const proCount = brandEntries.filter(e => e.tags.includes('pro')).length;
    const total = brandEntries.length;
    
    const ratio = total === 0 ? 0 : Math.round((purchaseCount / total) * 100);
    
    refs.statRatio.textContent = `${ratio}%`;
    refs.statRatioCount.textContent = `${purchaseCount} / ${total}`;
    refs.statLeads.textContent = leadCount;
    refs.statPro.textContent = proCount;

    // Table Filter
    let filtered = brandEntries;
    if (filter !== 'all') {
        filtered = brandEntries.filter(e => e.tags.includes(filter));
    }

    // Render Table
    refs.tableBody.innerHTML = filtered.reverse().map(e => `
        <tr>
            <td style="color:var(--text-dim); font-size:11px">${e.timestamp.split(' ')[1]}</td>
            <td style="font-weight:600">${e.source}</td>
            <td>${e.user}</td>
            <td>${e.model || '-'}</td>
            <td>${e.tags.map(t => `<span class="table-tag">${getTagLabel(t)}</span>`).join('')}</td>
            <td style="color:var(--accent); font-weight:600">${e.wechat || '-'}</td>
            <td><span style="opacity:0.5">待处理</span></td>
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
    if (entries.length === 0) return alert('没有数据可导出');
    
    const headers = ['时间', '品牌', '来源', '用户', '车型', '分类', '微信号', '内容'];
    const rows = entries.map(e => [
        `"${e.timestamp}"`,
        `"${e.brand === 'universe' ? '宇宙自行车' : '幻驰illusion'}"`,
        `"${e.source}"`,
        `"${e.user}"`,
        `"${e.model}"`,
        `"${e.tags.join(',')}"`,
        `"${e.wechat}"`,
        `"${e.content.replace(/"/g, '""')}"`
    ]);
    
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `UI-Ops-Report-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

refs.btnReset.addEventListener('click', () => {
    if (confirm('确定要清空所有已录入的数据吗？此操作不可撤销。')) {
        entries = [];
        save();
        render();
        showToast('数据已清空', '#ff4242');
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
render();
