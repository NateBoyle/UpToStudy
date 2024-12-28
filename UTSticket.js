document.addEventListener('DOMContentLoaded', () => {
    const supportTicketForm = document.getElementById('supportTicketForm'); // Form ID

    if (supportTicketForm) {
        supportTicketForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            // Gather form data
            const formData = new FormData(supportTicketForm);
            const subject = formData.get('subject').trim();
            const message = formData.get('message').trim();

            // Validate inputs
            if (!subject) {
                alert('Please enter a subject.');
                return;
            }

            if (!message) {
                alert('Please enter a message.');
                return;
            }

            try {
                // Send the form data to the PHP script
                const response = await fetch('UTSticket.php', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    alert('Your support ticket has been submitted successfully.');
                    supportTicketForm.reset(); // Reset the form
                } else {
                    alert(`Failed to submit support ticket: ${result.message}`);
                }
            } catch (error) {
                console.error('Error submitting support ticket:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });
    } else {
        console.error('Support Ticket form not found.');
    }
});
