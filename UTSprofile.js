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

// Function to handle profile form submission
async function handleProfileSubmit(event) {
    event.preventDefault(); // Prevent the default form submission

    const form = event.target;

    // Gather form data
    const formData = new FormData(form);
    formData.append('action', 'updateProfile'); // Add the action to the form data

    try {
        // Make a POST request to update the profile
        const response = await fetch('UTSprofile.php', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert('Profile updated successfully!');
            // Optionally reload the profile data to reflect changes
            window.location.reload();
        } else if (result.errors) {
            // Display specific validation errors
            for (const [field, message] of Object.entries(result.errors)) {
                const errorElement = document.getElementById(`${field}Error`);
                if (errorElement) {
                    errorElement.textContent = message;
                }
            }
        } else {
            alert(result.message || 'Failed to update profile.');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An unexpected error occurred. Please try again.');
    }
}

// Normal DOMContentLoaded body
document.addEventListener('DOMContentLoaded', () => {
    populateProfileForm(); // Call the function on DOM load

    const profileForm = document.getElementById('editProfileForm'); // Make sure the form has this ID
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit); // Attach submit handler
    }

});
