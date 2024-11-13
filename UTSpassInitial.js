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

// Executes when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
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

    // Handles logout for external navigation or closing the tab
    /*window.addEventListener('beforeunload', async () => {
        const navigationEntry = performance.getEntriesByType("navigation")[0];
        const navigationType = navigationEntry ? navigationEntry.type : "navigate"; // Default to "navigate"

        console.log("Beforeunload triggered.");
        console.log("Navigation type:", navigationType); // Logs the type of navigation
        console.log("isInternalNavigation:", isInternalNavigation); // Logs the internal navigation flag

        if (!isInternalNavigation && navigationType !== "reload") {
            if (navigationType !== "reload") {
                console.log("External navigation or tab close detected. Triggering logout.");
                try {
                    console.log("Triggering logout for external navigation or tab close.");
                    if (!navigator.sendBeacon('UTSlogin.php?action=logout')) {
                        console.log("Fallback to async logout due to sendBeacon failure.");
                        await fallbackLogout(); // Calls the async fallback if sendBeacon fails
                    }
                } catch (error) {
                    console.error("Error using sendBeacon:", error);
                    await fallbackLogout(); // Ensures fallback is used in case of errors
                }
            } else {
                console.log("Page reload detected, skipping logout."); // Skips logout on page refresh
            }
        } else {
            console.log("Internal navigation detected. Skipping logout.");
        }
    });*/
});
