document.addEventListener('DOMContentLoaded', async () => {
    const bannedList = document.getElementById('bannedList');

    // ดึงคำต้องห้ามจากฐานข้อมูล
    async function fetchBannedWords() {
        try {
            const response = await fetch('http://127.0.0.1/Event/settings.php');
            const bannedWords = await response.json();
            bannedList.innerHTML = ''; // ล้างรายการก่อนแสดงผลใหม่
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
                const response = await fetch('http://127.0.0.1/Event/settings.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word })
                });
                const data = await response.json();

                if (data.success) {
                    alert('✅ เพิ่มคำต้องห้ามสำเร็จ');
                    inputField.value = ''; // ล้างช่องกรอก
                    fetchBannedWords(); // อัปเดตรายการ
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
                const response = await fetch('http://127.0.0.1/Event/settings.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word })
                });
    
                const text = await response.text(); // อ่านค่าเป็นข้อความก่อน
                const data = JSON.parse(text); // แปลงเป็น JSON
    
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

    // ฟังก์ชันสำหรับเปิด/ปิดเมนู
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        menu.classList.toggle('show'); // เพิ่มหรือลบ class "show" เพื่อแสดง/ซ่อนเมนู
    };

    // ฟังก์ชันเปิดป๊อปอัพสร้างเทศกาล
    window.openCreateEventPopup = function () {
        document.getElementById('createEventPopup').style.display = 'block';
        document.getElementById('eventName').value = ''; // ล้างค่าในช่องกรอกชื่อเทศกาล
    };

    // ฟังก์ชันปิดป๊อปอัพ
    window.closeCreateEventPopup = function () {
        document.getElementById('createEventPopup').style.display = 'none';
    };

    // โหลดคำต้องห้ามเมื่อเปิดหน้า
    fetchBannedWords();
});
