const form = document.querySelector("#rsvp-form");
const statusEl = document.querySelector(".form-status");
const submitButton = form?.querySelector("button[type='submit']");

const { supabaseUrl, supabaseKey } = document.body.dataset;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(supabaseUrl, supabaseKey)
  : null;

const setStatus = (message, isError = false) => {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#f7b3b3" : "#f2d7a1";
};

if (!hasSupabaseConfig) {
  setStatus("Add Supabase credentials in the data attributes to enable RSVP.", true);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("Supabase is not configured yet.", true);
    return;
  }

  submitButton?.setAttribute("disabled", "disabled");
  setStatus("Sending your RSVP...");

  const formData = new FormData(form);
  const payload = {
    guest_name: formData.get("guest_name"),
    soup: formData.get("soup"),
    starter: formData.get("starter"),
    sorbet: formData.get("sorbet"),
    notes: formData.get("notes"),
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabaseClient
    .from("wedding_rsvps")
    .insert([payload]);

  if (error) {
    setStatus("Something went wrong. Please try again.", true);
  } else {
    setStatus("Thank you! Your RSVP has been recorded.");
    form.reset();
  }

  submitButton?.removeAttribute("disabled");
});
