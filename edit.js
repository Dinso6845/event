document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const dropZoneImage = document.getElementById('imageDropZone');
    const dropZoneMusic = document.getElementById('backgroundMusicDropZone');
    const dropZoneBackground = document.getElementById('backgroundImageDropZone');
    const imageInput = document.getElementById('imageFile');
    const musicInput = document.getElementById('backgroundMusic');
    const backgroundInput = document.getElementById('backgroundImage');
    const uploadButton = document.getElementById('update-event');
    let backgroundToRemove = false;
    let musicToRemove = false;

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    const editUrl = `${protocol}//${hostname}${port ? `:${80}` : ''}/Event/edit_event.php`;
    const deleteUrl = `${protocol}//${hostname}${port ? `:${80}` : ''}/Event/delete_character.php`;
    const upimageUrl = `${protocol}//${hostname}${port ? `:${80}` : ''}/Event/upload_image.php?id=${eventId}`;

    // console.log("URL Parameters:", window.location.search);

    // console.log("Extracted event_id:", eventId);

    // ฟังก์ชันสำหรับเปิด/ปิดเมนู
    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        const content = document.querySelector('.content');
        menu.classList.toggle('show');
        content.classList.toggle('shifted');
    };

    if (!eventId) {
        displayErrorMessage("Invalid or missing event ID.");
        return;
    }

    async function fetchEventData(eventId) {
        try {
            const response = await fetch(`${editUrl}?event_id=${eventId}`);
            const data = await response.json();

            if (data.error) {
                console.log("API Response:", data);
                displayErrorMessage(data.error);
                return;
            }

            displayEventDetails(data.event || {});
            displayCharacters(data.characters || []);
        } catch (error) {
            console.error("Error fetching event data:", error);
            displayErrorMessage("An error occurred while fetching the data.");
        }
    }

    // ฟังก์ชันอัปเดตข้อมูล
    async function updateEventData(eventId) {
        try {
            const formData = new FormData();

            // เพิ่มข้อมูลพื้นฐาน
            formData.append('event_id', eventId);
            formData.append('status', document.getElementById('status').value);
            formData.append('name', document.getElementById('eventName').value);
            formData.append('button_color', document.getElementById('buttonColor').value);
            formData.append('text_color', document.getElementById('textColor').value);
            formData.append('toptext_color', document.getElementById('toptextColor').value);
            formData.append('sender_color', document.getElementById('senderColor').value);
            formData.append('message', document.getElementById('linkWeb').value);
            formData.append('text_button', document.getElementById('textButton').value);
            formData.append('set_cartoon', document.getElementById('setCartoon').value);

            // เพิ่มการตรวจสอบและส่งค่าการลบไฟล์
            if (backgroundToRemove) {
                formData.append('remove_background', 'true');
            }
            if (musicToRemove) {
                formData.append('remove_music', 'true');
            }

            // เพิ่มไฟล์ถ้ามีการเลือก
            if (imageInput.files[0]) {
                formData.append('image', imageInput.files[0]);
            }
            if (musicInput.files[0]) {
                formData.append('music', musicInput.files[0]);
            } else {
                console.log("No music file selected.");
            }
            if (backgroundInput.files[0]) {
                formData.append('background', backgroundInput.files[0]);
            } else {
                console.log("No background file selected.");
            }

            console.log("FormData before sending:", [...formData.entries()]);

            const response = await fetch(editUrl, {
                method: 'POST',
                body: formData
            });

            const text = await response.text();
            console.log("Raw response from PHP:", text); // ตรวจสอบค่าที่ PHP ส่งกลับมาก่อนแปลงเป็น JSON

            try {
                const data = JSON.parse(text);
                if (data.success) {
                    alert('Event updated successfully.');
                    location.reload();
                } else {
                    alert(`Failed to update event: ${data.error || 'Unknown error'}`);
                }
            } catch (jsonError) {
                console.error("Invalid JSON response:", text);
                alert("An error occurred while updating. Check console for details.");
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert(`An error occurred while updating the event: ${error.message}`);
        }
    }

    // ฟังก์ชันนี้จะถูกเรียกเมื่อกดปุ่ม "Update Event"
    uploadButton.addEventListener('click', (event) => {
        event.preventDefault();
        updateEventData(eventId);
    });

    function displayErrorMessage(message) {
        document.body.innerHTML = `<p class='error-message'>${message}</p>`;
    }

    function displayEventDetails(event) {
        const eventNameInput = document.getElementById('eventName');
        if (eventNameInput && event.name) {
            eventNameInput.value = event.name;
        }

        // เพิ่มการตรวจสอบและแสดงสถานะ
        const statusToggle = document.getElementById('statusToggle');
        if (statusToggle && event.status) {
            const isActive = event.status === 'active';
            statusToggle.classList.remove('fa-toggle-on', 'fa-toggle-off');
            statusToggle.classList.add(isActive ? 'fa-toggle-on' : 'fa-toggle-off');
            statusToggle.dataset.status = event.status;
            statusToggle.style.color = isActive ? 'green' : 'red';

            // อัพเดทค่าใน input hidden ด้วย
            const statusInput = document.getElementById('status');
            if (statusInput) {
                statusInput.value = event.status;
            }
        }

        const elements = {
            buttonColor: 'button_color',
            textColor: 'text_color',
            toptextColor: 'toptext_color',
            senderColor: 'sender_color',
            linkWeb: 'message',
            textButton: 'text_button',
            eventDetails: 'eventDetails',
            setCartoon: 'set_cartoon'
        };

        // วนลูปเพื่อเซ็ตค่าให้กับแต่ละ element
        Object.keys(elements).forEach((elementId) => {
            const element = document.getElementById(elementId);
            const dbField = elements[elementId];
            if (element && event[dbField] !== undefined) {
                element.value = event[dbField];
            }
        });

        const previewImage = document.getElementById('backgroundImagePreview');
        const previewVideo = document.getElementById('backgroundVideoPreview');
        const backgroundImageDropZone = document.getElementById('backgroundImageDropZone');
        const removeButton = document.getElementById('removeBackground');

        if (event.background_path) {
            const fileExtension = event.background_path.split('.').pop().toLowerCase();

            if (fileExtension === 'gif') {
                previewImage.src = event.background_path;
                previewImage.style.display = 'block';
                previewVideo.style.display = 'none';
            } else if (fileExtension === 'mp4') {
                previewVideo.src = event.background_path;
                previewVideo.style.display = 'block';
                previewImage.style.display = 'none';
                previewVideo.load();
                previewVideo.play();
            }

            backgroundImageDropZone.style.display = 'none';
            removeButton.style.display = 'inline-block';
        } else {
            previewImage.style.display = 'none';
            previewVideo.style.display = 'none';
            backgroundImageDropZone.style.display = 'block';
            removeButton.style.display = 'none';
        }

        const previewAudio = document.getElementById('backgroundMusicPreview');
        const musicDropZone = document.getElementById('backgroundMusicDropZone');

        if (event.music && event.music.trim() !== "") {
            previewAudio.src = event.music;
            previewAudio.style.display = 'block';
            musicDropZone.style.display = 'none';

            const removeButton = document.getElementById('removeMusic');
            removeButton.style.display = 'inline-block';
        } else {
            previewAudio.style.display = 'none'; // ซ่อน preview ถ้าไม่มีเพลง
            musicDropZone.style.display = 'block'; // แสดงช่องอัพโหลด
        }

        if (backgroundToRemove) {
            displayEventDetails(event); // เรียกฟังก์ชันเพื่ออัปเดต UI
        }
    }

    function displayCharacters(characters) {
        const characterCards = document.getElementById('characterCards');
        const characterTemplate = document.getElementById('characterTemplate');

        if (!characterCards || !characterTemplate) {
            console.error("Character cards or template element not found.");
            return;
        }

        characterCards.innerHTML = '';

        if (!Array.isArray(characters) || characters.length === 0) {
            characterCards.innerHTML = "<p>No characters found.</p>";
            return;
        }

        characters.forEach(character => {
            const card = characterTemplate.cloneNode(true);
            card.style.display = 'block';

            const img = card.querySelector('img');
            if (img) {
                img.src = character.image_path || '';
                img.alt = character.image_name || 'Character Image';
            }

            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteCharacter(character.id));
            }

            characterCards.appendChild(card);
        });
    }

    // ฟังก์ชันสำหรับการลากและวางหรือการเลือกไฟล์
    function setupDropZone(dropZone, inputFile, previewId, fileType) {
        dropZone.addEventListener('click', () => inputFile.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            handleFileSelection(file, inputFile, previewId, fileType);
        });

        inputFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFileSelection(file, inputFile, previewId, fileType);
        });
    }

    // ฟังก์ชันลบ background
    window.removeBackground = function () {
        const previewImage = document.getElementById('backgroundImagePreview');
        const previewVideo = document.getElementById('backgroundVideoPreview');
        const previewVideoSource = previewVideo.querySelector('source');
        const removeBtn = document.getElementById('removeBackground');
        const backgroundImageDropZone = document.getElementById('backgroundImageDropZone');

        if (previewImage.style.display === 'block') {
            previewImage.style.display = 'none';
        } else if (previewVideo.style.display === 'block') {
            previewVideo.pause();  // หยุดวิดีโอ
            previewVideoSource.src = "";  // รีเซ็ตค่า src
            previewVideo.load();  // โหลดใหม่เพื่อเคลียร์วิดีโอ
            previewVideo.style.display = 'none';  // ซ่อนวิดีโอ
        }

        if (removeBtn) removeBtn.style.display = 'none';
        backgroundToRemove = true;

        // แสดงช่องอัปโหลดเมื่อมีการลบพื้นหลัง
        backgroundImageDropZone.style.display = 'block';
    };

    // ฟังก์ชันลบ music
    window.removeMusic = function () {  // Make function globally accessible
        const audioPlayer = document.getElementById('backgroundMusicPreview');
        const removeBtn = document.getElementById('removeMusic');
        if (audioPlayer) audioPlayer.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
        musicToRemove = true;  // เพิ่มตัวแปรเพื่อรอการยืนยัน

        // แสดงช่องอัพโหลดเมื่อมีการลบเพลง
        const musicDropZone = document.getElementById('backgroundMusicDropZone');
        musicDropZone.style.display = 'block'; // แสดงช่องอัพโหลด
    }

    // เพิ่ม Event Listener ให้กับปุ่มลบ
    document.getElementById('removeBackground').addEventListener('click', removeBackground);
    document.getElementById('removeMusic').addEventListener('click', removeMusic);

    // แก้ไขฟังก์ชัน handleFileSelection ให้แสดงปุ่มลบเมื่ออัปโหลดไฟล์
    function handleFileSelection(file, inputFile, previewId, fileType) {
        if (!file) return;

        const reader = new FileReader();

        if (fileType === 'image') {
            reader.onload = () => {
                document.getElementById(previewId).src = reader.result;
                document.getElementById(previewId).style.display = 'block';
            };
        } else if (fileType === 'music') {
            reader.onload = () => {
                const previewAudio = document.getElementById('backgroundMusicPreview');
                previewAudio.src = reader.result;
                previewAudio.style.display = 'block';

                document.getElementById('removeMusic').style.display = 'inline-block'; 
                selectedMusic = file;
            };
        } else if (fileType === 'background') {
            reader.onload = () => {
                const previewImage = document.getElementById('backgroundImagePreview');
                previewImage.src = reader.result;
                previewImage.style.display = 'block';

                document.getElementById('removeBackground').style.display = 'inline-block';
                selectedBackground = file;
            };
        }

        reader.readAsDataURL(file);
    }

    function updateStatus(status) {
        const statusToggle = document.getElementById('statusToggle');
        const statusInput = document.getElementById('status');

        if (!statusToggle || !statusInput) {
            console.error("Status toggle or input element not found.");
            return;
        }

        const isActive = status === 'active';
        statusToggle.classList.toggle('fa-toggle-on', isActive);
        statusToggle.classList.toggle('fa-toggle-off', !isActive);
        statusToggle.dataset.status = status;
        statusToggle.style.color = isActive ? 'green' : 'red';

        // อัพเดทค่าใน input hidden
        statusInput.value = status;

        // อัพเดทฐานข้อมูลทันที
        const formData = new FormData();
        formData.append('event_id', eventId);
        formData.append('status', status);

        fetch(editUrl, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error(data.error || 'Failed to update status');
                }
            })
            .catch(error => {
                console.error('Error updating status:', error);
                alert('An error occurred while updating the status.');
            });
    }

    // เริ่มต้นการตั้งค่า Dropzone สำหรับการอัปโหลดไฟล์
    setupDropZone(dropZoneImage, imageInput, 'imagePreview', 'image');
    setupDropZone(dropZoneMusic, musicInput, 'backgroundMusicPreview', 'music');
    setupDropZone(dropZoneBackground, backgroundInput, 'backgroundImagePreview', 'background');
    fetchEventData(eventId);

    const statusToggle = document.getElementById('statusToggle');
    statusToggle.addEventListener('click', () => {
        const currentStatus = statusToggle.dataset.status === 'active' ? 'inactive' : 'active';
        updateStatus(currentStatus); 
    });

    function deleteCharacter(characterId) {
        if (!confirm("คุณแน่ใจหรือไม่ว่าจะลบการ์ตูน?")) {
            return; // ยกเลิกการลบถ้าผู้ใช้กด Cancel
        }

        console.log("Deleting character with ID:", characterId);
        fetch(deleteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: characterId }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Character deleted successfully.');
                    const characterCard = document.getElementById(`character-${characterId}`);
                    if (characterCard) {
                        characterCard.remove();
                    }
                } else {
                    alert('Failed to delete character: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error deleting character:', error);
                alert('An error occurred while deleting the character.');
            });
    }

    // เพิ่มฟังก์ชันสำหรับการอัพโหลดรูปภาพ
    function handleImageUpload(event) {
        const imageFile = event.target.files[0];
        if (!imageFile) {
            return;
        }

        // ใช้ชื่อไฟล์เป็น image_name (ตัด extension ออก)
        const imageName = imageFile.name.replace(/\.[^/.]+$/, "");

        const formData = new FormData();
        formData.append("image_name", imageName);
        formData.append("image_file", imageFile);

        fetch(upimageUrl, {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    fetchEventData(eventId);
                }
            })
            .catch(error => {
                console.error("Error uploading image:", error);
            });
    }

    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    function createBackButton() {
        const backButton = document.createElement('button');
        backButton.innerHTML = '<i class="fa fa-mail-reply"></i>';
        backButton.className = 'back-button';
        backButton.onclick = () => {
            window.location.href = 'manage.html';
        };

        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(backButton);
        }
    }

    createBackButton();

});
