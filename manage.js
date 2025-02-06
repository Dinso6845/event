document.addEventListener('DOMContentLoaded', () => {
    let festivals = []; // สร้างตัวแปร festivals สำหรับเก็บข้อมูล

    // ฟังก์ชันสำหรับเปิด/ปิดเมนู
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        menu.classList.toggle('show'); // เพิ่มหรือลบ class "show" เพื่อแสดง/ซ่อนเมนู
    };

    // ฟังก์ชันสำหรับการดึงข้อมูลจากฐานข้อมูล
    async function fetchFestivals() {
        try {
            const response = await fetch('http://127.0.0.1/Event/manage.php'); // URL ของ API
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
            row.innerHTML = `
            <td>${index + 1}</td> 
            <td>${festival.name}</td>
            <td>${festival.status}</td>
            <td>
                <button class="btn edit" onclick="goToEditPage(${festival.id})"><i class="fa fa-edit"></i></button>
                <button class="btn delete" onclick="deleteFestival(${festival.id})"><i class="fa fa-trash"></i> </button>
            </td>
        `;
            tableBody.appendChild(row);
        });
    }

    // ฟังก์ชันเปลี่ยนหน้าไปที่หน้า edit.html พร้อมกับส่งข้อมูลใน URL
    window.goToEditPage = function(id) {
        window.location.href = `edit.html?id=${id}`; // ส่ง id ไปที่ edit.html ผ่าน query string
    };    

    // ฟังก์ชันสำหรับการแก้ไขเทศกาล
    window.editFestival = async function (id) { // ใช้ window เพื่อให้เข้าถึงได้จาก HTML
        const festival = festivals.find(f => f.id === id);
        if (festival) {
            const newStatus = prompt(`Edit status for ${festival.name}:`, festival.status);
            if (newStatus) {
                festival.status = newStatus;
                try {
                    const response = await fetch('http://127.0.0.1/Event/manage.php', {
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
            const response = await fetch('http://127.0.0.1/Event/manage.php', {
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

    // เรียกฟังก์ชัน fetchFestivals เมื่อโหลดหน้า
    fetchFestivals();
});
