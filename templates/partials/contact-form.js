<script>
(function () {
    // UI strings for this page's language (filled in at build time)
    var MSG = __MSG__;

    var contactForm = document.getElementById('contact-form');
    var submitBtn = document.getElementById('contact-submit-btn');
    var formStatus = document.getElementById('form-status');

    // Inputs for validation
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var phoneInput = document.getElementById('contact-phone');
    var messageInput = document.getElementById('contact-message');

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        var isValid = true;
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var phoneRegex = /^\+?[0-9\s()\-]{7,20}$/;

        function validateField(input, errorId, customCheck) {
            var errorDiv = document.getElementById(errorId);
            var isFieldValid = customCheck !== undefined ? customCheck : (input.value.trim() !== '' && input.validity.valid);

            if (!isFieldValid) {
                errorDiv.classList.remove('hidden');
                input.classList.add('!border-error');
                isValid = false;
            } else {
                errorDiv.classList.add('hidden');
                input.classList.remove('!border-error');
            }
        }

        // Reset previous form status text
        formStatus.classList.add('hidden');

        validateField(nameInput, 'name-error');
        validateField(emailInput, 'email-error', (emailInput.value.trim() !== '' && emailRegex.test(emailInput.value)));

        // Phone is optional, but if filled, it must be valid
        var isPhoneValid = phoneInput.value.trim() === '' || phoneRegex.test(phoneInput.value.trim());
        validateField(phoneInput, 'phone-error', isPhoneValid);

        validateField(messageInput, 'message-error');

        // Stop submission if validation failed
        if (!isValid) return;

        var formData = new FormData(contactForm);
        var originalText = submitBtn.textContent;

        submitBtn.textContent = MSG.sending;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';

        try {
            var response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            var data = await response.json();

            if (data.success) {
                formStatus.textContent = MSG.success;
                formStatus.className = 'mt-6 font-body text-sm text-green-700';
                formStatus.classList.remove('hidden');
                contactForm.reset();
                // analytics:start
                // Not counted from a test/preview host (or with ?test), same rule as the owners form.
                if (/^(www\.)?noveris\.sk$/.test(location.hostname) && !/[?&]test(&|=|$)/.test(location.search)) track('contact-form-sent', { lang: document.documentElement.lang });
                // analytics:end
            } else {
                formStatus.textContent = MSG.failure;
                formStatus.className = 'mt-6 font-body text-sm text-error';
                formStatus.classList.remove('hidden');
            }
        } catch (error) {
            formStatus.textContent = MSG.error;
            formStatus.className = 'mt-6 font-body text-sm text-error';
            formStatus.classList.remove('hidden');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '';
        }
    });
})();
</script>
