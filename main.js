// Firebase Configuration
const firebaseConfig = {
    projectId: "mom-cafe-list-1772089964",
    appId: "1:578037896725:web:3d3b6365464dc233ea201c",
    storageBucket: "mom-cafe-list-1772089964.firebasestorage.app",
    apiKey: "AIzaSyA9q2WlNw9ySxMlx80U07xdI9nfbH-cNZE",
    authDomain: "mom-cafe-list-1772089964.firebaseapp.com",
    messagingSenderId: "578037896725",
    databaseURL: "https://mom-cafe-list-1772089964-default-rtdb.asia-southeast1.firebasedatabase.app"
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

const cafeListContainer = document.getElementById('cafe-list');
const searchInput = document.getElementById('search-input');
const themeBtn = document.getElementById('theme-btn');
const cafeForm = document.getElementById('cafe-form');
const inputSection = document.querySelector('.input-section');
const addBtn = document.getElementById('add-btn');
const body = document.body;

// --- Authentication Logic ---

function updateAuthUI() {
    if (currentUser) {
        authOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        
        const isAdmin = currentUser.username === '관리자';
        if (inputSection) {
            inputSection.style.display = isAdmin ? 'block' : 'none';
        }
        
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
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
});

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

// --- Firebase Realtime Database Logic ---

function migrateLocalData() {
    if (currentUser && currentUser.username === '관리자') {
        const localData = JSON.parse(localStorage.getItem('cafeList'));
        if (localData && localData.length > 0) {
            localData.forEach(cafe => {
                const { id, ...cleanData } = cafe;
                db.ref('cafes').push(cleanData);
            });
            localStorage.removeItem('cafeList');
            alert('기존 PC의 데이터를 클라우드로 동기화했습니다. 이제 모든 기기에서 확인 가능합니다!');
        }
    }
}

function loadCafes() {
    migrateLocalData();
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

        const cafeData = {
            region: document.getElementById('input-region').value,
            name: document.getElementById('input-name').value,
            link: document.getElementById('input-link').value,
            note: document.getElementById('input-note').value
        };

        if (editId) {
            db.ref('cafes/' + editId).set(cafeData).then(() => {
                editId = null;
                addBtn.textContent = '추가하기';
                addBtn.style.backgroundColor = 'var(--accent-color)';
                cafeForm.reset();
            }).catch(err => alert('수정 권한 오류가 발생했습니다. DB 설정을 확인해주세요.'));
        } else {
            db.ref('cafes').push(cafeData).then(() => {
                cafeForm.reset();
            }).catch(err => alert('추가 권한 오류가 발생했습니다. DB 설정을 확인해주세요.'));
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
    if (currentUser.username !== '관리자') {
        alert('권한이 없습니다.');
        return;
    }

    if (confirm('정말 삭제하시겠습니까?')) {
        db.ref('cafes/' + id).remove().catch(err => alert('삭제 권한 오류가 발생했습니다.'));
    }
};

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderCafes(e.target.value);
    });
}

// Initial UI Setup
updateAuthUI();
