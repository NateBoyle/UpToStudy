// Tracks whether the navigation is internal (clicking on a link within the site)
let isInternalNavigation = false;

// Extracts query parameters from the URL
function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const firstLetter = urlParams.get('firstLetter'); // Extracts the 'firstLetter' parameter
    return { firstLetter };
}

// Handles logout requests asynchronously as a fallback method
async function fallbackLogout() {
    try {
        const response = await fetch('UTSlogin.php?action=logout', {
            method: 'POST' // Sends a POST request to the server to log out
        });
        console.log('Logout response:', await response.text()); // Logs server response
    } catch (error) {
        console.error('Error during logout:', error); // Logs any errors during the request
    }
}

// Function to check authentication status
function checkAuthStatus() {
    fetch('UTSauth_check.php') // Call the PHP file
        .then(response => {
            console.log('Auth Check Response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Parsed Data:', data);
            if (!data.authenticated) {
                // If not authenticated, redirect to the welcome page
                window.location.href = 'UTSwelcome.html';
            }
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
        });
}

// Executes when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {

    // Call the function to check authentication when the page loads
    checkAuthStatus();

    // Reset the internal navigation flag on page load
    isInternalNavigation = false;
    console.log("isInternalNavigation reset to:", isInternalNavigation);

    let firstLetter; // Variable to store the 'firstLetter' query parameter
    try {
        firstLetter = getQueryParams().firstLetter;
        console.log("Received firstLetter:", firstLetter || "N/A");
    } catch (error) {
        console.error("Error extracting query parameters:", error);
    }

    // Update the user's initial in the profile header, or set to 'N/A' if unavailable
    const userInitialElement = document.getElementById('userInitial');
    if (firstLetter && userInitialElement) {
        userInitialElement.textContent = firstLetter;
    } else if (userInitialElement) {
        userInitialElement.textContent = 'N/A';
    }

    // Add the 'firstLetter' parameter to all links on the page
    document.querySelectorAll("a").forEach(link => {
        const url = new URL(link.href, window.location.origin);
        url.searchParams.set("firstLetter", firstLetter || 'N/A');
        link.href = url.toString(); // Updates the link to include the 'firstLetter' parameter
    });

    // Dropdown menu elements
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    // Toggles dropdown visibility when the user initial is clicked
    if (userInitialElement) {
        userInitialElement.addEventListener("click", () => {
            profileDropdown.style.display =
                profileDropdown.style.display === "none" ? "block" : "none";
        });
    }

    // Prevents the dropdown menu from closing when clicked inside
    if (profileDropdown) {
        profileDropdown.addEventListener("click", (event) => {
            event.stopPropagation(); // Stops the event from propagating to the document click listener
        });
    }

    // Closes the dropdown if the user clicks outside of it
    document.addEventListener("click", (event) => {
        if (
            userInitialElement &&
            profileDropdown &&
            !userInitialElement.contains(event.target) &&
            !profileDropdown.contains(event.target)
        ) {
            profileDropdown.style.display = "none"; // Hides the dropdown
        }
    });

    // Redirects the user to the logout script when the logout button is clicked
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                const response = await fetch('UTSlogin.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({ action: 'logout' }),
                });
                console.log('Logout response:', await response.text());
                // No need to redirect; the server handles it
            } catch (error) {
                console.error('Error during logout:', error);
            }
        });
    }

    // Sets the internal navigation flag to true when a link is clicked
    document.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            isInternalNavigation = true;
            console.log("Internal navigation detected, isInternalNavigation set to:", isInternalNavigation);
        });
    });

});
