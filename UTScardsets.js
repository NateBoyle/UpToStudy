// Flashcard class for individual flashcards within a set
class Flashcard {
    constructor(question, answer, flashcardId) {
        this.question = question;
        this.answer = answer;
        this.flashcardId = flashcardId;
    }

    render() {
        const card = document.createElement('div');
        card.classList.add('flashcard');

        card.innerHTML = `
            <div class="flashcard-content">
                <h4>${this.question}</h4>
                <p>${this.answer}</p>
                <button class="options-button">&#8942;</button>
                <div class="options-menu" style="display: none;">
                    <button onclick="editFlashcard(${this.flashcardId})">Edit</button>
                    <button onclick="deleteFlashcard(${this.flashcardId})">Delete</button>
                </div>
            </div>
        `;

        const optionsButton = card.querySelector('.options-button');
        const optionsMenu = card.querySelector('.options-menu');

        optionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
        });

        return card;
    }
}

// Function to close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.options-menu').forEach(menu => {
        menu.style.display = 'none';
    });
}

// Function to open the modal for creating a new flashcard set
function openCreateSetModal() {
    loadCourses();
    document.getElementById("flashcardSetModal").style.display = "flex";
}

// Define the function to close the modal
function closeCreateSetModal() {
    document.getElementById("flashcardSetModal").style.display = "none";
}