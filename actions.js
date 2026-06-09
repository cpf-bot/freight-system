// ========== 编辑记录 ==========
function editRecord(id) {
    const records = getRecords();
    const record = records.find(r => r.id === id);
    if (record) {
        document.getElementById('customerName').value = record.customerName;
        document.getElementById('inquiryDate').value = record.inquiryDate;
        document.getElementById('pol').value = record.pol;
        document.getElementById('pod').value = record.pod;
        document.getElementById('transportMode').value = record.transportMode;
        toggleContainerType();
        if (record.containerType) {
            document.getElementById('containerType').value = record.containerType;
        }
        document.getElementById('goodsName').value = record.goodsName !== '-' ? record.goodsName : '';
        document.getElementById('dimensions').value = record.dimensions !== '-' ? record.dimensions : '';
        document.getElementById('weight').value = record.weight !== '-' && record.weight !== 0 ? record.weight : '';
        document.getElementById('readyDate').value = record.readyDate !== '-' ? record.readyDate : '';
        document.getElementById('hsCode').value = record.hsCode !== '-' ? record.hsCode : '';
        document.querySelector(`input[name="dangerous"][value="${record.dangerous}"]`).checked = true;
        document.getElementById('terms').value = record.terms !== '-' ? record.terms : '';
        document.getElementById('remarks').value = record.remarks !== '-' ? record.remarks : '';
        
        deleteRecord(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ========== 删除记录 ==========
function deleteRecord(id) {
    if (confirm('确定删除这条询价记录吗？')) {
        let records = getRecords();
        records = records.filter(r => r.id !== id);
        saveRecords(records);
        renderRecords();
    }
}

// ========== 导出 CSV ==========
function exportToCSV() {
    const records = getRecords();
    if (records.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    const headers = ['询价日期', '客户名称', '启运港', '目的港', '运输方式', '柜型', '货品名称', '尺寸(cm)', '重量(kg)', '货好时间', '海关编码', '危险品', '业务条款', '备注', '报价总USD', '报价总CNY'];
    const rows = records.map(r => [
        r.inquiryDate, r.customerName, r.pol, r.pod, r.transportMode,
        r.containerType || '-', r.goodsName, r.dimensions, r.weight, r.readyDate, r.hsCode, r.dangerous, r.terms, r.remarks,
        r.quote ? r.quote.totalUSD || 0 : 0,
        r.quote ? r.quote.totalCNY || 0 : 0
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `freight_inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ========== 备份数据 ==========
function exportBackup() {
    const records = getRecords();
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `freight_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ========== 恢复备份 ==========
function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    if (confirm(`导入 ${imported.length} 条记录？现有数据将被覆盖。`)) {
                        saveRecords(imported);
                        renderRecords();
                        alert('导入成功！');
                    }
                } else {
                    alert('文件格式错误');
                }
            } catch(err) {
                alert('解析失败：' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}