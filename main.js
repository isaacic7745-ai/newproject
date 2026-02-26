// State Management
let cafeList = JSON.parse(localStorage.getItem('cafeList')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');
const mainContent = document.getElementById('main-content');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchLink = document.getElementById('auth-switch-link');
const authSwitchText = document.getElementById('auth-switch-text');
const logoutBtn = document.getElementById('logout-btn');

const cafeListContainer = document.getElementById('cafe-list');
const searchInput = document.getElementById('search-input');
const themeBtn = document.getElementById('theme-btn');
const cafeForm = document.getElementById('cafe-form');
const body = document.body;

let isLoginMode = true;

// --- Authentication Logic ---

function updateAuthUI() {
    if (currentUser) {
        authOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        renderCafes();
    } else {
        authOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
    }
}

authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? '로그인' : '회원가입';
    authSubmitBtn.textContent = isLoginMode ? '로그인' : '회원가입';
    authSwitchText.innerHTML = isLoginMode 
        ? '계정이 없으신가요? <a href="#" id="auth-switch-link">회원가입</a>'
        : '이미 계정이 있으신가요? <a href="#" id="auth-switch-link">로그인</a>';
    
    // Re-bind the link event listener since we replaced the HTML
    document.getElementById('auth-switch-link').addEventListener('click', arguments.callee);
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (isLoginMode) {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateAuthUI();
        } else {
            alert('이메일 또는 비밀번호가 일치하지 않습니다.');
        }
    } else {
        if (users.find(u => u.email === email)) {
            alert('이미 존재하는 이메일입니다.');
            return;
        }
        const newUser = { email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        updateAuthUI();
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

// --- Cafe Management Logic ---

function renderCafes(filter = '') {
    if (!cafeListContainer) return;
    cafeListContainer.innerHTML = '';
    
    const filteredCafes = cafeList.filter(cafe => 
        (cafe.region && cafe.region.toLowerCase().includes(filter.toLowerCase())) || 
        (cafe.name && cafe.name.toLowerCase().includes(filter.toLowerCase()))
    );

    filteredCafes.forEach((cafe, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cafe.region}</td>
            <td>${cafe.name}</td>
            <td><a href="${cafe.link}" target="_blank">방문하기</a></td>
            <td>
                ${cafe.note}
                <button class="delete-btn" onclick="deleteCafe(${index})" style="margin-left: 10px; padding: 2px 5px; font-size: 10px; cursor: pointer; background: #ff4d4d; color: white; border: none; border-radius: 3px;">삭제</button>
            </td>
        `;
        cafeListContainer.appendChild(row);
    });

    if (filteredCafes.length === 0) {
        cafeListContainer.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">데이터가 없습니다. 위 양식을 통해 추가해 보세요!</td></tr>';
    }
}

if (cafeForm) {
    cafeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCafe = {
            region: document.getElementById('input-region').value,
            name: document.getElementById('input-name').value,
            link: document.getElementById('input-link').value,
            note: document.getElementById('input-note').value
        };
        cafeList.push(newCafe);
        localStorage.setItem('cafeList', JSON.stringify(cafeList));
        cafeForm.reset();
        renderCafes(searchInput.value);
    });
}

window.deleteCafe = function(index) {
    if (confirm('정말 삭제하시겠습니까?')) {
        cafeList.splice(index, 1);
        localStorage.setItem('cafeList', JSON.stringify(cafeList));
        renderCafes(searchInput.value);
    }
};

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderCafes(e.target.value);
    });
}

// Initial UI Setup
updateAuthUI();
