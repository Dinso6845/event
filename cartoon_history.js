document.addEventListener('DOMContentLoaded', function () {
    const cartoonList = document.querySelector('#cartoon-list tbody');
    const selectAllCheckbox = document.getElementById('select-all');
    const deleteSelectedButton = document.getElementById('delete-selected');
    const content = document.querySelector('.content');

    function loadCartoonHistory() {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        cartoonList.innerHTML = '';

        if (cartoons.length === 0) {
            cartoonList.innerHTML = '<tr><td colspan="6">ไม่พบการ์ตูน</td></tr>';
            return;
        }

        cartoons.forEach((cartoon, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="select-cartoon" data-index="${index}"></td>
                <td>${index + 1}</td>
                <td><img src="${cartoon.imageSrc}" alt="Cartoon Image" style="width: 80px;"></td>
                <td><strong>${cartoon.userMessage}</strong></td>
                <td>${cartoon.message}</td>
                <td><button class="btn-delete" onclick="deleteCartoon(${index})"><i class="fa fa-trash"></i></button></td>
            `;
            cartoonList.appendChild(row);
        });
    }

    selectAllCheckbox.addEventListener('change', function() {
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

    window.deleteCartoon = function (index) {
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        cartoons.splice(index, 1);
        localStorage.setItem('cartoons', JSON.stringify(cartoons));
        loadCartoonHistory();
    };

    window.toggleMenu = function () {
        const menu = document.getElementById('menu');
        menu.classList.toggle('show');
        content.classList.toggle('shifted');
    };

    document.getElementById('delete-selected').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.select-cartoon:checked');
        const cartoons = JSON.parse(localStorage.getItem('cartoons')) || [];
        const indicesToDelete = Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.index));

        indicesToDelete.sort((a, b) => b - a).forEach(index => {
            cartoons.splice(index, 1);
        });

        localStorage.setItem('cartoons', JSON.stringify(cartoons));
        loadCartoonHistory();
    });

    loadCartoonHistory();
    toggleDeleteButton(); // Initial check
});
