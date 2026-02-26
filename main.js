// State Management
let cafeList = JSON.parse(localStorage.getItem('cafeList')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [
    { username: '관리자', password: '1234' },
    { username: '이성민', password: '1234' }
];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let editIndex = -1; // To track which cafe is being edited

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
        
        // Only show input section to admin ('관리자')
        const isAdmin = currentUser.username === '관리자';
        if (inputSection) {
            inputSection.style.display = isAdmin ? 'block' : 'none';
        }
        
        renderCafes();
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

// --- Cafe Management Logic ---

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
            <td>${cafe.region}</td>
            <td>${cafe.name}</td>
            <td><a href="${cafe.link}" target="_blank">방문하기</a></td>
            <td>
                ${cafe.note}
                ${isAdmin ? `
                    <div style="margin-top: 5px;">
                        <button class="edit-btn" onclick="editCafe(${index})" style="padding: 2px 8px; font-size: 11px; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 3px; margin-right: 5px;">수정</button>
                        <button class="delete-btn" onclick="deleteCafe(${index})" style="padding: 2px 8px; font-size: 11px; cursor: pointer; background: #ff4d4d; color: white; border: none; border-radius: 3px;">삭제</button>
                    </div>
                ` : ''}
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
        
        // Security check
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

        if (editIndex > -1) {
            // Update existing
            cafeList[editIndex] = cafeData;
            editIndex = -1;
            addBtn.textContent = '추가하기';
            addBtn.style.backgroundColor = 'var(--accent-color)';
        } else {
            // Add new
            cafeList.push(cafeData);
        }

        localStorage.setItem('cafeList', JSON.stringify(cafeList));
        cafeForm.reset();
        renderCafes(searchInput.value);
    });
}

window.editCafe = function(index) {
    if (currentUser.username !== '관리자') return;
    
    const cafe = cafeList[index];
    document.getElementById('input-region').value = cafe.region;
    document.getElementById('input-name').value = cafe.name;
    document.getElementById('input-link').value = cafe.link;
    document.getElementById('input-note').value = cafe.note;
    
    editIndex = index;
    addBtn.textContent = '수정 완료';
    addBtn.style.backgroundColor = '#10b981'; // Green for edit mode
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteCafe = function(index) {
    if (currentUser.username !== '관리자') {
        alert('권한이 없습니다.');
        return;
    }

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
