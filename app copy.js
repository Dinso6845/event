document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('upload-modal');
    const btn = document.getElementById('create-greeting-btn');
    const span = document.querySelector('.close');
    const cartoonSelection = document.getElementById('cartoon-selection');
    const submitBtn = document.getElementById('submit-btn');
    const imageUploadInput = document.getElementById('image-upload');
    let selectedCartoon = null;
    const toggleMusicBtn = document.getElementById('toggle-music-btn');
    const audioElement = document.getElementById('background-music');
    const musicIcon = document.getElementById('music-icon');

    // โหลดข้อมูลจากฐานข้อมูล
    loadBackgroundVideo();
    loadCartoonsFromLocalStorage();
    loadBackgroundMusic();

    function saveToLocalStorage(imageSrc, message, userMessage) {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        cartoons.push({ imageSrc, message, userMessage });
        localStorage.setItem('cartoons', JSON.stringify(cartoons));

        const cartoonCount = document.getElementById('cartoon-count');
        cartoonCount.textContent = cartoons.slice(-20).length;

        let totalCartoonCount = parseInt(localStorage.getItem('totalCartoonCount')) || 0;
        totalCartoonCount++;
        localStorage.setItem('totalCartoonCount', totalCartoonCount);
    }

    function loadCartoonsFromLocalStorage() {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        const recentCartoons = cartoons.slice(-20);

        const cartoonCount = document.getElementById('cartoon-count');
        cartoonCount.textContent = recentCartoons.length;

        recentCartoons.forEach((cartoon, index) => {
            setTimeout(() => {
                addRandomCartoon(cartoon.imageSrc, cartoon.message, cartoon.userMessage);
            }, index * 2000);
        });
    }

    // เปิด modal
    btn?.addEventListener('click', () => {
        modal.style.display = 'block';
        fetchCartoons();
        fetchGreetingMessage();
    });

    // ปิด modal
    span?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // กด submit
    submitBtn?.addEventListener('click', () => {
        if (!selectedCartoon && !imageUploadInput.files.length) {
            alert("กรุณาเลือกการ์ตูนหรืออัพโหลดรูป");
            return;
        }

        // เก็บ input elements ลงในตัวแปร
        const userMessageInput = document.getElementById('user-message');
        const cartoonMessageInput = document.getElementById('cartoon-message');

        const userMessage = userMessageInput.value.trim();
        const cartoonMessage = cartoonMessageInput.value.trim();

        if (!userMessage || !cartoonMessage) {
            alert("กรุณากรอกชื่อและคำอวยพรให้ครบถ้วน");
            return;
        }

        // ถ้าอัพโหลดรูป
        if (imageUploadInput.files.length > 0) {
            const file = imageUploadInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageSrc = e.target.result;
                addRandomCartoon(imageSrc, cartoonMessage, userMessage);
                saveToLocalStorage(imageSrc, cartoonMessage, userMessage);
            };
            reader.readAsDataURL(file);
        } else {
            // ถ้าเลือกการ์ตูนจากที่มี
            addRandomCartoon(selectedCartoon.image_path, cartoonMessage, userMessage);
            saveToLocalStorage(selectedCartoon.image_path, cartoonMessage, userMessage);
        }

        // รีเซ็ตค่าช่องข้อความและ input
        userMessageInput.value = '';
        cartoonMessageInput.value = '';
        imageUploadInput.value = '';
        modal.style.display = 'none';
    });

    // โหลดการ์ตูน
    function fetchCartoons() {
        fetch('http://127.0.0.1/Event/get_cartoons.php')
            .then(response => response.json())
            .then(data => {
                const randomCartoons = getRandomCartoons(data, 5);
                cartoonSelection.innerHTML = '';
                if (randomCartoons.length === 0) {
                    cartoonSelection.innerHTML = '<p>ไม่พบการ์ตูนในระบบ</p>';
                    return;
                }
                randomCartoons.forEach(cartoon => {
                    const img = document.createElement('img');
                    img.src = cartoon.image_path;
                    img.alt = cartoon.name;
                    img.style.width = '100px';
                    img.style.margin = '5px';
                    img.classList.add('cartoon-item');
                    img.addEventListener('click', () => {
                        document.querySelectorAll('.cartoon-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        img.classList.add('selected');
                        selectedCartoon = cartoon;
                    });
                    cartoonSelection.appendChild(img);
                });
            })
            .catch(error => console.error('Error fetching cartoons:', error));
    }

    // ฟังก์ชันเพิ่มการ์ตูนที่เคลื่อนที่
    function addRandomCartoon(imageSrc, message, userMessage) {
        const cartoonImage = document.createElement('div');
        cartoonImage.classList.add('cartoon-moving');
        const img = document.createElement('img');
        img.src = imageSrc;
        cartoonImage.appendChild(img);

        const text = document.createElement('div');
        text.innerHTML = `<strong>${userMessage}</strong><br>${message}`;
        text.classList.add('cartoon-text');
        cartoonImage.appendChild(text);

        cartoonImage.style.top = `${Math.random() * 70 + 10}%`;

        document.body.appendChild(cartoonImage);
        cartoonImage.addEventListener('animationend', () => {
            cartoonImage.remove();
        });
    }

    function getRandomCartoons(cartoonArray, count) {
        const shuffled = cartoonArray.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // ฟังก์ชันดึงข้อความจากฐานข้อมูล
    function fetchGreetingMessage() {
        fetch('http://127.0.0.1/Event/background.php')
            .then(response => response.json())
            .then(data => {
                const greetingMessage = data[0]?.h1;
                if (greetingMessage) {
                    document.querySelector('#upload-modal h1').textContent = greetingMessage;
                } else {
                    console.warn('No h1 message found in the data.');
                }
            })
            .catch(error => console.error('Error fetching greeting message:', error));
    }

    // ฟังก์ชันโหลดวิดีโอพื้นหลัง
    function loadBackgroundVideo() {
        fetch('http://127.0.0.1/Event/background.php') // URL สำหรับดึงข้อมูล
            .then(response => response.json())
            .then(data => {
                const video = document.getElementById('video-background');
                const gifBackground = document.getElementById('gif-background');

                const backgroundData = data.find(item => item.type === 'image' || item.type === 'video'); // ตรวจสอบข้อมูลทั้ง video และ image
                if (backgroundData) {
                    if (backgroundData.type === 'image' && backgroundData.background_path.endsWith('.gif')) {
                        // ใช้ GIF
                        gifBackground.src = backgroundData.background_path;
                        gifBackground.style.display = 'block';
                        video.style.display = 'none';
                    } else if (backgroundData.type === 'video' && backgroundData.background_path.endsWith('.mp4')) {
                        // ใช้วิดีโอ
                        video.src = backgroundData.background_path;
                        video.style.display = 'block';
                        gifBackground.style.display = 'none';
                    }
                } else {
                    console.warn('No background found in the database.');
                }
            })
            .catch(error => console.error('Error fetching background data:', error));
    }

    // ฟังก์ชันโหลดเพลง
    function loadBackgroundMusic() {
        fetch('http://127.0.0.1/Event/background.php')
            .then(response => response.json())
            .then(data => {
                const backgroundMusicData = data.find(item => item.music);
                if (backgroundMusicData && backgroundMusicData.music.endsWith('.mp3')) {
                    audioElement.src = backgroundMusicData.music;
                    audioElement.loop = true;
                } else {
                    console.warn('No audio background found in the database.');
                }
            })
            .catch(error => console.error('Error fetching background music:', error));
    }

    // ฟังก์ชันเปิด/ปิดเพลง
    toggleMusicBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            musicIcon.classList.remove('fa-volume-mute');
            musicIcon.classList.add('fa-volume-up');
        } else {
            audioElement.pause();
            musicIcon.classList.remove('fa-volume-up');
            musicIcon.classList.add('fa-volume-mute');
        }
    });
});
