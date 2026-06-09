// ========== 生成报价文字 ==========
function generateQuoteText(inquiry) {
    const q = inquiry.quote;
    if (!q) return '暂无报价信息';
    
    let text = `========== 报价单 ==========\n`;
    text += `致：${inquiry.customerName}\n`;
    text += `日期：${new Date().toLocaleDateString()}\n\n`;
    text += `【运输信息】\n`;
    text += `启运港：${inquiry.pol}\n`;
    text += `目的港：${inquiry.pod}\n`;
    text += `运输方式：${inquiry.transportMode}\n`;
    if (inquiry.containerType) text += `柜型：${inquiry.containerType}\n`;
    text += `货品：${inquiry.goodsName}\n`;
    text += `重量：${inquiry.weight} kg\n\n`;
    
    text += `【费用明细】\n`;
    if (inquiry.transportMode === '海运') {
        text += `海运费：${q.oceanFreight || 0} ${q.oceanFreightCurr || 'USD'}\n`;
        text += `提货费：${q.pickupFee || 0} ${q.pickupFeeCurr || 'CNY'}\n`;
        text += `LOCAL费用：${q.localFee || 0} ${q.localFeeCurr || 'CNY'}\n`;
        text += `目的港清关：${q.destClearance || 0} ${q.destClearanceCurr || 'CNY'}\n`;
        text += `其他费用：${q.otherFee || 0} ${q.otherFeeCurr || 'CNY'}\n`;
    } else if (inquiry.transportMode === '空运') {
        text += `空运费：${q.airFreightRate || 0} ${q.airFreightRateCurr || 'USD'}/KG × ${inquiry.weight}kg = ${q.airFreightTotal || 0} ${q.airFreightRateCurr || 'USD'}\n`;
        text += `提货费：${q.pickupFee || 0} ${q.pickupFeeCurr || 'CNY'}\n`;
        text += `LOCAL费用：${q.localFee || 0} ${q.localFeeCurr || 'CNY'}\n`;
        text += `目的港清关：${q.destClearance || 0} ${q.destClearanceCurr || 'CNY'}\n`;
        text += `其他费用：${q.otherFee || 0} ${q.otherFeeCurr || 'CNY'}\n`;
    }
    
    text += `\n【费用总计】\n`;
    text += `USD：$${q.totalUSD?.toFixed(2) || 0}\n`;
    if (q.totalCNY > 0) {
        text += `CNY：¥${q.totalCNY?.toFixed(2) || 0}\n`;
    }
    
    text += `\n【业务条款】\n${inquiry.terms || '-'}\n`;
    text += `\n【备注】\n${inquiry.remarks || '-'}\n`;
    text += `================================\n`;
    text += `本报价仅供参考，最终以实际出货为准。\n`;
    
    return text;
}

// ========== 报价弹窗变量 ==========
let currentQuoteInquiryId = null;
let currentViewInquiryId = null;

// ========== 打开报价编辑弹窗 ==========
function openQuoteModal(inquiryId) {
    currentQuoteInquiryId = inquiryId;
    const records = getRecords();
    const inquiry = records.find(r => r.id === inquiryId);
    if (!inquiry) return;
    
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    const existingQuote = inquiry.quote || {};
    const weight = parseFloat(inquiry.weight) || 0;
    
    if (inquiry.transportMode === '海运') {
        modalBody.innerHTML = `
            <div class="fee-row">
                <label>海运费</label>
                <input type="number" id="oceanFreight" step="0.01" value="${existingQuote.oceanFreight || 0}">
                <select id="oceanFreightCurr">
                    <option value="USD" ${existingQuote.oceanFreightCurr === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="CNY" ${existingQuote.oceanFreightCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                </select>
            </div>
            <div class="fee-row">
                <label>提货费</label>
                <input type="number" id="pickupFee" step="0.01" value="${existingQuote.pickupFee || 0}">
                <select id="pickupFeeCurr">
                    <option value="CNY" ${existingQuote.pickupFeeCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.pickupFeeCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="fee-row">
                <label>LOCAL费用</label>
                <input type="number" id="localFee" step="0.01" value="${existingQuote.localFee || 0}">
                <select id="localFeeCurr">
                    <option value="CNY" ${existingQuote.localFeeCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.localFeeCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="fee-row">
                <label>目的港清关费用</label>
                <input type="number" id="destClearance" step="0.01" value="${existingQuote.destClearance || 0}">
                <select id="destClearanceCurr">
                    <option value="CNY" ${existingQuote.destClearanceCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.destClearanceCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="fee-row">
                <label>其他费用</label>
                <input type="number" id="otherFee" step="0.01" value="${existingQuote.otherFee || 0}">
                <select id="otherFeeCurr">
                    <option value="CNY" ${existingQuote.otherFeeCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.otherFeeCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="total-price" id="totalPriceDisplay">总价：$0.00 USD</div>
            <button class="btn" onclick="saveQuote()">保存报价</button>
        `;
    } else if (inquiry.transportMode === '空运') {
        modalBody.innerHTML = `
            <div class="fee-row">
                <label>空运费 (USD/KG)</label>
                <input type="number" id="airFreightRate" step="0.01" value="${existingQuote.airFreightRate || 0}">
                <select id="airFreightRateCurr">
                    <option value="USD" ${existingQuote.airFreightRateCurr === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="CNY" ${existingQuote.airFreightRateCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                </select>
                <span>× ${weight} kg = <span id="airFreightTotal">0</span></span>
            </div>
            <div class="fee-row">
                <label>提货费</label>
                <input type="number" id="pickupFee" step="0.01" value="${existingQuote.pickupFee || 0}">
                <select id="pickupFeeCurr">
                    <option value="CNY" ${existingQuote.pickupFeeCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.pickupFeeCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="fee-row">
                <label>LOCAL费用</label>
                <input type="number" id="localFee" step="0.01" value="${existingQuote.localFee || 0}">
                <select id="localFeeCurr">
                    <option value="CNY" ${existingQuote.localFeeCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.localFeeCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="fee-row">
                <label>目的港清关费用</label>
                <input type="number" id="destClearance" step="0.01" value="${existingQuote.destClearance || 0}">
                <select id="destClearanceCurr">
                    <option value="CNY" ${existingQuote.destClearanceCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.destClearanceCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="fee-row">
                <label>其他费用</label>
                <input type="number" id="otherFee" step="0.01" value="${existingQuote.otherFee || 0}">
                <select id="otherFeeCurr">
                    <option value="CNY" ${existingQuote.otherFeeCurr === 'CNY' ? 'selected' : ''}>CNY</option>
                    <option value="USD" ${existingQuote.otherFeeCurr === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            <div class="total-price" id="totalPriceDisplay">总价：$0.00 USD</div>
            <button class="btn" onclick="saveQuote()">保存报价</button>
        `;
    }
    
    // 绑定输入事件计算总价
    const inputs = modalBody.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateTotalPrice(inquiry.transportMode, weight));
    });
    
    document.getElementById('quoteModal').style.display = 'block';
    calculateTotalPrice(inquiry.transportMode, weight);
}

// ========== 计算总价 ==========
function calculateTotalPrice(transportMode, weight) {
    let totalUSD = 0;
    let totalCNY = 0;
    
    if (transportMode === '海运') {
        const oceanFreight = parseFloat(document.getElementById('oceanFreight')?.value || 0);
        const oceanCurr = document.getElementById('oceanFreightCurr')?.value;
        if (oceanCurr === 'USD') totalUSD += oceanFreight;
        else totalCNY += oceanFreight;
        
        const pickupFee = parseFloat(document.getElementById('pickupFee')?.value || 0);
        const pickupCurr = document.getElementById('pickupFeeCurr')?.value;
        if (pickupCurr === 'USD') totalUSD += pickupFee;
        else totalCNY += pickupFee;
        
        const localFee = parseFloat(document.getElementById('localFee')?.value || 0);
        const localCurr = document.getElementById('localFeeCurr')?.value;
        if (localCurr === 'USD') totalUSD += localFee;
        else totalCNY += localFee;
        
        const destClearance = parseFloat(document.getElementById('destClearance')?.value || 0);
        const destCurr = document.getElementById('destClearanceCurr')?.value;
        if (destCurr === 'USD') totalUSD += destClearance;
        else totalCNY += destClearance;
        
        const otherFee = parseFloat(document.getElementById('otherFee')?.value || 0);
        const otherCurr = document.getElementById('otherFeeCurr')?.value;
        if (otherCurr === 'USD') totalUSD += otherFee;
        else totalCNY += otherFee;
    } else if (transportMode === '空运') {
        const rate = parseFloat(document.getElementById('airFreightRate')?.value || 0);
        const rateCurr = document.getElementById('airFreightRateCurr')?.value;
        const airTotal = rate * weight;
        
        const airTotalSpan = document.getElementById('airFreightTotal');
        if (airTotalSpan) airTotalSpan.innerText = airTotal.toFixed(2);
        
        if (rateCurr === 'USD') totalUSD += airTotal;
        else totalCNY += airTotal;
        
        const pickupFee = parseFloat(document.getElementById('pickupFee')?.value || 0);
        const pickupCurr = document.getElementById('pickupFeeCurr')?.value;
        if (pickupCurr === 'USD') totalUSD += pickupFee;
        else totalCNY += pickupFee;
        
        const localFee = parseFloat(document.getElementById('localFee')?.value || 0);
        const localCurr = document.getElementById('localFeeCurr')?.value;
        if (localCurr === 'USD') totalUSD += localFee;
        else totalCNY += localFee;
        
        const destClearance = parseFloat(document.getElementById('destClearance')?.value || 0);
        const destCurr = document.getElementById('destClearanceCurr')?.value;
        if (destCurr === 'USD') totalUSD += destClearance;
        else totalCNY += destClearance;
        
        const otherFee = parseFloat(document.getElementById('otherFee')?.value || 0);
        const otherCurr = document.getElementById('otherFeeCurr')?.value;
        if (otherCurr === 'USD') totalUSD += otherFee;
        else totalCNY += otherFee;
    }
    
    let displayText = `总价：$${totalUSD.toFixed(2)} USD`;
    if (totalCNY > 0) {
        displayText += ` + ¥${totalCNY.toFixed(2)} CNY`;
    }
    const totalDiv = document.getElementById('totalPriceDisplay');
    if (totalDiv) totalDiv.innerHTML = displayText;
    
    return { totalUSD, totalCNY };
}

// ========== 保存报价 ==========
function saveQuote() {
    const records = getRecords();
    const inquiry = records.find(r => r.id === currentQuoteInquiryId);
    if (!inquiry) return;
    
    let quote = {};
    const weight = parseFloat(inquiry.weight) || 0;
    
    if (inquiry.transportMode === '海运') {
        quote = {
            oceanFreight: parseFloat(document.getElementById('oceanFreight')?.value || 0),
            oceanFreightCurr: document.getElementById('oceanFreightCurr')?.value,
            pickupFee: parseFloat(document.getElementById('pickupFee')?.value || 0),
            pickupFeeCurr: document.getElementById('pickupFeeCurr')?.value,
            localFee: parseFloat(document.getElementById('localFee')?.value || 0),
            localFeeCurr: document.getElementById('localFeeCurr')?.value,
            destClearance: parseFloat(document.getElementById('destClearance')?.value || 0),
            destClearanceCurr: document.getElementById('destClearanceCurr')?.value,
            otherFee: parseFloat(document.getElementById('otherFee')?.value || 0),
            otherFeeCurr: document.getElementById('otherFeeCurr')?.value,
            transportMode: '海运'
        };
    } else if (inquiry.transportMode === '空运') {
        const rate = parseFloat(document.getElementById('airFreightRate')?.value || 0);
        const rateCurr = document.getElementById('airFreightRateCurr')?.value;
        quote = {
            airFreightRate: rate,
            airFreightRateCurr: rateCurr,
            airFreightTotal: rate * weight,
            pickupFee: parseFloat(document.getElementById('pickupFee')?.value || 0),
            pickupFeeCurr: document.getElementById('pickupFeeCurr')?.value,
            localFee: parseFloat(document.getElementById('localFee')?.value || 0),
            localFeeCurr: document.getElementById('localFeeCurr')?.value,
            destClearance: parseFloat(document.getElementById('destClearance')?.value || 0),
            destClearanceCurr: document.getElementById('destClearanceCurr')?.value,
            otherFee: parseFloat(document.getElementById('otherFee')?.value || 0),
            otherFeeCurr: document.getElementById('otherFeeCurr')?.value,
            transportMode: '空运'
        };
    }
    
    const totals = calculateTotalPrice(inquiry.transportMode, weight);
    quote.totalUSD = totals.totalUSD;
    quote.totalCNY = totals.totalCNY;
    quote.createdAt = new Date().toISOString();
    
    inquiry.quote = quote;
    
    const index = records.findIndex(r => r.id === currentQuoteInquiryId);
    if (index !== -1) {
        records[index] = inquiry;
        saveRecords(records);
    }
    
    closeQuoteModal();
    renderRecords();
    alert('报价已保存！');
}

function closeQuoteModal() {
    document.getElementById('quoteModal').style.display = 'none';
    currentQuoteInquiryId = null;
}

// ========== 查看报价弹窗 ==========
function viewQuote(inquiryId) {
    currentViewInquiryId = inquiryId;
    const records = getRecords();
    const inquiry = records.find(r => r.id === inquiryId);
    if (!inquiry || !inquiry.quote) {
        alert('暂无报价信息，请先添加报价');
        return;
    }
    
    const quoteText = generateQuoteText(inquiry);
    document.getElementById('viewQuoteBody').innerHTML = quoteText.replace(/\n/g, '<br>');
    document.getElementById('viewQuoteModal').style.display = 'block';
}

function closeViewQuoteModal() {
    document.getElementById('viewQuoteModal').style.display = 'none';
    currentViewInquiryId = null;
}

function copyQuoteToClipboard() {
    if (!currentViewInquiryId) return;
    const records = getRecords();
    const inquiry = records.find(r => r.id === currentViewInquiryId);
    if (!inquiry || !inquiry.quote) return;
    
    const quoteText = generateQuoteText(inquiry);
    navigator.clipboard.writeText(quoteText).then(() => {
        alert('✅ 报价已复制到剪贴板，可以发给客户了！');
    });
}

function editFromView() {
    if (currentViewInquiryId) {
        closeViewQuoteModal();
        openQuoteModal(currentViewInquiryId);
    }
}