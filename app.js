const form = document.getElementById("upload-form");
const imageInput = document.getElementById("image-input");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const goToResultButton = document.getElementById("go-to-result");

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const imageFile = imageInput.files[0];
    const templateFile = document.getElementById("template-input").files[0];
    if (!imageFile || !templateFile) return alert("Please upload both an image and a cartoon template!");

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("template", templateFile);

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const json = await response.json();
            const imageUrl = json.imageUrl;  // Assume server sends back a URL
            result.src = imageUrl;
            result.style.display = "block";
            localStorage.setItem("processedImage", imageUrl);
            goToResultButton.style.display = "block";  // Show button to go to result
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (err) {
        console.error("Error:", err);
        alert("An error occurred while uploading the image.");
    }
});


goToResultButton.addEventListener("click", () => {
    window.location.href = "/result.html";
});
