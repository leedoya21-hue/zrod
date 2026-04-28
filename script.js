const defaultData = {
    totalBudget: 1000000,
    isTotalCollapsed: true,
    selectedCategory: null,
    categories: {
        "교통비": { budget: 100000, balance: 100000, logs: [], subs: ["택시", "버스", "지하철"] },
        "외식비": { budget: 300000, balance: 300000, logs: [], subs: ["배달", "식당", "카페"] }
    }
};

let data;
try {
    const saved = localStorage.getItem('budgetData');
    data = saved ? JSON.parse(saved) : defaultData;
} catch (e) {
    data = defaultData;
}

function render() {
    const list = document.getElementById('categoryList');
    const summaryAmount = document.getElementById('summaryAmount');
    const selectedNameDisplay = document.getElementById('selectedCategoryName');
    const subContainer = document.getElementById('subCategoryContainer');
    const subSelect = document.getElementById('spendingSubCategory');
    
    // 중앙 예산 제어
    document.getElementById('totalBudgetDisplay').innerText = data.totalBudget.toLocaleString();
    summaryAmount.innerText = data.totalBudget.toLocaleString();
    const details = document.getElementById('totalBudgetDetails');
    const collapseBtn = document.getElementById('collapseBtn');
    details.style.display = data.isTotalCollapsed ? 'none' : 'block';
    collapseBtn.style.display = data.isTotalCollapsed ? 'none' : 'block';

    list.innerHTML = '';
    
    // 지출 섹션의 세부 항목 업데이트
    if (data.selectedCategory && data.categories[data.selectedCategory]) {
        selectedNameDisplay.innerText = data.selectedCategory;
        const subs = data.categories[data.selectedCategory].subs || [];
        if (subs.length > 0) {
            subContainer.style.display = 'block';
            subSelect.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('') + `<option value="기타">기타</option>`;
        } else {
            subContainer.style.display = 'none';
        }
    } else {
        selectedNameDisplay.innerText = "분야를 선택해주세요";
        subContainer.style.display = 'none';
    }

    for (let name in data.categories) {
        const cat = data.categories[name];
        const isSelected = data.selectedCategory === name;
        list.innerHTML += `
            <div class="category-item ${isSelected ? 'selected' : ''}" onclick="selectCategory('${name}')">
                <div class="category-info">
                    <span class="category-name">${name}</span>
                    <span class="category-budget">설정액: ${cat.budget.toLocaleString()}</span>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="balance" style="color: ${cat.balance >= 0 ? '#188038' : '#d93025'}">
                        ${cat.balance.toLocaleString()}원
                    </span>
                    <button class="btn-list" onclick="event.stopPropagation(); openSubEditor('${name}')">리스트</button>
                    <button class="btn-log" onclick="event.stopPropagation(); openLogViewer('${name}')">로그</button>
                    <button class="btn-del" onclick="event.stopPropagation(); deleteCategory('${name}')">삭제</button>
                </div>
            </div>
        `;
    }
    localStorage.setItem('budgetData', JSON.stringify(data));
}

// 지출 확정 (세부 항목 포함)
function addSpending() {
    if (!data.selectedCategory) return alert("분야를 선택하세요.");
    const amountInput = document.getElementById('spendingAmount');
    const subSelect = document.getElementById('spendingSubCategory');
    const amount = parseInt(amountInput.value);
    const subName = subSelect.value || "일반";

    if (isNaN(amount) || amount <= 0) return alert("금액 확인");

    data.categories[data.selectedCategory].balance -= amount;
    
    // 로그에 세부 항목 정보 포함
    const now = new Date();
    if(!data.categories[data.selectedCategory].logs) data.categories[data.selectedCategory].logs = [];
    data.categories[data.selectedCategory].logs.unshift({
        id: Date.now(),
        date: now.toISOString(),
        type: '지출',
        sub: subName, // 세부 항목 이름 저장
        amount: amount,
        afterBalance: data.categories[data.selectedCategory].balance
    });

    amountInput.value = 0;
    render();
}

// [세부 항목 관리] 전용 UI 열기
function openSubEditor(name) {
    const editor = document.getElementById('subCategoryEditorUI');
    document.body.style.overflow = 'hidden';
    const subs = data.categories[name].subs || [];

    let subHtml = subs.map((s, i) => `
        <div class="sub-item">
            <span>${s}</span>
            <button class="btn-del-mini" style="width:auto;" onclick="deleteSub('${name}', ${i})">삭제</button>
        </div>
    `).join('');

    editor.innerHTML = `
        <div class="editor-header">
            <span class="editor-title">🏷️ ${name} 리스트</span>
            <button onclick="closeSubEditor()" class="btn-close">✕</button>
        </div>
        <div class="card" style="box-shadow:none; border:1px solid var(--border);">
            <div style="display:flex; gap:8px;">
                <input type="text" id="newSubName" placeholder="세부 항목 입력 (예: 택시)">
                <button onclick="addSub('${name}')" style="width:80px;">추가</button>
            </div>
        </div>
        <div style="flex:1; overflow-y:auto;">${subHtml || '<p style="text-align:center; color:#999; margin-top:20px;">세부 항목이 없습니다.</p>'}</div>
    `;
    editor.style.display = 'flex';
}

function addSub(catName) {
    const input = document.getElementById('newSubName');
    const val = input.value.trim();
    if (!val) return;
    if (!data.categories[catName].subs) data.categories[catName].subs = [];
    data.categories[catName].subs.push(val);
    render();
    openSubEditor(catName);
}

function deleteSub(catName, index) {
    data.categories[catName].subs.splice(index, 1);
    render();
    openSubEditor(catName);
}

function closeSubEditor() { document.getElementById('subCategoryEditorUI').style.display = 'none'; document.body.style.overflow = 'auto'; }

// 로그 뷰어 (세부 항목 표시)
function openLogViewer(name) {
    const viewer = document.getElementById('logViewerUI');
    const logs = data.categories[name].logs || [];
    document.body.style.overflow = 'hidden';

    let logHtml = logs.map(log => {
        const d = new Date(log.date);
        const dateStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
        const sign = log.type === '배분' ? '+' : '-';
        const typeColor = log.type === '배분' ? '#188038' : '#d93025';
        return `
            <div class="log-item">
                <div style="display:flex; flex-direction:column;">
                    <span class="log-date">${dateStr} <b>[${log.sub || log.type}]</b></span>
                    <span style="font-size:0.7rem; color:#80868b;">잔액: ${log.afterBalance.toLocaleString()}원</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="log-amount" style="color:${typeColor}">${sign}${log.amount.toLocaleString()}원</span>
                    <button class="btn-del-mini" onclick="deleteLog('${name}', ${log.id})">삭제</button>
                </div>
            </div>
        `;
    }).join('');

    viewer.innerHTML = `
        <div class="editor-header">
            <span class="editor-title">📜 ${name} 내역</span>
            <button onclick="closeLogViewer()" class="btn-close">✕</button>
        </div>
        <div class="log-container">${logHtml || '<p style="text-align:center; padding:50px;">기록 없음</p>'}</div>
    `;
    viewer.style.display = 'flex';
}

// 로그 삭제 (잔액 복구)
function deleteLog(catName, logId) {
    if (!confirm("기록을 삭제하고 잔액을 복구하시겠습니까?")) return;
    const cat = data.categories[catName];
    const idx = cat.logs.findIndex(l => l.id === logId);
    if (idx === -1) return;
    const log = cat.logs[idx];

    if (log.type === '지출') cat.balance += log.amount;
    else if (log.type === '배분') { cat.balance -= log.amount; data.totalBudget += log.amount; }
    else if (log.type === '환금') { cat.balance += log.amount; data.totalBudget -= log.amount; }

    cat.logs.splice(idx, 1);
    render();
    openLogViewer(catName);
}

// 기타 함수들
function closeLogViewer() { document.getElementById('logViewerUI').style.display = 'none'; document.body.style.overflow = 'auto'; }
function selectCategory(name) { data.selectedCategory = name; render(); }
function expandTotalBudget() { if (data.isTotalCollapsed) { data.isTotalCollapsed = false; render(); } }
function collapseTotalBudget(event) { event.stopPropagation(); data.isTotalCollapsed = true; render(); }
function distributeMoney() {
    if (!data.selectedCategory) return;
    const amount = parseInt(document.getElementById('distributeAmount').value);
    if (!amount || data.totalBudget < amount) return;
    data.totalBudget -= amount;
    data.categories[data.selectedCategory].balance += amount;
    addLog(data.selectedCategory, '배분', amount, data.categories[data.selectedCategory].balance);
    document.getElementById('distributeAmount').value = '';
    render();
}
function addLog(catName, type, amount, bal) {
    if(!data.categories[catName].logs) data.categories[catName].logs = [];
    data.categories[catName].logs.unshift({ id: Date.now(), date: new Date().toISOString(), type, amount, afterBalance: bal, sub: type });
}
function refundToTotal(name) {
    const amount = parseInt(prompt("환금액", data.categories[name].balance));
    if (!amount || data.categories[name].balance < amount) return;
    data.categories[name].balance -= amount;
    data.totalBudget += amount;
    addLog(name, '환금', amount, data.categories[name].balance);
    render();
}
function adjustAmount(v) { const i = document.getElementById('spendingAmount'); i.value = (parseInt(i.value) || 0) + v; }
function resetSpendingAmount() { document.getElementById('spendingAmount').value = 0; }
function deleteCategory(n) { if(confirm("삭제?")) { if(data.selectedCategory===n) data.selectedCategory=null; delete data.categories[n]; render(); } }
function exportData() { navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert("복사됨")); }
function importData() { const s = prompt("데이터 입력"); if(s) { data = JSON.parse(s); render(); } }
function resetAll() { if(confirm("초기화?")) { data = JSON.parse(JSON.stringify(defaultData)); render(); } }

render();