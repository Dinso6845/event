// เรียกใช้งาน element จาก DOM
const form = document.getElementById("upload-form");
const imageInput = document.getElementById("image-input");
const templateInput = document.getElementById("template-input");
const result = document.getElementById("result");
const createWishButton = document.getElementById("create-wish");
const uploadPopup = document.getElementById("upload-popup");
const resultPopup = document.getElementById("result-popup");
const closeButtons = document.querySelectorAll(".close");
const templateSelect = document.getElementById("template-select");
const backgroundPreview = document.getElementById("background-preview");
const videoPreview = document.createElement("video");
const imagePreview = document.createElement("img");

// ตั้งค่าพื้นฐานให้วิดีโอและภาพ
videoPreview.id = "video-preview";
videoPreview.autoplay = true;
videoPreview.loop = true;
videoPreview.muted = true;
videoPreview.style.display = "none";

imagePreview.id = "image-preview";
imagePreview.style.display = "none";

backgroundPreview.appendChild(videoPreview);
backgroundPreview.appendChild(imagePreview);

// เพิ่มตัวแปรสำหรับเก็บการ์ตูนที่เลือก
let selectedCartoonId = null;

// โหลดรูปการ์ตูนจาก PHP
async function loadCartoons() {
    try {
        const response = await fetch("http://127.0.0.1/Event/get_cartoons.php");
        if (!response.ok) throw new Error("Failed to fetch cartoons");

        const cartoons = await response.json();
        const cartoonGrid = document.querySelector('.cartoon-grid');
        cartoonGrid.innerHTML = '';

        cartoons.forEach(cartoon => {
            const div = document.createElement('div');
            div.className = 'cartoon-item';
            div.dataset.id = cartoon.id;
            div.innerHTML = `<img src="${cartoon.image_path}" alt="${cartoon.name}">`;

            div.addEventListener('click', () => {
                document.querySelectorAll('.cartoon-item').forEach(item => {
                    item.classList.remove('selected');
                });
                div.classList.add('selected');
                selectedCartoonId = cartoon.id;
            });

            cartoonGrid.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading cartoons:", error);
    }
}

// แก้ไข event listener ของปุ่มสร้างคำอวยพร
createWishButton.addEventListener("click", () => {
    uploadPopup.style.display = "flex";
    loadCartoons(); // โหลดรูปการ์ตูนเมื่อเปิด popup
});

// ปิด popup
closeButtons.forEach(button => {
    button.addEventListener("click", () => {
        uploadPopup.style.display = "none";
        resultPopup.style.display = "none";
    });
});

async function fetchBackgrounds() {
    try {
        const response = await fetch("http://127.0.0.1/Event/background.php");
        if (!response.ok) throw new Error("Failed to fetch backgrounds");

        const backgrounds = await response.json();
        console.log("Backgrounds data:", backgrounds);

        if (backgrounds && backgrounds.length > 0) {
            populateTemplateSelect(backgrounds);
            updateBackgroundPreview();
        } else {
            console.error("No backgrounds data received");
        }
    } catch (error) {
        console.error("Error fetching backgrounds:", error);
    }
}

// เติมข้อมูลลงใน dropdown และตั้งค่า preview
function populateTemplateSelect(backgrounds) {
    templateSelect.innerHTML = ""; // ล้าง option เดิม
    backgrounds.forEach(bg => {
        const option = document.createElement("option");
        option.value = bg.background_path;
        option.textContent = bg.name;
        option.setAttribute("data-type", bg.type); // image หรือ video
        templateSelect.appendChild(option);
    });

    templateSelect.addEventListener("change", updateBackgroundPreview);
}

// อัปเดต preview เมื่อเลือก template
function updateBackgroundPreview() {
    const selectedOption = templateSelect.selectedOptions[0];
    if (!selectedOption) return;

    const path = selectedOption.value;
    const type = selectedOption.getAttribute("data-type");

    if (type === "video") {
        videoPreview.src = path;
        videoPreview.style.display = "block";
        imagePreview.style.display = "none";

        videoPreview.onerror = () => {
            console.error("Error loading video:", path);
        };
    } else if (type === "image") {
        imagePreview.src = path;
        imagePreview.style.display = "block";
        videoPreview.style.display = "none";

        imagePreview.onerror = () => {
            console.error("Error loading image:", path);
        };
    }
}

// ส่งข้อมูลไปประมวลผลที่ Flask
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedCartoonId) {
        return alert("กรุณาเลือกรูปการ์ตูน!");
    }

    const imageFile = imageInput.files[0];
    if (!imageFile) {
        return alert("กรุณาเลือกรูปภาพ!");
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("cartoonId", selectedCartoonId);

    try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const json = await response.json();
            result.src = json.imageUrl;
            result.style.display = "block";
            uploadPopup.style.display = "none";
        } else {
            const error = await response.json();
            alert(error.error || "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ");
        }
    } catch (error) {
        console.error("Error uploading files:", error);
        alert("เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ");
    }
});


function sendImageToServer(imageFile, templateImage) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const base64String = event.target.result.split(',')[1]; // ตัด header ออก
        console.log("Base64 Length:", base64String.length);

        if (!base64String || base64String.length % 4 !== 0) {
            console.error("Invalid Base64 string detected");
            alert("ข้อมูล Base64 ไม่ถูกต้อง");
            return;
        }

        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("templateBase64", base64String);

        fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData,
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to upload");
                return response.json();
            })
            .then(data => console.log("Upload success:", data))
            .catch(error => console.error("Error:", error));
    };
    reader.readAsDataURL(imageFile);
}

// โหลด background เมื่อหน้าเว็บโหลด
window.addEventListener("DOMContentLoaded", fetchBackgrounds);
