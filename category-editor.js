function openCategoryEditor() {
    const editor = document.getElementById('categoryEditorUI');
    document.body.style.overflow = 'hidden';

    editor.innerHTML = `
        <div class="editor-header">
            <span class="editor-title">➕ 새 분야 추가</span>
            <button onclick="closeCategoryEditor()" class="btn-close">✕</button>
        </div>
        <div class="card" style="box-shadow: none; border: 1px solid var(--border);">
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 0.8rem; color: var(--sub-text); margin-bottom: 8px;">분야 이름</label>
                <input type="text" id="editorCatName" placeholder="예: 취미, 간식비..." style="width: 100%;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 0.8rem; color: var(--sub-text); margin-bottom: 8px;">초기 예산</label>
                <input type="number" id="editorCatBudget" placeholder="0" inputmode="numeric" style="width: 100%;">
            </div>
            <button class="btn-confirm" onclick="saveNewCategory()">분야 생성하기</button>
        </div>
    `;
    editor.style.display = 'flex';
}

function closeCategoryEditor() {
    document.getElementById('categoryEditorUI').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveNewCategory() {
    const name = document.getElementById('editorCatName').value.trim();
    const budget = parseInt(document.getElementById('editorCatBudget').value) || 0;
    if (!name) return alert("이름을 입력하세요.");
    if (data.categories[name]) return alert("이미 존재합니다.");
    // 새 분야 생성 시 로그 배열도 초기화
    data.categories[name] = { budget: budget, balance: budget, logs: [] };
    render();
    closeCategoryEditor();
}