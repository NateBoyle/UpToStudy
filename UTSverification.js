// Utility function to update the message content
function displayMessage(header, body) {
    console.log("displayMessage called with:", header, body); // Log to confirm call
    
    const successMessage = document.getElementById("successMessage");
    const messageHeader = document.getElementById("messageHeader");
    const messageBody = document.getElementById("messageBody");

    // Update content
    messageHeader.textContent = header;
    messageBody.textContent = body;

    // Ensure proper visibility
    successMessage.classList.remove("hidden");
    successMessage.classList.add("visible"); // Add the visible class
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded event fired"); // Log to confirm
    // Extract the token from the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Check if the token exists
    if (!token) {
        displayMessage("Verification Failed", "The verification link is invalid or missing.");
        return;
    }

    console.log("Initiating fetch with token:", token); // Log the token being sent

    // Send the token to the server for verification
    fetch("UTSverification.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            action: "verifyUser",
            token: token,
        }),
    })
        .then((response) => {
            console.log("Raw fetch response:", response); // Log the response object
            return response.json();
        })
        .then((data) => {
            console.log("Parsed data:", data); // Log the JSON data
            if (data.success) {
                displayMessage(
                    "Verification Successful!",
                    "Your account has been verified. You may now login using the link below."
                );
                document.getElementById("loginLink").classList.remove("hidden");
            } else {
                displayMessage("Verification Failed", data.message || "An error occurred during verification.");
            }
        })
        .catch(() => {
            displayMessage("Verification Failed", "An unexpected error occurred. Please try again later.");
        });

    
});
