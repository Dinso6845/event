document.addEventListener('DOMContentLoaded', async () => {
    const bannedList = document.getElementById('bannedList');
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    const settingUrl = `${protocol}//${hostname}${port ? `:${80}` : ''}/Event/settings.php`;

    async function fetchBannedWords() {
        try {
            const response = await fetch(settingUrl);
            const bannedWords = await response.json();
            bannedList.innerHTML = ''; 
            bannedWords.forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                li.innerHTML += ` <button class="delete-btn" onclick="removeBannedWord('${word}')"><i class="fa fa-trash"></i></button>`;
                bannedList.appendChild(li);
            });
        } catch (error) {
            console.error('🚨 Error fetching banned words:', error);
        }
    }

    // ฟังก์ชันเพิ่มคำต้องห้าม
    window.addBannedWord = async function () {
        const inputField = document.getElementById('bannedWord');
        const word = inputField.value.trim();

        if (word) {
            try {
                const response = await fetch(settingUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word })
                });
                const data = await response.json();

                if (data.success) {
                    alert('✅ เพิ่มคำต้องห้ามสำเร็จ');
                    inputField.value = ''; 
                    fetchBannedWords(); 
                } else {
                    alert('❌ เกิดข้อผิดพลาด');
                }
            } catch (error) {
                console.error('🚨 Error:', error);
            }
        } else {
            alert('⚠️ กรุณากรอกคำต้องห้าม');
        }
    };

    window.removeBannedWord = async function (word) {
        if (confirm(`คุณต้องการลบ "${word}" ใช่หรือไม่?`)) {
            try {
                // ลบรายการจากหน้าจอก่อน
                const bannedListItems = document.querySelectorAll('#bannedList li');
                bannedListItems.forEach(item => {
                    // ตรวจสอบว่า item.textContent ตรงกับ word หรือไม่
                    if (item.firstChild.textContent.trim() === word) {
                        item.remove();  // ลบรายการใน DOM
                    }
                });
    
                // ลบคำต้องห้ามจากฐานข้อมูล
                const response = await fetch(settingUrl, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word })
                });
    
                const text = await response.text(); 
                const data = JSON.parse(text); 
    
                if (data.success) {
                    alert('✅ ลบคำต้องห้ามสำเร็จ');
                } else {
                    alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
                }
            } catch (error) {
            //     console.error('🚨 Error:', error);
            //     alert('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
            }
        }
    };    

    document.getElementById('bannedWord').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addBannedWord(); 
        }
    });    

    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        const content = document.querySelector('.content');
        menu.classList.toggle('show');
        content.classList.toggle('shifted');
    };

    window.openCreateEventPopup = function () {
        document.getElementById('createEventPopup').style.display = 'block';
        document.getElementById('eventName').value = ''; 
    };

    window.closeCreateEventPopup = function () {
        document.getElementById('createEventPopup').style.display = 'none';
    };

    fetchBannedWords();
});
