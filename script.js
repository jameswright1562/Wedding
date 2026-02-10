const form = document.querySelector("#rsvp-form");
const statusEl = document.querySelector(".form-status");
const submitButton = form?.querySelector("button[type='submit']");
const addDependentButton = document.querySelector("#add-dependent");
const dependentsContainer = document.querySelector("#dependents-container");
const dependentTemplate = document.querySelector("#dependent-template");

// Prevent zoom on input focus for iOS
const preventZoom = () => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    // Store original viewport
    const originalContent = viewport.getAttribute("content");
    
    document.addEventListener("focusin", (e) => {
      if (e.target.matches("input, select, textarea")) {
        viewport.setAttribute("content", originalContent + ", user-scalable=no");
      }
    });
    
    document.addEventListener("focusout", () => {
      viewport.setAttribute("content", originalContent);
    });
  }
};

// Only apply on mobile devices
if (window.matchMedia("(max-width: 768px)").matches) {
  preventZoom();
}

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
  // After appending, wire up tab controls inside the newly added dependent
  const setupTabs = (root) => {
    const buttons = root.querySelectorAll('.tab-btn');
    const panels = root.querySelectorAll('.tab-panel');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => {
          const sel = p.querySelectorAll('select');
          sel.forEach((s) => {
            if (p.dataset.panel === type) {
              p.classList.add('active');
              if (s) s.disabled = false;
            } else {
              p.classList.remove('active');
              if (s) s.disabled = true;
            }
          })

        });
      });
    });
    // ensure initial state
    panels.forEach((p) => {
      const sel = p.querySelector('select');
      if (!p.classList.contains('active') && sel) sel.disabled = true;
      if (p.classList.contains('active') && sel) sel.disabled = false;
    });
  };

  if (dependent) setupTabs(dependent);
  updateDependentLabels();
};

addDependentButton?.addEventListener("click", () => {
  addDependent();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  // if (!supabaseClient) {
  //   setStatus("Supabase is not configured yet.", true);
  //   return;
  // }

  submitButton?.setAttribute("disabled", "disabled");
  setStatus("Sending your RSVP...");

  const formData = new FormData(form);
  const submittedAt = new Date().toISOString();
  const payload = {
    guest_name: formData.get("guest_name"),
    starter: formData.get("starter"),
    sorbet: formData.get("sorbet"),
    main_course: formData.get("main_course"),
    dessert: formData.get("dessert"),
    notes: formData.get("notes"),
    dependent_of: null,
    isKid: false,
    submitted_at: submittedAt,
  };

  const dependentRows = Array.from(
    dependentsContainer?.querySelectorAll(".dependent") ?? []
  )
    .map((dependent) => {
      const isKid = dependent.querySelector(".tab-panel.active").dataset.panel === "dependant";
      const getValue = (selector, changeSelector = true) => {
        if(!changeSelector) return dependent.querySelector(selector)?.value ?? "";
        if(isKid) selector += "_kid";
        selector += "']";
        console.log(selector)
        var x = dependent.querySelector(selector)?.value ?? "";
        console.log(x)
        return x;
      }
      var dependent = {
        guest_name: getValue("input[name='dependent_name']", false),
        starter: getValue("select[name='dependent_starter") ?? "",
        sorbet: getValue("select[name='dependent_sorbet") ?? "",
        main_course: getValue("select[name='dependent_main_course") ?? "",
        dessert: getValue("select[name='dependent_dessert") ?? "",
        notes: getValue("textarea[name='dependent_notes']", false) ?? "",
        isKid: isKid,
        dependent_of: payload.guest_name,
        submitted_at: submittedAt,
      };
      console.log(dependent)
      return dependent;
    })
    .filter((row) => row.guest_name);

  const req = [payload, ...dependentRows];
    console.log(req)
  const { error } = await supabaseClient
    .from("wedding_rsvps")
    .insert(req);

  if (error) {
    setStatus("Something went wrong. Please try again.", true);
  } else {
    setStatus("Thank you! Your RSVP has been recorded.");
    form.reset();
    dependentsContainer.innerHTML = "";
  }

  submitButton?.removeAttribute("disabled");
});
