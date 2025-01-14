// Handles session-related tasks
const UTSsessionManager = (() => {
    const apiEndpoint = 'UTSauth_check.php'; // Endpoint for session authentication checks
    const logoutEndpoint = 'UTSloginLogout.php'; // Endpoint for logout requests
    const authCheckInterval = 5 * 60 * 1000; // Interval for authentication checks (30 minutes)

    // Redirects to the welcome page if the user is not authenticated or session has expired
    async function authenticateAndGetDetails(updateLastActivity = true) {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ updateLastActivity }),
            });
            const data = await response.json();

            if (!data.authenticated) {
                console.log(data.message || 'Session inactive. Redirecting to welcome page...');
                window.location.href = 'UTSwelcome.html';
                return null; // Authentication failed
            } else {
                console.log('User authenticated:', data);
                return data; // Return user details
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            return null; // Handle authentication check error
        }
    }

    // Function to call the updateLastActivity action in PHP
    async function updateLastActivity() {
        try {
            const response = await fetch('UTSauth_check.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'updateLastActivity' }), // Specify the action
            });

            const data = await response.json();

            if (data.status === 'success') {
                console.log('Last activity updated successfully:', data.message);
            } else {
                console.error('Failed to update last activity:', data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error updating last activity:', error);
        }
    }

    // Logs out the user and redirects to the welcome page
    async function logoutUser() {
        try {
            const response = await fetch(logoutEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ action: 'logout' }),
            });

            const result = await response.json();
            if (result.status === 'success') {
                console.log(result.message || 'Logged out successfully.');
                window.location.href = 'UTSwelcome.html'; // Redirect to welcome page
            } else {
                console.error('Logout failed:', result.message || 'Unknown error.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    // Periodic authentication check
    async function startAuthCheckInterval() {
        console.log('Interval started:');
        setInterval(async () => {
            
            const userDetails = await authenticateAndGetDetails(false);
            if (userDetails) {
                console.log('Session validated periodically:', userDetails, ` Current time: ${new Date().toISOString()}`);
            }
        }, authCheckInterval);
    }

    // Initializes session-related UI updates and checks
    async function initializeSession() {
        const userDetails = await authenticateAndGetDetails();
        const userInitialElement = document.getElementById('userInitial');

        if (userDetails) {
            // Update user initial in the profile UI
            if (userInitialElement && userDetails.username) {
                const firstInitial = userDetails.username.charAt(0).toUpperCase();
                userInitialElement.textContent = firstInitial;
            }

            // Start periodic authentication checks
            await startAuthCheckInterval();

        } else if (userInitialElement) {
            userInitialElement.textContent = 'N/A';
        }
        
    }

    

    // Handles the profile dropdown toggle
    function setupProfileDropdown() {
        const userInitialElement = document.getElementById('userInitial');
        const profileDropdown = document.getElementById('profileDropdown');
        const editProfileBtn = document.getElementById('editProfileBtn'); // Get the Edit Profile button
        const supportTicketBtn = document.getElementById('supportTicketBtn'); // Get the Support Ticket button
        const currentPage = window.location.pathname;

        if (userInitialElement && profileDropdown) {
            // Toggle dropdown visibility on profile icon click
            userInitialElement.addEventListener('click', () => {
                profileDropdown.style.display =
                    profileDropdown.style.display === 'none' || profileDropdown.style.display === ''
                        ? 'block'
                        : 'none';
            });

            // Close dropdown if clicked outside
            document.addEventListener('click', (event) => {
                if (
                    !userInitialElement.contains(event.target) &&
                    !profileDropdown.contains(event.target)
                ) {
                    profileDropdown.style.display = 'none';
                }
            });

            // Add event listener for Edit Profile button
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => {
                    window.location.href = 'UTSprofile.html'; // Navigate to the Edit Profile page
                });
            } else if (currentPage === '/UTSprofile.html') {
                console.error('Edit Profile button not found.');
            }

            // Add event listener for Support Ticket button
            if (supportTicketBtn) {
                supportTicketBtn.addEventListener('click', () => {
                    window.location.href = 'UTSticket.html'; // Navigate to the Support Ticket page
                });
            } else if (currentPage === '/UTSticket.html') {
                console.error('Support Ticket button not found.');
            }

        } else {
            console.error('Profile dropdown or user initial element not found.');
        }
    }

    // Publicly exposed methods
    return {
        authenticateAndGetDetails,
        //getUserDetails,
        logoutUser,
        initializeSession,
        setupProfileDropdown,
        updateLastActivity, // Expose this function
    };
})();

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Redirect to welcome if session is inactive
    //await UTSsessionManager.redirectToWelcomeIfUnauthenticated();

    // Initialize session UI
    await UTSsessionManager.initializeSession();

    // Set up logout button event
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => UTSsessionManager.logoutUser());
    }

    // Set up profile dropdown toggle functionality
    UTSsessionManager.setupProfileDropdown();

    // Attach the updateLastActivity function to click events
    document.addEventListener('click', () => {
        UTSsessionManager.updateLastActivity(); // Call the function on any click
    });

});