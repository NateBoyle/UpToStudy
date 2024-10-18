$(document).ready(function() {
    $("#signupForm").on("submit", function(event) {
        event.preventDefault(); // Prevent default form submission

        // Disable submit button to prevent multiple submissions
        $("input[type=submit]").attr("disabled", true);

        /// Clear any previous success or error messages
        $("#result").html(""); // Clear previous success message
        $(".error").html(""); // Clear any previous error messages

        $.ajax({
            url: 'UTSsignup.php',
            type: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                var data = JSON.parse(response);
                
                if (data.status === "success") {
                    $("#signupForm")[0].reset(); // Reset the form
                    $("#result").html(data.message); // Show success message
                } else if (data.status === "error") {
                    // Display individual error messages
                    if (data.errors.fullName) {
                        $("#fullNameError").html(data.errors.fullName);
                    }
                    if (data.errors.email) {
                        $("#emailError").html(data.errors.email);
                    }
                    if (data.errors.phone) {
                        $("#phoneError").html(data.errors.phone);
                    }
                    if (data.errors.username) {
                        $("#usernameError").html(data.errors.username);
                    }
                    if (data.errors.password) {
                        $("#passwordError").html(data.errors.password);
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#result").html("An error occurred: " + textStatus); // Show error message if something goes wrong
            },
            complete: function() {
                // Re-enable the submit button after the request is complete
                $("input[type=submit]").attr("disabled", false);
            }
        });
    });
});
