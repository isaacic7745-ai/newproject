const cafeList = [];

const cafeListContainer = document.getElementById('cafe-list');
const searchInput = document.getElementById('search-input');
const themeBtn = document.getElementById('theme-btn');
const body = document.body;

// Theme logic
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

// Render function
function renderCafes(filter = '') {
    cafeListContainer.innerHTML = '';
    
    const filteredCafes = cafeList.filter(cafe => 
        cafe.region.toLowerCase().includes(filter.toLowerCase()) || 
        cafe.name.toLowerCase().includes(filter.toLowerCase())
    );

    filteredCafes.forEach(cafe => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cafe.region}</td>
            <td>${cafe.name}</td>
            <td><a href="${cafe.link}" target="_blank">방문하기</a></td>
            <td>${cafe.note}</td>
        `;
        cafeListContainer.appendChild(row);
    });

    if (filteredCafes.length === 0) {
        cafeListContainer.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">검색 결과가 없습니다.</td></tr>';
    }
}

// Search event
searchInput.addEventListener('input', (e) => {
    renderCafes(e.target.value);
});

// Initial render
renderCafes();
