(() => {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const fields = {
    lastName: form.elements.last_name,
    firstName: form.elements.first_name,
    lastNameKana: form.elements.last_name_kana,
    firstNameKana: form.elements.first_name_kana,
    inquiryType: form.elements.inquiry_type,
    phone: form.elements.phone,
    email: form.elements.email,
    emailConfirm: form.elements.email_confirm,
    message: form.elements.message,
  };

  const fullWidthPattern = /^[^\u0000-\u007f\uff61-\uff9f]+$/u;
  const katakanaPattern = /^[ァ-ヶー　]+$/u;
  const phonePattern = /^[0-9]+$/;
  let validationStarted = false;

  const showError = (key, inputs, invalid) => {
    const error = form.querySelector(`[data-error-for="${key}"]`);
    if (error) error.hidden = !invalid;

    inputs.forEach((input) => {
      input.classList.toggle("is-invalid", invalid);
      if (invalid) {
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
      }
    });

    return !invalid;
  };

  const validate = () => {
    const results = [];
    const nameInputs = [fields.lastName, fields.firstName];
    const kanaInputs = [fields.lastNameKana, fields.firstNameKana];

    const nameInvalid = nameInputs.some(
      (input) => !input.value.trim() || !fullWidthPattern.test(input.value.trim()),
    );
    results.push({
      valid: showError("name", nameInputs, nameInvalid),
      input: fields.lastName,
    });

    const kanaInvalid = kanaInputs.some(
      (input) => !input.value.trim() || !katakanaPattern.test(input.value.trim()),
    );
    results.push({
      valid: showError("kana", kanaInputs, kanaInvalid),
      input: fields.lastNameKana,
    });

    const inquiryInvalid = !fields.inquiryType.value;
    results.push({
      valid: showError("inquiry-type", [fields.inquiryType], inquiryInvalid),
      input: fields.inquiryType,
    });

    const phoneInvalid =
      !fields.phone.value.trim() || !phonePattern.test(fields.phone.value.trim());
    results.push({
      valid: showError("phone", [fields.phone], phoneInvalid),
      input: fields.phone,
    });

    const emailInvalid =
      !fields.email.value.trim() || !fields.email.validity.valid;
    results.push({
      valid: showError("email", [fields.email], emailInvalid),
      input: fields.email,
    });

    const emailConfirmInvalid =
      !fields.emailConfirm.value.trim() ||
      fields.emailConfirm.value.trim() !== fields.email.value.trim();
    results.push({
      valid: showError(
        "email-confirm",
        [fields.emailConfirm],
        emailConfirmInvalid,
      ),
      input: fields.emailConfirm,
    });

    const messageInvalid = !fields.message.value.trim();
    results.push({
      valid: showError("message", [fields.message], messageInvalid),
      input: fields.message,
    });

    return {
      valid: results.every((result) => result.valid),
      firstInvalid: results.find((result) => !result.valid)?.input,
    };
  };

  form.addEventListener("submit", (event) => {
    validationStarted = true;
    const result = validate();

    if (!result.valid) {
      event.preventDefault();
      result.firstInvalid?.focus();
      result.firstInvalid?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });

  form.addEventListener("input", () => {
    if (validationStarted) validate();
  });

  form.addEventListener("change", () => {
    if (validationStarted) validate();
  });
})();
