const cafeList = [
    { region: '전국', name: '맘스홀릭 베이비', link: 'https://cafe.naver.com/imsanbu', note: '국내 최대 규모 임신/육아 카페' },
    { region: '서울/송파', name: '송파맘스', link: 'https://cafe.naver.com/songpamom', note: '송파 지역 대표 맘카페' },
    { region: '서울/강남', name: '강남엄마 vs 목동엄마', link: 'https://cafe.naver.com/gangmok', note: '강남/목동 교육 정보' },
    { region: '경기/수원', name: '수원맘 모여라', link: 'https://cafe.naver.com/suwonmom', note: '수원 지역 대표' },
    { region: '경기/분당', name: '분당 판교 위례 맘 카페', link: 'https://cafe.naver.com/bundangmam', note: '분당/판교 지역 정보' },
    { region: '경기/일산', name: '일산아지매', link: 'https://cafe.naver.com/ilsanajime', note: '일산 지역 활발한 커뮤니티' },
    { region: '인천', name: '소중한 인연', link: 'https://cafe.naver.com/isajun', note: '인천 지역 대표 맘카페' },
    { region: '부산', name: '부산맘 아기사랑', link: 'https://cafe.naver.com/pusanmom', note: '부산 지역 최대 규모' },
    { region: '대구', name: '대구맘', link: 'https://cafe.naver.com/daegumam', note: '대구 지역 대표 커뮤니티' },
    { region: '대전', name: '대전맘 유성맘', link: 'https://cafe.naver.com/daejeonmom', note: '대전 지역 정보 공유' },
    { region: '광주', name: '광주맘 수다방', link: 'https://cafe.naver.com/gjmommy', note: '광주 전남 지역 대표' },
    { region: '울산', name: '울산맘 모여라', link: 'https://cafe.naver.com/ulsanmam', note: '울산 지역 대표' },
    { region: '세종', name: '세종맘 모여라', link: 'https://cafe.naver.com/sejongmom', note: '세종시 지역 커뮤니티' },
    { region: '제주', name: '제주맘', link: 'https://cafe.naver.com/jejumom', note: '제주도 지역 정보' }
];

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
