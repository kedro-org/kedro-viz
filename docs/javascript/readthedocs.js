document.addEventListener("DOMContentLoaded", function(event) {
    // Trigger Read the Docs' search addon instead of Material MkDocs default
    document.querySelector(".md-search__button").addEventListener("focus", (e) => {
            const event = new CustomEvent("readthedocs-search-show");
            document.dispatchEvent(event);
        });
    });
