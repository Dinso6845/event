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
    const goToFacebookBtn = document.getElementById('go-to-facebook-btn');
    let messageLink = ''; 
    let submitButtonText = '';
    let createGreetingButtonText = '';
    let createGreetingButtonColor = '';

    window.onload = () => {
        let fullscreenActivated = false; 
    
        document.body.addEventListener('click', () => {
            if (!fullscreenActivated) { 
                const elem = document.documentElement; 
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.mozRequestFullScreen) { 
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) { 
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { 
                    elem.msRequestFullscreen();
                }
                fullscreenActivated = true; // ตั้งค่าตัวแปรให้เป็น true เพื่อไม่ให้ทำงานอีก
            }
        });

        fetchEventNames(); 
        fetchMessage(); 
        fetchButtonTexts(); 
    };

    // โหลดข้อมูลจากฐานข้อมูล
    loadBackgroundVideo();
    loadCartoonsFromLocalStorage();
    loadBackgroundMusic();
    fetchGreetingMessage();
    updateCartoonCount();

    function saveToLocalStorage(imageSrc, message, userMessage, eventName) {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        cartoons.push({ imageSrc, message, userMessage, eventName });
        localStorage.setItem('cartoons', JSON.stringify(cartoons));

    }

    function updateCartoonCount() {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        const cartoonCount = document.getElementById('cartoon-count');
        cartoonCount.textContent = cartoons.length; // ตั้งค่าจำนวนการ์ตูน
    }

    function loadCartoonsFromLocalStorage() {
        // console.log('Saved cartoons:', JSON.parse(localStorage.getItem('cartoons'))); 
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        const recentCartoons = cartoons.slice(-10);

        const cartoonCount = document.getElementById('cartoon-count');
        cartoonCount.textContent = recentCartoons.length;

        recentCartoons.forEach((cartoon, index) => {
            setTimeout(() => {
                addRandomCartoon(cartoon.imageSrc, cartoon.message, cartoon.userMessage, cartoon.eventName);
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
        const eventNameInput = document.getElementById('event-name');
    
        const userMessage = userMessageInput.value.trim();
        const cartoonMessage = cartoonMessageInput.value.trim();
        const eventName = eventNameInput.value.trim();
    
        if (!userMessage || !cartoonMessage) {
            alert("กรุณากรอกชื่อและคำอวยพรให้ครบถ้วน");
            return;
        }
    
        if (!eventName) {
            console.warn('Event Name is empty!'); // ถ้า eventName ว่าง
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
                    const randomSpeed = Math.random() * 15 + 20;
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
                        addRandomCartoon(imageSrc, cartoonMessage, userMessage, eventName);
                        saveToLocalStorage(imageSrc, cartoonMessage, userMessage, eventName);
                        updateCartoonCount();
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
            addRandomCartoon(selectedCartoon.image_path, cartoonMessage, userMessage, eventName);
            saveToLocalStorage(selectedCartoon.image_path, cartoonMessage, userMessage, eventName);
            updateCartoonCount();
        }
    
        // รีเซ็ตค่าช่องข้อความและ input
        userMessageInput.value = '';
        cartoonMessageInput.value = '';
        imageUploadInput.value = '';
        eventNameInput.value = '';
        modal.style.display = 'none';

        fetchEventNames();
    });    
    
    // โหลดการ์ตูน
    function fetchCartoons() {
        fetch('http://127.0.0.1/Event/get_cartoons.php')
            .then(response => response.json())
            .then(data => {
                cartoonSelection.innerHTML = ''; // เคลียร์การ์ตูนที่มีอยู่ก่อนหน้า
                if (data.length === 0) {
                    cartoonSelection.innerHTML = '<p>ไม่พบการ์ตูนในระบบ</p>';
                    return;
                }
                // แสดงการ์ตูนทั้งหมดที่ดึงมา
                data.forEach(cartoon => {
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
    function addRandomCartoon(imageSrc, userMessage, cartoonMessage) {
        // Fetch data from background.php
        fetch('http://127.0.0.1/Event/background.php')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const eventName = data[0]?.name;
                    const message = data[0]?.message; 
                    const toptextColor = data[0]?.toptext_color;
                    const senderColor = data[0]?.sender_color; 

                    const cartoonImage = document.createElement('div');
                    cartoonImage.classList.add('cartoon-moving');
                    const img = document.createElement('img');
                    img.src = imageSrc;
                    cartoonImage.appendChild(img);

                    const text = document.createElement('div');
                    text.innerHTML = `<strong class="hidden">${eventName}</strong><br>
                    <strong style="color: ${senderColor};">${userMessage}</strong><br>
                    <span style="color: ${toptextColor};">${cartoonMessage}</span>`;
                    text.classList.add('cartoon-text');
                    cartoonImage.appendChild(text);
                    // console.log('Top Text Color:', toptextColor);

                    cartoonImage.style.top = `${Math.random() * 70 + 10}%`;

                    const randomSpeed = Math.random() * 10 + 15;
                    cartoonImage.style.animationDuration = `${randomSpeed}s`;

                    document.body.appendChild(cartoonImage);
                    cartoonImage.addEventListener('animationend', () => {
                        cartoonImage.remove();
                    });
                } else {
                    console.warn('No data found in the response.');
                }
            })
            .catch(error => console.error('Error fetching greeting message:', error));
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
                // console.log("Data from API:", data);
                const buttonColor = data[0]?.button_color;
                const textColor = data[0]?.text_color;
                const toptextColor = data[0]?.toptext_color;

                if (buttonColor) {
                    btn.style.backgroundColor = buttonColor;
                } else {
                    console.warn('No button color found in the data.');
                }

                if (textColor) {
                    if (textColor) {
                        btn.style.color = toptextColor;
                    } else {
                        console.warn('Message element not found.');
                    }
                } else {
                    console.warn('No top text color found in the data.');
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

    goToFacebookBtn.addEventListener('click', () => {
        window.open('https://www.facebook.com/JJMall.Chatuchak', '_blank');
    });

    copyLinkBtn.addEventListener('click', () => {
        const link = messageLink
        navigator.clipboard.writeText(link).then(() => {
            const toast = document.getElementById('toast');
            toast.style.display = 'block'; // แสดง toast

            setTimeout(() => {
                toast.style.display = 'none'; // ซ่อน toast หลังจาก 3 วินาที
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });

    function fetchEventNames() {
        fetch('http://127.0.0.1/Event/background.php') // URL ของไฟล์ PHP
            .then(response => response.json())
            .then(data => {
                const eventNameInput = document.getElementById('event-name');
                if (data.length > 0) {
                    // ถ้ามีข้อมูล active ให้เลือกชื่อแรกมาใส่ใน input
                    eventNameInput.value = data[0].name; // ใส่ชื่อเหตุการณ์ที่ active
                } else {
                    console.warn('No active events found.');
                }
            })
            .catch(error => console.error('Error fetching event names:', error));
    }

    // ฟังก์ชันดึงข้อความจากฐานข้อมูล
    function fetchMessage() {
        fetch('http://127.0.0.1/Event/background.php')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    messageLink = data[0].message; 
                } else {
                    console.warn('No messages found.');
                }
            })
            .catch(error => console.error('Error fetching messages:', error));
    }

    // ฟังก์ชันดึงข้อความจากฐานข้อมูล
    function fetchButtonTexts() {
        fetch('http://127.0.0.1/Event/background.php') 
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    submitButtonText = data[0].text_button; 
                    createGreetingButtonText = data[0].text_button;
                    createGreetingButtonColor = data[0].text_color;
                    updateButtonTexts(); 
                } else {
                    console.warn('No button texts found.');
                }
            })
            .catch(error => console.error('Error fetching button texts:', error));
    }

    // ฟังก์ชันอัปเดตข้อความปุ่ม
    function updateButtonTexts() {
        const submitBtn = document.getElementById('submit-btn');
        const createGreetingBtn = document.getElementById('create-greeting-btn');

        if (submitBtn) {
            submitBtn.textContent = submitButtonText; 
        }

        if (createGreetingBtn) {
            createGreetingBtn.textContent = createGreetingButtonText;
            createGreetingBtn.style.color = createGreetingButtonColor;
        }
    }
});
