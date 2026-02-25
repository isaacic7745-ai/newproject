const lottoNumbersContainer = document.querySelector('.lotto-numbers');
const generatorBtn = document.querySelector('#generator-btn');
const themeBtn = document.querySelector('#theme-btn');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeBtn.textContent = '☀️ Light Mode';
}

themeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        themeBtn.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        themeBtn.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    }
});

generatorBtn.addEventListener('click', () => {
    lottoNumbersContainer.innerHTML = '';
    const numbers = new Set();
    while (numbers.size < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }

    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

    for (const number of sortedNumbers) {
        const numberDiv = document.createElement('div');
        numberDiv.classList.add('lotto-number');
        numberDiv.textContent = number;
        lottoNumbersContainer.appendChild(numberDiv);
    }
});
