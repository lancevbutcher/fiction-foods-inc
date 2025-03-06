document.addEventListener("DOMContentLoaded", () => {
    window.onload = function() {
        document.getElementById("survey-form").reset();
        restaurantSelect.value = "";
        surveyFields.forEach(field => field.style.display = "none");
        receiptExample.style.display = "none";
        logoImage.style.display = "none";

        // Reset LaunchDarkly context
        ldClient.flush();
    };
    // set surveyxp var
    let surveyExperience = null; 

 
    const form = document.getElementById("survey-form");
    const receiptExample = document.querySelector("#receipt").nextElementSibling;
    receiptExample.style.display = "none";
    const restaurantSelect = document.getElementById("restaurant");
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    const logoImage = document.getElementById("restaurant-logo");
    const callbackSection = document.getElementById("callback-section");
    const surveyFields = document.querySelectorAll(
        "#survey-form > label:not([for='restaurant']), #survey-form > input, #survey-form > div, #survey-form > textarea, #survey-form > button"
    );
    const restaurantLabel = document.querySelector('label[for="restaurant"]');
    const restaurantDropdown = document.getElementById("restaurant");

    restaurantLabel.style.display = "block";
    restaurantDropdown.style.display = "block";

    let brandingEnabled = true;
    let logoEnabled = true;

    surveyFields.forEach(field => field.style.display = "none");

    function getBrowserType() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes("Edg")) return "Edge";
        if (userAgent.includes("Chrome")) return "Chrome";
        if (userAgent.includes("Firefox")) return "Firefox";
        if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
        if (userAgent.includes("Trident") || userAgent.includes("MSIE")) return "Internet Explorer";
        return "Other";
    }

    // ⚠️ For Metrics-testing, you may wish to change the 'key:' based on what your evaluating
    // I also made anonymous: false for sake of testing appearing in 'contexts'
    function getLDContext() {
        return {
            kind: "user",
            key: "user-31", // 👈 this is what you may want to alter for Metrics-testing
            anonymous: false,
            restaurant: restaurantSelect.value || "unknown",
            rating: document.querySelector('input[name="rating"]:checked')?.value || "none",
            browser: getBrowserType(),
            survey_experience: surveyExperience
        };
    }

    // ⚠️⚠️⚠️ Replace YOUR LaunchDarkly SDK key in line below 👇 where it says 'YOUR_LD_CLIENT-SIDE_ID_HERE'
    const ldClient = LDClient.initialize('YOUR_LD_CLIENT-SIDE_ID_HERE', getLDContext());

    ldClient.on('ready', () => {
        console.log('LaunchDarkly connected!');
        brandingEnabled = ldClient.variation('branding-flag', true); // 👈 here is a flag being called that you will have created.
        logoEnabled = ldClient.variation('logo-v2', false); // 👈 here is a flag being called that you will have created.

        toggleBranding(brandingEnabled);
        toggleLogo(logoEnabled);

        ldClient.on('change:branding-flag', (newValue) => {
            brandingEnabled = newValue;
            toggleBranding(brandingEnabled);
        });

        ldClient.on('change:logo-v2', (newValue) => {
            logoEnabled = newValue;
            toggleLogo(logoEnabled);
        });
    });

    function updateLDContext() {
        ldClient.identify(getLDContext(), (response) => {
            console.log("LaunchDarkly context updated:", response);
        });
    }

    function toggleBranding(enabled) {
        document.body.classList.remove("kahuna-theme", "pollos-theme", "pizza-theme");

        if (!enabled) return;

        const restaurant = restaurantSelect.value;
        if (restaurant === "kahuna") {
            document.body.classList.add("kahuna-theme");
        } else if (restaurant === "pizza") {
            document.body.classList.add("pizza-theme");
        } else if (restaurant === "pollos") {
            document.body.classList.add("pollos-theme");
        }
    }

    // ensure logo doesn't appear unless flag is on
    function toggleLogo(enabled) {
        if (!enabled) {
            logoImage.style.display = "none";
            logoImage.src = "";
            return;
        }

        let logoSrc = "";

        const restaurant = restaurantSelect.value;
        if (restaurant === "kahuna") {
            logoSrc = "images/Kahuna.jpg";
        } else if (restaurant === "pizza") {
            logoSrc = "images/surfer.jpg";
        } else if (restaurant === "pollos") {
            logoSrc = "images/Pollos.jpg";
        }

        if (logoSrc) {
            logoImage.src = logoSrc;
            logoImage.style.display = "block";
        } else {
            logoImage.style.display = "none";
        }
    }

    // check for logo and branding based on rest selection
    restaurantSelect.addEventListener("change", () => {
        toggleBranding(brandingEnabled);
        toggleLogo(logoEnabled);

        if (restaurantSelect.value) {
            surveyFields.forEach(field => field.style.display = "block");
            receiptExample.style.display = "block";
            updateLDContext({restaurant: restaurantSelect.value || "unknown"});
        } else {
            surveyFields.forEach(field => field.style.display = "none");
            receiptExample.style.display = "none";
        }
    });

    ratingInputs.forEach(input => {
        input.addEventListener("change", () => {
            updateLDContext({ rating: document.querySelector('input[name="rating"]:checked')?.value || "none" });
            if (callbackSection) {
                callbackSection.style.display = input.value === "1" ? "block" : "none";
            }
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        console.log("Survey Submitted");
        document.getElementById("survey-popup").style.display = "flex";
    });

    document.querySelectorAll(".survey-feedback").forEach(button => {
        button.addEventListener("click", (event) => {
            document.querySelectorAll(".survey-feedback").forEach(btn => {
                btn.classList.remove("selected");
                btn.style.backgroundColor = "";
                btn.style.color = "";
            });
    
            event.target.classList.add("selected");
            event.target.style.backgroundColor = "#4caf50";
            event.target.style.color = "white";
    
            // Store survey exp
            surveyExperience = event.target.dataset.response;
    
            console.log("Survey exp attribute updated:", surveyExperience);
            updateLDContext({ survey_experience: surveyExperience });  // updates LD
    
            if (surveyExperience === "easy") {
                ldClient.track("survey_easy_fun_clicked");
            }
        });
    });
    
    document.getElementById("close-popup").addEventListener("click", () => {
        document.getElementById("survey-popup").style.display = "none";
    
        console.log("Survey popup closed.");
    });

    document.getElementById("no-thank-you").addEventListener("click", () => {
        alert("We understand. We hope you will return and your next experience will be better.");
    });
});
