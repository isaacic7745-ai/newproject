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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State Management
let cafeList = [];
let users = JSON.parse(localStorage.getItem('users')) || [
    { username: '관리자', password: '1234' },
    { username: '이성민', password: '1234' }
];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let editId = null;

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');
const mainContent = document.getElementById('main-content');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
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

// Load External Library (SheetJS)
function loadLibrary(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

loadLibrary("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js")
    .then(() => console.log('SheetJS Loaded'))
    .catch(() => console.error('Failed to load SheetJS'));

// --- Authentication Logic ---

function updateAuthUI() {
    if (currentUser) {
        authOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        
        const isAdmin = currentUser.username === '관리자';
        if (inputSection) {
            inputSection.style.display = isAdmin ? 'block' : 'none';
        }
        
        if (exportBtn) exportBtn.style.display = isAdmin ? 'inline-block' : 'none';
        if (importBtn) importBtn.style.display = isAdmin ? 'inline-block' : 'none';
        
        loadCafes();
    } else {
        authOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
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
        alert('아이디 또는 비밀번호가 일치하지 않거나, 발급되지 않은 계정입니다.');
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
    // 프로토콜(http, https) 및 www. 제거, 소문자화, 공백 제거, 끝 슬래시 제거
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

// --- Import Logic ---
if (importBtn) {
    importBtn.addEventListener('click', () => {
        if (!window.XLSX) {
            alert('라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        excelUpload.click();
    });
    
    excelUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert('파일에 데이터가 없거나 형식이 잘못되었습니다.');
                    return;
                }

                if (confirm(`${data.length}개의 데이터를 클라우드에 추가하시겠습니까?`)) {
                    let addedCount = 0;
                    let skippedCount = 0;

                    const promises = data.map(item => {
                        const rawLink = (item['카페링크'] || '').toString().trim();
                        if (!rawLink) {
                            skippedCount++;
                            return Promise.resolve();
                        }

                        const normalizedLink = normalizeLink(rawLink);
                        
                        // 중복 체크 (정규화된 링크 비교)
                        const isDuplicate = cafeList.some(c => normalizeLink(c.link) === normalizedLink);
                        
                        if (isDuplicate) {
                            skippedCount++;
                            return Promise.resolve();
                        }

                        addedCount++;
                        const cafeData = {
                            region: item['지역'] || '',
                            name: item['카페이름'] || '',
                            link: rawLink,
                            note: item['비고'] || ''
                        };
                        return db.ref('cafes').push(cafeData);
                    });
                    
                    Promise.all(promises).then(() => {
                        if (skippedCount > 0) {
                            alert(`업로드 완료! (추가: ${addedCount}건, 중복 제외: ${skippedCount}건)`);
                        } else {
                            alert('모든 데이터 업로드가 완료되었습니다!');
                        }
                        excelUpload.value = '';
                    }).catch(err => {
                        console.error(err);
                        alert('일부 데이터 업로드 중 오류가 발생했습니다.');
                    });
                }
            } catch (err) {
                alert('파일을 읽는 중 오류가 발생했습니다. 올바른 엑셀 파일인지 확인해주세요.');
            }
        };
        reader.readAsBinaryString(file);
    });
}

// --- Export Logic ---
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (!window.XLSX) {
            alert('라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        if (cafeList.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const dataToExport = cafeList.map(cafe => ({
            '지역': cafe.region,
            '카페이름': cafe.name,
            '카페링크': cafe.link,
            '비고': cafe.note
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "맘카페 리스트");

        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `전국_맘카페_리스트_${date}.xlsx`);
    });
}

// --- Firebase Realtime Database Logic ---

function migrateLocalData() {
    if (currentUser && currentUser.username === '관리자') {
        const localData = JSON.parse(localStorage.getItem('cafeList'));
        if (localData && localData.length > 0) {
            const promises = localData.map(cafe => {
                const { id, ...cleanData } = cafe;
                return db.ref('cafes').push(cleanData);
            });
            
            Promise.all(promises).then(() => {
                localStorage.removeItem('cafeList');
                alert('기존 PC의 데이터를 클라우드로 동기화했습니다!');
            });
        }
    }
}

function loadCafes() {
    migrateLocalData();
    
    // First, get the data once to ensure cafeList is populated immediately
    db.ref('cafes').once('value').then((snapshot) => {
        const data = snapshot.val();
        cafeList = [];
        if (data) {
            Object.keys(data).forEach(key => {
                cafeList.push({ id: key, ...data[key] });
            });
        }
        renderCafes(searchInput.value);
        
        // Then setup the real-time listener for future changes
        db.ref('cafes').on('value', (snapshot) => {
            const data = snapshot.val();
            cafeList = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    cafeList.push({ id: key, ...data[key] });
                });
            }
            renderCafes(searchInput.value);
        });
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

    filteredCafes.forEach((cafe) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="지역">${cafe.region}</td>
            <td data-label="카페이름">${cafe.name}</td>
            <td data-label="카페링크"><a href="${cafe.link}" target="_blank">방문하기</a></td>
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
        cafeListContainer.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">데이터가 없습니다.</td></tr>';
    }
}

if (cafeForm) {
    cafeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (currentUser.username !== '관리자') {
            alert('권한이 없습니다.');
            return;
        }

        const inputLink = document.getElementById('input-link').value.trim();
        if (!inputLink) {
            alert('카페 링크를 입력해주세요.');
            return;
        }
        
        const normalizedInputLink = normalizeLink(inputLink);

        // 중복 체크: 수정 중인 항목을 제외한 리스트에서 정규화된 링크 비교
        const isDuplicate = cafeList.some(cafe => {
            const existingNormalized = normalizeLink(cafe.link);
            return existingNormalized === normalizedInputLink && cafe.id !== editId;
        });

        if (isDuplicate) {
            alert('이미 등록 된 카페입니다.');
            return;
        }

        const cafeData = {
            region: document.getElementById('input-region').value,
            name: document.getElementById('input-name').value,
            link: inputLink,
            note: document.getElementById('input-note').value
        };

        if (editId) {
            db.ref('cafes/' + editId).set(cafeData).then(() => {
                editId = null;
                addBtn.textContent = '추가하기';
                addBtn.style.backgroundColor = 'var(--accent-color)';
                cafeForm.reset();
            }).catch(err => alert('수정 중 오류가 발생했습니다.'));
        } else {
            db.ref('cafes').push(cafeData).then(() => {
                cafeForm.reset();
            }).catch(err => alert('추가 중 오류가 발생했습니다.'));
        }
    });
}

window.editCafe = function(id) {
    if (currentUser.username !== '관리자') return;
    
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
    if (currentUser.username !== '관리자') return;

    if (confirm('정말 삭제하시겠습니까?')) {
        db.ref('cafes/' + id).remove().catch(err => alert('삭제 중 오류가 발생했습니다.'));
    }
};

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderCafes(e.target.value);
    });
}

// Initial UI Setup
updateAuthUI();
