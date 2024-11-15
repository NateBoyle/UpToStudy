$(document).ready(function () {
    console.log("jQuery is loaded"); // Confirm that jQuery is working

    $("#loginForm").on("submit", function (event) {
        console.log("Login button clicked");
        event.preventDefault(); // Prevent default form submission

        // Disable submit button to prevent multiple submissions
        $("input[type=submit]").attr("disabled", true);

        // Clear any previous success or error messages
        $("#result").html(""); // Clear previous success message
        $(".error").html(""); // Clear any previous error messages

        // Send the login request via AJAX
        $.ajax({
            url: 'UTSloginLogout.php', // Update to match the new PHP file name
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: $(this).serialize(), // Serialize the form data for the request
            success: function (response) {
                console.log("Raw server response:", response);

                if (response.status === "success") {
                    console.log("Login successful:", response.message);

                    // Reset the form
                    $("#loginForm")[0].reset();

                    // Show a success message
                    $("#result")
                        .html(response.message)
                        .css("color", "green");

                    // Redirect to the dashboard
                    window.location.href = 'UTSdash.html'; // No query parameters needed
                } else if (response.status === "error") {
                    console.log("Login error:", response.message);

                    // Show a general error message
                    if (response.message) {
                        $("#result")
                            .html(response.message)
                            .css("color", "red"); // Display the error message
                    }

                    // Display field-specific error messages, if provided
                    if (response.errors) {
                        if (response.errors.username) {
                            console.log("Username Error:", response.errors.username);
                            $("#usernameError").html(response.errors.username);
                        }
                        if (response.errors.password) {
                            console.log("Password Error:", response.errors.password);
                            $("#passwordError").html(response.errors.password);
                        }
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("AJAX error:", textStatus, errorThrown);

                // Attempt to parse responseText as JSON
                let errorMessage = "An unknown error occurred.";
                try {
                    const errorData = JSON.parse(jqXHR.responseText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    errorMessage = jqXHR.responseText; // Fallback to raw responseText
                }

                $("#result").html("An error occurred: " + errorMessage).css("color", "red");
            },
            complete: function () {
                // Re-enable the submit button after the request is complete
                $("input[type=submit]").attr("disabled", false);
            },
        });
    });
});
