document.addEventListener('DOMContentLoaded', function () {
    const cartoonList = document.querySelector('#cartoon-list tbody');
    const selectAllCheckbox = document.getElementById('select-all');
    const deleteSelectedButton = document.getElementById('delete-selected');
    const content = document.querySelector('.content');
    const searchInput = document.getElementById('search-input');    

    // URL สำหรับ API ดึงข้อมูลการ์ตูนจากฐานข้อมูล
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    const baseUrl = `${protocol}//${hostname}${port ? `:${80}` : ''}/Event/cartoon_history.php`;

    function loadCartoonHistory() {
        fetch(baseUrl)
            .then(response => response.json())
            .then(cartoons => {
                cartoonList.innerHTML = '';
                if (!cartoons || cartoons.length === 0) {
                    cartoonList.innerHTML = '<tr><td colspan="7">ไม่พบการ์ตูน</td></tr>';
                    return;
                }

                cartoons.forEach((cartoon, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><input type="checkbox" class="select-cartoon" data-id="${cartoon.id}"></td>
                        <td>${index + 1}</td>
                        <td><strong>${cartoon.event_name || 'ไม่ระบุ'}</strong></td>
                        <td><img src="${cartoon.image}" alt="Cartoon Image" style="width: 80px;"></td>
                        <td><strong>${cartoon.user_message}</strong></td>
                        <td>${cartoon.message}</td>
                        <td class="drag-handle" style="cursor: move;"><i class="fa fa-bars"></i></td>
                        <td><button class="btn-delete" onclick="deleteCartoon(${cartoon.id})"><i class="fa fa-trash"></i></button></td>
                    `;
                    cartoonList.appendChild(row);
                });
                enableDragAndDrop();
            })
            .catch(error => console.error('Error fetching cartoons from DB:', error));
    }

    selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.select-cartoon');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        toggleDeleteButton();
    });

    function toggleDeleteButton() {
        const anyChecked = document.querySelectorAll('.select-cartoon:checked').length > 0;
        deleteSelectedButton.style.display = anyChecked ? 'block' : 'none';
    }

    window.deleteCartoon = function (cartoonId) {
        fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cartoonId })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    console.log(data.message);
                    loadCartoonHistory(); 
                } else {
                    console.error('Delete error:', data.error);
                }
            })
            .catch(error => console.error('Error deleting cartoon:', error));
    };

    document.getElementById('delete-selected').addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('.select-cartoon:checked');
        const idsToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

        if (idsToDelete.length === 0) {
            alert("กรุณาเลือกการ์ตูนก่อนลบ!");
            return;
        }

        fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsToDelete })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    console.log(data.message);
                    loadCartoonHistory();
                } else {
                    console.error('Delete error:', data.error);
                }
            })
            .catch(error => console.error('Error deleting cartoons:', error));
    });

    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = cartoonList.querySelectorAll('tr');

        rows.forEach(row => {
            const eventName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            row.style.display = eventName.includes(searchTerm) ? '' : 'none';
        });
    });

    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        menu.classList.toggle('show');
        content.classList.toggle('shifted');
    };

    function enableDragAndDrop() {
        Sortable.create(cartoonList, {
            handle: '.drag-handle', 
            animation: 150,
            onEnd: function (evt) {
                console.log(`เลื่อนแถวจาก ${evt.oldIndex} ไป ${evt.newIndex}`);
            }
        });
    }

    function enableDragAndDrop() {
        Sortable.create(cartoonList, {
            handle: '.drag-handle',
            animation: 150,
            onEnd: function (evt) {
                console.log(`เลื่อนแถวจาก ${evt.oldIndex} ไป ${evt.newIndex}`);
                const rows = cartoonList.querySelectorAll('tr');
                const orderData = Array.from(rows).map((row, index) => {
                    const id = row.querySelector('.select-cartoon').dataset.id;
                    return { id: parseInt(id), sort_order: index + 1 };
                });
                fetch(baseUrl + '?update_order=1', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orders: orderData })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        console.log(data.message);
                    } else {
                        console.error('Update order error:', data.error);
                    }
                })
                .catch(error => console.error('Error updating order:', error));
            }
        });
    }
    
    
    loadCartoonHistory();
    toggleDeleteButton(); 
});
