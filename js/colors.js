document.addEventListener("DOMContentLoaded", function () {

    const userId = localStorage.getItem("userId");

    const addInput = document.getElementById("addInput");
    const addButton = document.getElementById("addButton");

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    const colorOutput = document.getElementById("colorOutput");


    if (!userId) {
        // No one logged in - send them back to the login page
        window.location.href = "index.html";
        return;
    }


    addButton.addEventListener("click", function () {

        const color = addInput.value.trim();

        if (!color) {
            colorOutput.textContent = "Enter a color name first.";
            return;
        }

        fetch("LAMPAPI/AddColor.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                color: color
            })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {

                if (data.error) {
                    colorOutput.textContent = data.error;
                } else {
                    colorOutput.textContent = "Added \"" + color + "\".";
                    addInput.value = "";
                }
            })
            .catch(function (err) {
                colorOutput.textContent = "Request failed: " + err;
            });
    });


    searchButton.addEventListener("click", function () {

        const search = searchInput.value.trim();

        fetch("LAMPAPI/SearchColors.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                search: search
            })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {

                if (!Array.isArray(data) || data.length === 0) {
                    colorOutput.textContent = "No colors found.";
                    return;
                }

                colorOutput.textContent = data
                    .map(function (item) { return item.name; })
                    .join(", ");
            })
            .catch(function (err) {
                colorOutput.textContent = "Request failed: " + err;
            });
    });

});
