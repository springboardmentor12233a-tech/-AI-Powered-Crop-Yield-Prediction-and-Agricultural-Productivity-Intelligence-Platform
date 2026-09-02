document.getElementById("loginForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {

        // Login
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        // Store login information
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Access admin endpoint
        const adminResponse = await fetch("http://127.0.0.1:5000/admin", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + data.access_token
            }
        });

        const adminData = await adminResponse.json();

        if (adminResponse.ok) {

            message.textContent =
                "Login successful! Welcome " +
                data.user.name +
                " | Role: " +
                adminData.role +
                " | Admin access granted";

        } else {

            message.textContent =
                data.user.name +
                " | Role: " +
                data.user.role +
                " | " +
                adminData.message;

        }

    } catch (error) {

        message.textContent = "Unable to connect to backend.";

        console.error(error);
    }

});