
$(document).ready(function() {
    console.log("jQuery is loaded"); // Check if this prints
    

    $("#loginForm").on("submit", function(event) {
        console.log("Login button clicked");
        event.preventDefault(); // Prevent default form submission
        

        // Disable submit button to prevent multiple submissions
        $("input[type=submit]").attr("disabled", true);

        /// Clear any previous success or error messages
        $("#result").html(""); // Clear previous success message
        $(".error").html(""); // Clear any previous error messages

        $.ajax({
            url: 'UTSlogin.php',
            type: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                var data = JSON.parse(response);
                
                if (data.status === "success") {
                    $("#loginForm")[0].reset(); // Reset the form
                    $("#result").html(data.message); // Show success message
                } else if (data.status === "error") {
                     // Show general error message in the result span
                    if (data.message) {
                        $("#result").html(data.message).css("color", "red"); // Display the error message
                    } else {
                        // Display field-specific error messages
                        if (data.errors.username) {
                            $("#usernameError").html(data.errors.username);
                        }
                        if (data.errors.password) {
                            $("#passwordError").html(data.errors.password);
                        }
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
