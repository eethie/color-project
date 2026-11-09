document
    .getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        const result =
            document.getElementById("loginResult");


        if (!username || !password) {

            result.textContent =
                "Please enter your username and password.";

            result.style.color = "#ff595e";

            return;
        }

        result.textContent = "Signing in...";
        result.style.color = "#1982c4";

        fetch("LAMPAPI/Login.php", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                login: username,
                password: md5(password)
            })
        })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {

                if (data.error) {

                    result.textContent = data.error;
                    result.style.color = "#ff595e";

                } else {

                    localStorage.setItem("userId", data.id);
                    localStorage.setItem("firstName", data.firstName);

                    window.location.href = "colors.html";
                }
            })
            .catch(function(err) {

                result.textContent = "Request failed: " + err;
                result.style.color = "#ff595e";
            });

    });
