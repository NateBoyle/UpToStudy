function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const firstLetter = urlParams.get('firstLetter');
    return { firstLetter };
}

document.addEventListener("DOMContentLoaded", function() {
    const { firstLetter } = getQueryParams();
    console.log("Received firstLetter:", firstLetter); // Debug log

    if (firstLetter) {
        const userInitialElement = document.getElementById('userInitial');
        if (userInitialElement) {
            userInitialElement.textContent = firstLetter;
        }

        document.querySelectorAll("a").forEach(link => {
            const url = new URL(link.href, window.location.origin);
            url.searchParams.set("firstLetter", firstLetter);
            link.href = url.toString();
        });

    } else if (document.getElementById('userInitial')) {
        document.getElementById('userInitial').textContent = 'N/A';
    }
});