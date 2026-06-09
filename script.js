// ========== 数据存储 ==========
const STORAGE_KEY = 'freight_inquiries_v2';

function getRecords() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ========== 工具函数 ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== 初始化日期 ==========
function initDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('inquiryDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
    }
}

// ========== 切换柜型显示 ==========
function toggleContainerType() {
    const mode = document.getElementById('transportMode').value;
    const group = document.getElementById('containerTypeGroup');
    if (group) {
        group.style.display = mode === '海运' ? 'flex' : 'none';
    }
}

// ========== 添加记录 ==========
function addRecord() {
    const customerName = document.getElementById('customerName').value.trim();
    if (!customerName) {
        alert('请填写客户名称');
        return;
    }

    const pol = document.getElementById('pol').value.trim();
    const pod = document.getElementById('pod').value.trim();
    if (!pol || !pod) {
        alert('请填写启运港和目的港');
        return;
    }

    const dangerous = document.querySelector('input[name="dangerous"]:checked').value;
    const transportMode = document.getElementById('transportMode').value;
    const containerType = transportMode === '海运' ? document.getElementById('containerType').value : '';
    
    const record = {
        id: Date.now(),
        inquiryDate: document.getElementById('inquiryDate').value,
        customerName: customerName,
        pol: pol,
        pod: pod,
        transportMode: transportMode,
        containerType: containerType,
        goodsName: document.getElementById('goodsName').value || '-',
        dimensions: document.getElementById('dimensions').value || '-',
        weight: document.getElementById('weight').value || 0,
        readyDate: document.getElementById('readyDate').value || '-',
        hsCode: document.getElementById('hsCode').value || '-',
        dangerous: dangerous,
        terms: document.getElementById('terms').value || '-',
        remarks: document.getElementById('remarks').value || '-',
        quote: null,
        createdAt: new Date().toISOString()
    };

    const records = getRecords();
    records.unshift(record);
    saveRecords(records);

    // 清空表单
    document.getElementById('customerName').value = '';
    document.getElementById('pol').value = '';
    document.getElementById('pod').value = '';
    document.getElementById('goodsName').value = '';
    document.getElementById('dimensions').value = '';
    document.getElementById('weight').value = '';
    document.getElementById('hsCode').value = '';
    document.getElementById('terms').value = '';
    document.getElementById('remarks').value = '';
    document.querySelector('input[name="dangerous"][value="否"]').checked = true;
    
    renderRecords();
}

// ========== 复制询价信息 ==========
function copyInquiryToClipboard() {
    const customerName = document.getElementById('customerName').value.trim();
    if (!customerName) {
        alert('请先填写询价信息');
        return;
    }

    const transportMode = document.getElementById('transportMode').value;
    const containerType = transportMode === '海运' ? document.getElementById('containerType').value : '';
    const weight = document.getElementById('weight').value || '0';
    
    let text = `========== 询价信息 ==========\n`;
    text += `客户名称：${customerName}\n`;
    text += `询价日期：${document.getElementById('inquiryDate').value}\n`;
    text += `启运港：${document.getElementById('pol').value}\n`;
    text += `目的港：${document.getElementById('pod').value}\n`;
    text += `运输方式：${transportMode}\n`;
    if (containerType) text += `柜型：${containerType}\n`;
    text += `货品名称：${document.getElementById('goodsName').value || '-'}\n`;
    text += `尺寸：${document.getElementById('dimensions').value || '-'} cm\n`;
    text += `重量：${weight} kg\n`;
    text += `货好时间：${document.getElementById('readyDate').value || '-'}\n`;
    text += `海关编码：${document.getElementById('hsCode').value || '-'}\n`;
    const dangerous = document.querySelector('input[name="dangerous"]:checked').value;
    text += `是否危险品：${dangerous}\n`;
    text += `业务条款：${document.getElementById('terms').value || '-'}\n`;
    text += `备注：${document.getElementById('remarks').value || '-'}\n`;
    text += `================================\n`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ 询价信息已复制到剪贴板，可以发给商务报价了！');
    });
}

// ========== 渲染统计卡片 ==========
function renderStats() {
    const records = getRecords();
    const total = records.length;
    const dangerous = records.filter(r => r.dangerous === '是').length;
    const quoted = records.filter(r => r.quote !== null).length;
    
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">总询价</div></div>
            <div class="stat-card"><div class="stat-number">${dangerous}</div><div class="stat-label">危险品</div></div>
            <div class="stat-card"><div class="stat-number">${quoted}</div><div class="stat-label">已报价</div></div>
        `;
    }
}

// ========== 渲染记录表格 ==========
function renderRecords() {
    let records = getRecords();
    
    const searchInput = document.getElementById('searchInput');
    const modeFilter = document.getElementById('modeFilter');
    const dangerousFilter = document.getElementById('dangerousFilter');
    
    if (searchInput) {
        const search = searchInput.value.toLowerCase();
        if (search) records = records.filter(r => r.customerName.toLowerCase().includes(search));
    }
    if (modeFilter && modeFilter.value !== 'all') {
        records = records.filter(r => r.transportMode === modeFilter.value);
    }
    if (dangerousFilter && dangerousFilter.value !== 'all') {
        records = records.filter(r => r.dangerous === dangerousFilter.value);
    }
    
    renderStats();
    
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center">暂无数据，添加第一条询价记录</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map(record => {
        let quoteStatus = '未报价';
        if (record.quote) {
            const totalUSD = record.quote.totalUSD || 0;
            const totalCNY = record.quote.totalCNY || 0;
            quoteStatus = `已报价\n$${totalUSD.toFixed(2)} USD`;
            if (totalCNY > 0) quoteStatus += `\n¥${totalCNY.toFixed(2)} CNY`;
        }
        
        return `
            <tr>
                <td>${escapeHtml(record.inquiryDate)}</td>
                <td><strong>${escapeHtml(record.customerName)}</strong></td>
                <td>${escapeHtml(record.pol)}</td>
                <td>${escapeHtml(record.pod)}</td>
                <td>${record.transportMode}</td>
                <td>${record.containerType || '-'}</td>
                <td>${escapeHtml(record.goodsName)}</td>
                <td>${record.weight} kg</td>
                <td class="${record.dangerous === '是' ? 'dangerous-yes' : ''}">${record.dangerous}</td>
                <td style="font-size:11px; white-space:pre-line;">${quoteStatus}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editRecord(${record.id})">编辑</button>
                    <button class="delete-btn" onclick="deleteRecord(${record.id})">删除</button>
                    ${record.quote ? `<button class="view-btn" onclick="viewQuote(${record.id})">查看报价</button>` : ''}
                    <button class="quote-btn" onclick="openQuoteModal(${record.id})">${record.quote ? '修改报价' : '添加报价'}</button>
                </td>
            </tr>
        `;
    }).join('');
}