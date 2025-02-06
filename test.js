const apiUrl = "http://127.0.0.1/Event/test.php?id=1";

// ฟังก์ชันดึงข้อมูล characters ตาม event_id
function fetchCharacters() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log("Characters Data:", data);
            if (data.message) {
                document.getElementById("output").innerText = data.message;
            } else {
                let html = "<ul>";
                data.forEach(character => {
                    html += `<li>${character.image_name} - <img src="${character.image_path}" width="100"></li>`;
                });
                html += "</ul>";
                document.getElementById("output").innerHTML = html;
            }
        })
        .catch(error => console.error("Error fetching characters:", error));
}

// ฟังก์ชันเพิ่มข้อมูล character ใหม่
function addCharacter() {
    const imageFile = document.getElementById("image_file").files[0];

    if (!imageFile) {
        alert("กรุณาเลือกรูปภาพ");
        return;
    }

    // ใช้ชื่อไฟล์เป็น image_name (ตัด extension ออก)
    const imageName = imageFile.name.replace(/\.[^/.]+$/, "");

    const formData = new FormData();
    formData.append("image_name", imageName);
    formData.append("image_file", imageFile);

    fetch(apiUrl, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchCharacters();
    })
    .catch(error => console.error("Error adding character:", error));
}

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
window.onload = fetchCharacters;
