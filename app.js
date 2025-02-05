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
    const goToWebsiteBtn = document.getElementById('go-to-website-btn');
    const copyLinkBtn = document.getElementById('copy-link-btn');

    window.onload = () => {
        let fullscreenActivated = false; // ตัวแปรเช็คว่าเปิดเต็มหน้าจอแล้วหรือยัง
    
        document.body.addEventListener('click', () => {
            if (!fullscreenActivated) { // ถ้ายังไม่เปิดเต็มหน้าจอ
                const elem = document.documentElement; // ทำให้ทั้งหน้าเว็บเต็มจอ
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.mozRequestFullScreen) { // สำหรับ Firefox
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) { // สำหรับ Chrome, Safari และ Opera
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { // สำหรับ IE/Edge
                    elem.msRequestFullscreen();
                }
                fullscreenActivated = true; // ตั้งค่าตัวแปรให้เป็น true เพื่อไม่ให้ทำงานอีก
            }
        });
    };

    // โหลดข้อมูลจากฐานข้อมูล
    loadBackgroundVideo();
    loadCartoonsFromLocalStorage();
    loadBackgroundMusic();

    function saveToLocalStorage(imageSrc, message, userMessage) {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        cartoons.push({ imageSrc, message, userMessage });
        localStorage.setItem('cartoons', JSON.stringify(cartoons));

        const cartoonCount = document.getElementById('cartoon-count');
        cartoonCount.textContent = cartoons.slice().length;

        let totalCartoonCount = parseInt(localStorage.getItem('totalCartoonCount')) || 0;
        totalCartoonCount++;
        localStorage.setItem('totalCartoonCount', totalCartoonCount);
    }

    function loadCartoonsFromLocalStorage() {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        const recentCartoons = cartoons.slice(-10);

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
    
        // เก็บข้อมูลจาก input fields
        const userMessageInput = document.getElementById('user-message');
        const cartoonMessageInput = document.getElementById('cartoon-message');
    
        const userMessage = userMessageInput.value.trim();
        const cartoonMessage = cartoonMessageInput.value.trim();
    
        if (!userMessage || !cartoonMessage) {
            alert("กรุณากรอกชื่อและคำอวยพรให้ครบถ้วน");
            return;
        }
    
        
        const resizeImage = (img) => {
            const maxWidth = 300;
            const maxHeight = 300;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
    
            let width = img.width;
            let height = img.height;
    
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width * maxHeight / height);
                    height = maxHeight;
                }
            }
    
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
    
            return canvas.toDataURL('image/png');
        };
    
        // ถ้าอัพโหลดรูป
        if (imageUploadInput.files.length > 0) {
            const file = imageUploadInput.files[0];
            const fileType = file.type;
    
            if (fileType === 'image/gif') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imageSrc = e.target.result;
                    const cartoonImage = document.createElement('div');
                    cartoonImage.classList.add('cartoon-moving');
                    const img = document.createElement('img');
                    img.src = imageSrc;
                    img.style.width = '150px';
                    img.style.height = 'auto';
                    cartoonImage.appendChild(img);

                    const text = document.createElement('div');
                    text.innerHTML = `<strong>${userMessage}</strong><br>${cartoonMessage}`;
                    text.classList.add('cartoon-text');
                    cartoonImage.appendChild(text);

                    cartoonImage.style.top = `${Math.random() * 70 + 10}%`;
                    const randomSpeed = Math.random() * 5 + 3;
                    cartoonImage.style.animationDuration = `${randomSpeed}s`;
                    document.body.appendChild(cartoonImage);
                    cartoonImage.addEventListener('animationend', () => {
                        cartoonImage.remove();
                    });
                };
                reader.readAsDataURL(file);
            } else if (fileType.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const imageSrc = resizeImage(img);
                        addRandomCartoon(imageSrc, cartoonMessage, userMessage);
                        saveToLocalStorage(imageSrc, cartoonMessage, userMessage);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                alert("ไฟล์ที่อัพโหลดต้องเป็นรูปภาพ (.png, .jpg, .gif)");
                return;
            }
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
                const randomCartoons = getRandomCartoons(data, 20);
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

        // Set a random speed for the animation
        const randomSpeed = Math.random() * 10 + 10; // Random speed between 3s and 8s
        cartoonImage.style.animationDuration = `${randomSpeed}s`;

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
        fetch('http://127.0.0.1/Event/background.php')
            .then(response => response.json())
            .then(data => {
                const video = document.getElementById('video-background');
                const gifBackground = document.getElementById('gif-background');

                const backgroundData = data.find(item => item.background_path && (item.background_path.endsWith('.gif') || item.background_path.endsWith('.mp4')));
                if (backgroundData) {
                    if (backgroundData.background_path.endsWith('.gif')) {
                        // Use GIF
                        gifBackground.src = backgroundData.background_path;
                        gifBackground.style.display = 'block';
                        video.style.display = 'none';
                    } else if (backgroundData.background_path.endsWith('.mp4')) {
                        // Use video
                        video.src = backgroundData.background_path;
                        video.style.display = 'block';
                        gifBackground.style.display = 'none';
                    }
                } else {
                    console.warn('No valid background found in the data.');
                }
            })
            .catch(error => console.error('Error fetching background data:', error));
    }

    // ฟังก์ชันโหลดเพลง
    function loadBackgroundMusic() {
        fetch('http://127.0.0.1/Event/background.php')
            .then(response => response.json())
            .then(data => {
                const audioElement = document.getElementById('background-music');
                const backgroundMusicData = data.find(item => item.music && item.music.endsWith('.mp3'));
                if (backgroundMusicData) {
                    audioElement.src = backgroundMusicData.music;
                    audioElement.loop = true;
                    audioElement.style.display = 'block'; // Show audio element if music is available
                } else {
                    console.warn('No audio background found in the data.');
                    audioElement.style.display = 'none'; // Hide audio element if no music
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

    goToWebsiteBtn.addEventListener('click', () => {
        window.open('https://www.jjmall.co.th/', '_blank');
    });

    copyLinkBtn.addEventListener('click', () => {
        const link = 'https://yourwebsite.com'; 
        navigator.clipboard.writeText(link).then(() => {
            const toast = document.getElementById('toast');
            toast.style.display = 'block'; // Show the toast

            setTimeout(() => {
                toast.style.display = 'none'; // Hide the toast after 3 seconds
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });
});
