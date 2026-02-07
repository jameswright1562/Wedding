const form = document.querySelector("#rsvp-form");
const statusEl = document.querySelector(".form-status");
const submitButton = form?.querySelector("button[type='submit']");
const addDependentButton = document.querySelector("#add-dependent");
const dependentsContainer = document.querySelector("#dependents-container");
const dependentTemplate = document.querySelector("#dependent-template");

const configFromScript = window.SUPABASE_CONFIG ?? {};
const hasSupabaseConfig = Boolean(configFromScript.url && configFromScript.key);

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(configFromScript.url, configFromScript.key)
  : null;

const setStatus = (message, isError = false) => {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#f7b3b3" : "#f2d7a1";
};

if (!hasSupabaseConfig) {
  setStatus(
    "Supabase is not configured yet. Check the GitHub Pages secrets.",
    true
  );
}

const updateDependentLabels = () => {
  const dependents = dependentsContainer?.querySelectorAll(".dependent") ?? [];
  dependents.forEach((dependent, index) => {
    const label = dependent.querySelector(".dependent__label");
    if (label) {
      label.textContent = `Guest ${index + 1}`;
    }
  });
};

const addDependent = () => {
  if (!dependentsContainer || !dependentTemplate) {
    return;
  }
  const content = dependentTemplate.content.cloneNode(true);
  const dependent = content.querySelector(".dependent");
  const removeButton = content.querySelector(".dependent__remove");
  removeButton?.addEventListener("click", () => {
    dependent?.remove();
    updateDependentLabels();
  });
  dependentsContainer.appendChild(content);
  updateDependentLabels();
};

addDependentButton?.addEventListener("click", () => {
  addDependent();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("Supabase is not configured yet.", true);
    return;
  }

  submitButton?.setAttribute("disabled", "disabled");
  setStatus("Sending your RSVP...");

  const formData = new FormData(form);
  const submittedAt = new Date().toISOString();
  const payload = {
    guest_name: formData.get("guest_name"),
    soup: formData.get("soup"),
    starter: formData.get("starter"),
    sorbet: formData.get("sorbet"),
    notes: formData.get("notes"),
    dependent_of: null,
    submitted_at: submittedAt,
  };

  const dependentRows = Array.from(
    dependentsContainer?.querySelectorAll(".dependent") ?? []
  )
    .map((dependent) => {
      const getValue = (selector) =>
        dependent.querySelector(selector)?.value ?? "";
      return {
        guest_name: getValue("input[name='dependent_name']"),
        soup: getValue("select[name='dependent_soup']"),
        starter: getValue("select[name='dependent_starter']"),
        sorbet: getValue("select[name='dependent_sorbet']"),
        notes: getValue("textarea[name='dependent_notes']"),
        dependent_of: payload.guest_name,
        submitted_at: submittedAt,
      };
    })
    .filter((row) => row.guest_name);

  const { error } = await supabaseClient
    .from("wedding_rsvps")
    .insert([payload, ...dependentRows]);

  if (error) {
    setStatus("Something went wrong. Please try again.", true);
  } else {
    setStatus("Thank you! Your RSVP has been recorded.");
    form.reset();
    dependentsContainer.innerHTML = "";
  }

  submitButton?.removeAttribute("disabled");
});
