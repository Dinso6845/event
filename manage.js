document.addEventListener('DOMContentLoaded', () => {
    let festivals = [];
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // สร้าง URL ที่จะใช้ในการเชื่อมต่อ
    const baseUrl = `${protocol}//${hostname}${port ? `:${80}` : ''}/Event/manage.php`;

    // ฟังก์ชันสำหรับเปิด/ปิดเมนู
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        menu.classList.toggle('show');
    };

    // ฟังก์ชันเปิดป๊อปอัพสร้างเทศกาล
    window.openCreateEventPopup = function () {
        document.getElementById('createEventPopup').style.display = 'block';
        document.getElementById('eventName').value = '';
    };

    // ฟังก์ชันปิดป๊อปอัพ
    window.closeCreateEventPopup = function () {
        document.getElementById('createEventPopup').style.display = 'none';
    };

    window.addEventToDB = async function (event) {
        event.preventDefault();

        const eventName = document.getElementById('eventName').value;
        const status = 'inactive';

        if (eventName) {
            try {
                console.log("📢 Sending data:", JSON.stringify({ name: eventName, status: status }));

                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: eventName, status: status }),
                });

                const data = await response.json();
                console.log("✅ Response:", data);

                if (response.ok) {
                    alert('บันทึกสำเร็จ!');
                    closeCreateEventPopup();
                    fetchFestivals();
                } else {
                    alert('❌ เกิดข้อผิดพลาด: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('🚨 Error:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        } else {
            alert('⚠️ กรุณากรอกชื่อเทศกาล');
        }
    };


    // ฟังก์ชันสำหรับการดึงข้อมูลจากฐานข้อมูล
    async function fetchFestivals() {
        try {
            const response = await fetch(baseUrl); // URL ของ API
            const data = await response.json();
            festivals = data; // เก็บข้อมูลที่ได้มาในตัวแปร festivals
            displayFestivals(); // เรียกฟังก์ชันแสดงข้อมูล
        } catch (error) {
            console.error('Error fetching festivals:', error);
        }
    }

    // ฟังก์ชันสำหรับการแสดงตารางข้อมูล
    function displayFestivals() {
        const tableBody = document.querySelector('#festivalTable tbody');
        tableBody.innerHTML = ''; // ลบข้อมูลเดิมออก

        festivals.forEach((festival, index) => {
            const row = document.createElement('tr');
            const isActive = festival.status === 'active';
            row.innerHTML = `
            <td>${index + 1}</td> 
            <td>${festival.name}</td>
            <td>${festival.status}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" onchange="toggleStatus(${festival.id}, '${festival.status}')" ${isActive ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <button class="btn edit" onclick="goToEditPage(${festival.id})"><i class="fa fa-edit"></i></button>
                <button class="btn delete" onclick="deleteFestival(${festival.id})"><i class="fa fa-trash"></i> </button>
            </td>
        `;
            tableBody.appendChild(row);
        });
    }

    // ฟังก์ชันเปลี่ยนหน้าไปที่หน้า edit.html พร้อมกับส่งข้อมูลใน URL
    window.goToEditPage = function (id) {
        window.location.href = `edit.html?id=${id}`; // ส่ง id ไปที่ edit.html ผ่าน query string
    };

    // ฟังก์ชันเปลี่ยนหน้าไปที่หน้า create.html
    window.goToCreatePage = function () {
        window.location.href = 'create.html'; // เปลี่ยนไปที่หน้า create.html
    };

    // ฟังก์ชันสำหรับการแก้ไขเทศกาล
    window.editFestival = async function (id) { // ใช้ window เพื่อให้เข้าถึงได้จาก HTML
        const festival = festivals.find(f => f.id === id);
        if (festival) {
            const newStatus = prompt(`Edit status for ${festival.name}:`, festival.status);
            if (newStatus) {
                festival.status = newStatus;
                try {
                    const response = await fetch(baseUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `id=${festival.id}&name=${festival.name}&status=${newStatus}`,
                    });
                    await response.json();
                    fetchFestivals(); // อัพเดทตารางหลังจากแก้ไข
                } catch (error) {
                    console.error('Error updating festival:', error);
                }
            }
        }
    };

    // ฟังก์ชันสำหรับการลบเทศกาล
    window.deleteFestival = async function (id) { // ใช้ window เพื่อให้เข้าถึงได้จาก HTML
        try {
            const response = await fetch(baseUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: id }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.error) {
                console.error('Error:', data.error);
            } else {
                console.log(data.message);

                // ลบข้อมูลออกจากอาร์เรย์ festivals
                festivals = festivals.filter(festival => festival.id !== id);

                // อัปเดตตารางข้อมูล
                fetchFestivals();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // ฟังก์ชันสำหรับเปลี่ยนสถานะ
    window.toggleStatus = function (id, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
        // ตรวจสอบค่าก่อนส่ง
        if (typeof id !== 'number' || (newStatus !== 'active' && newStatus !== 'inactive')) {
            console.error('Invalid input values:', { id, newStatus });
            return;
        }
    
        fetch(baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id, status: newStatus }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.message) {
                fetchFestivals(); // อัปเดตตารางหลังจากเปลี่ยนสถานะ
            } else {
                console.error('Error updating status:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    };
    

    document.getElementById('eventName').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addEventToDB(event);
        }
    });

    // เรียกฟังก์ชัน fetchFestivals เมื่อโหลดหน้า
    fetchFestivals();
});
