// Firebase Configuration
const firebaseConfig = {
    projectId: "mom-cafe-list-1772089964",
    appId: "1:578037896725:web:3d3b6365464dc233ea201c",
    storageBucket: "mom-cafe-list-1772089964.firebasestorage.app",
    apiKey: "AIzaSyA9q2WlNw9ySxMlx80U07xdI9nfbH-cNZE",
    authDomain: "mom-cafe-list-1772089964.firebaseapp.com",
    messagingSenderId: "578037896725",
    databaseURL: "https://mom-cafe-list-1772089964-default-rtdb.firebaseio.com"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// State Management
let cafeList = [];
let users = [
    { username: '관리자', password: '1q2w3e4r' },
    { username: '이성민', password: '1234' },
    { username: '이한빛', password: '1234' },
    { username: '강도현', password: '1234' },
    { username: '가인표', password: '1234' },
    { username: '김하린', password: '1234' }
];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let editId = null;
let isSubmitting = false;
let clockInterval = null;

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');
const mainContent = document.getElementById('main-content');
const authForm = document.getElementById('auth-form');
const logoutBtn = document.getElementById('logout-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const excelUpload = document.getElementById('excel-upload');

const cafeListContainer = document.getElementById('cafe-list');
const searchInput = document.getElementById('search-input');
const themeBtn = document.getElementById('theme-btn');
const cafeForm = document.getElementById('cafe-form');
const inputSection = document.querySelector('.input-section');
const addBtn = document.getElementById('add-btn');
const body = document.body;

const displayUsername = document.getElementById('display-username');
const currentTimeDisplay = document.getElementById('current-time');

// Load External Library (SheetJS)
const script = document.createElement('script');
script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
document.head.appendChild(script);

// --- Authentication Logic ---

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ko-KR', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        const dateStr = now.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        currentTimeDisplay.textContent = `${dateStr} ${timeStr}`;
    }
    
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

function updateAuthUI() {
    if (currentUser) {
        authOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        
        displayUsername.textContent = currentUser.username;
        startClock();

        const isAdmin = currentUser.username === '관리자';
        if (inputSection) inputSection.style.display = isAdmin ? 'block' : 'none';
        if (exportBtn) exportBtn.style.display = isAdmin ? 'inline-block' : 'none';
        if (importBtn) importBtn.style.display = isAdmin ? 'inline-block' : 'none';
        loadCafes();
    } else {
        authOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
        if (clockInterval) clearInterval(clockInterval);
    }
}

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateAuthUI();
    } else {
        alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
});

logoutBtn.addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAuthUI();
    }
});

// --- Helper Functions ---
function normalizeLink(link) {
    if (!link) return "";
    return link.trim().toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");
}

// --- Theme Logic ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeBtn.textContent = '☀️ 라이트 모드';
}

themeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        themeBtn.textContent = '☀️ 라이트 모드';
        localStorage.setItem('theme', 'dark');
    } else {
        themeBtn.textContent = '🌙 다크 모드';
        localStorage.setItem('theme', 'light');
    }
});

// --- Import/Export Logic ---
if (importBtn) {
    importBtn.addEventListener('click', () => excelUpload.click());
    excelUpload.addEventListener('change', (e) => {
        if (!currentUser || currentUser.username !== '관리자') return;
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            if (confirm(`${data.length}개의 데이터를 클라우드에 추가하시겠습니까?`)) {
                data.forEach(item => {
                    const link = (item['카페링크'] || '').toString().trim();
                    if (link) db.ref('cafes').push({
                        region: item['지역'] || '',
                        name: item['카페이름'] || '',
                        link: link,
                        note: item['비고'] || ''
                    });
                });
                alert('업로드가 완료되었습니다!');
                excelUpload.value = '';
            }
        };
        reader.readAsBinaryString(file);
    });
}

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (!window.XLSX || cafeList.length === 0) return;
        const data = cafeList.map(cafe => ({
            '지역': cafe.region, 
            '카페이름': cafe.name, 
            '카페링크': cafe.link, 
            '비고': cafe.note
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "맘카페 리스트");
        XLSX.writeFile(wb, `전국_맘카페_리스트_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
}

// --- Firebase Realtime Database Logic ---
function loadCafes() {
    db.ref('cafes').on('value', (snapshot) => {
        const data = snapshot.val();
        cafeList = [];
        if (data) {
            Object.keys(data).forEach(key => {
                cafeList.push({ id: key, ...data[key] });
            });
        }
        renderCafes(searchInput.value);
    }, (error) => {
        console.error("Firebase load error:", error);
    });
}

function renderCafes(filter = '') {
    if (!cafeListContainer) return;
    cafeListContainer.innerHTML = '';
    const isAdmin = currentUser && currentUser.username === '관리자';
    const filteredCafes = cafeList.filter(cafe => 
        (cafe.region && cafe.region.toLowerCase().includes(filter.toLowerCase())) || 
        (cafe.name && cafe.name.toLowerCase().includes(filter.toLowerCase()))
    );

    filteredCafes.forEach((cafe, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="No."><span>${index + 1}</span></td>
            <td data-label="지역"><span>${cafe.region}</span></td>
            <td data-label="카페이름"><span>${cafe.name}</span></td>
            <td data-label="카페링크"><a href="${cafe.link}" target="_blank" class="cafe-url">${cafe.link}</a></td>
            <td data-label="비고">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span>${cafe.note}</span>
                    ${isAdmin ? `
                        <div style="display: flex; gap: 5px; flex-shrink: 0; margin-left: 10px;">
                            <button class="edit-btn" onclick="editCafe('${cafe.id}')" style="padding: 5px 10px; font-size: 12px; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 5px;">수정</button>
                            <button class="delete-btn" onclick="deleteCafe('${cafe.id}')" style="padding: 5px 10px; font-size: 12px; cursor: pointer; background: #ff4d4d; color: white; border: none; border-radius: 5px;">삭제</button>
                        </div>
                    ` : ''}
                </div>
            </td>
        `;
        cafeListContainer.appendChild(row);
    });
    
    if (filteredCafes.length === 0) {
        cafeListContainer.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">데이터가 없습니다.</td></tr>';
    }
}

if (cafeForm) {
    cafeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting || !currentUser || currentUser.username !== '관리자') return;
        
        const regionInput = document.getElementById('input-region').value.trim();
        const nameInput = document.getElementById('input-name').value.trim();
        const inputLink = document.getElementById('input-link').value.trim();
        const noteInput = document.getElementById('input-note').value.trim();
        
        const normalizedInputLink = normalizeLink(inputLink);
        
        isSubmitting = true;
        addBtn.disabled = true;
        addBtn.textContent = '처리 중...';
        
        try {
            const snapshot = await db.ref('cafes').once('value');
            const currentData = snapshot.val() || {};
            const isDuplicate = Object.keys(currentData).some(key => 
                normalizeLink(currentData[key].link) === normalizedInputLink && key !== editId
            );
            
            if (isDuplicate) {
                alert('이미 등록 된 카페입니다.');
            } else {
                const cafeData = {
                    region: regionInput,
                    name: nameInput,
                    link: inputLink,
                    note: noteInput
                };
                
                if (editId) {
                    await db.ref('cafes/' + editId).set(cafeData);
                    editId = null;
                    addBtn.style.backgroundColor = 'var(--accent-color)';
                } else {
                    await db.ref('cafes').push(cafeData);
                }
                cafeForm.reset();
            }
        } catch (err) {
            console.error("Save error:", err);
            alert('데이터 저장 중 오류가 발생했습니다: ' + err.message);
        } finally {
            isSubmitting = false;
            addBtn.disabled = false;
            addBtn.textContent = editId ? '수정 완료' : '추가하기';
        }
    });
}

window.editCafe = function(id) {
    const cafe = cafeList.find(c => c.id === id);
    if (!cafe) return;
    document.getElementById('input-region').value = cafe.region || '';
    document.getElementById('input-name').value = cafe.name || '';
    document.getElementById('input-link').value = cafe.link || '';
    document.getElementById('input-note').value = cafe.note || '';
    editId = id;
    addBtn.textContent = '수정 완료';
    addBtn.style.backgroundColor = '#10b981';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteCafe = function(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        db.ref('cafes/' + id).remove().catch(err => alert("삭제 오류: " + err.message));
    }
};

if (searchInput) {
    searchInput.addEventListener('input', (e) => renderCafes(e.target.value));
}

updateAuthUI();
