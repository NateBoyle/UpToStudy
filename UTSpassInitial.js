function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const firstLetter = urlParams.get('firstLetter');
    return { firstLetter };
}

document.addEventListener("DOMContentLoaded", function() {
    
    const { firstLetter } = getQueryParams();
    console.log("Received firstLetter:", firstLetter); // Debug log

    // Update user initial if available, else set to 'N/A'
    const userInitialElement = document.getElementById('userInitial');
    if (firstLetter && userInitialElement) {
        userInitialElement.textContent = firstLetter;
    } else if (userInitialElement) {
        userInitialElement.textContent = 'N/A';
    }

    // Update all links to retain the firstLetter query parameter
    document.querySelectorAll("a").forEach(link => {
        const url = new URL(link.href, window.location.origin);
        url.searchParams.set("firstLetter", firstLetter || 'N/A');
        link.href = url.toString();
    });

    // Dropdown functionality
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    // Toggle dropdown visibility on user initial click
    if (userInitialElement) {
        userInitialElement.addEventListener("click", () => {
            profileDropdown.style.display = 
                profileDropdown.style.display === "none" ? "block" : "none";
        });
    }

    // Close the dropdown if the user clicks outside of it
    document.addEventListener("click", (event) => {
        if (!userInitialElement.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.style.display = "none";
        }
    });

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            window.location.href = "UTSlogin.php?action=logout"; // Redirect to PHP logout script
        });
    }


});