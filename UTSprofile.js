// Function to fetch and populate profile data
async function populateProfileForm() {
    try {
        // Make a POST request to fetch profile data
        const response = await fetch('UTSprofile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'fetchProfile' })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Populate the form fields with the fetched data
            const { full_name, email, phone_number, username } = result.data;

            document.getElementById('full_name').value = full_name;
            document.getElementById('email').value = email;
            document.getElementById('phone').value = phone_number;
            document.getElementById('username').value = username;

            // Optional: Clear password input if populated (for security)
            document.getElementById('password').value = '';
        } else {
            // Handle errors (e.g., user not found)
            alert(result.message || 'Failed to load profile data.');
        }
    } catch (error) {
        // Handle network or unexpected errors
        console.error('Error fetching profile data:', error);
        alert('An error occurred while loading your profile. Please try again.');
    }
}

// Normal DOMContentLoaded body
document.addEventListener('DOMContentLoaded', () => {
    populateProfileForm(); // Call the function on DOM load
});
