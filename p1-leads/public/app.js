// For Waiting until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
/* ========================= DOM ELEMENT REFERENCES ========================= */
  const grid = document.querySelector("#grid tbody"); // Table body where leads will be displayed
  const form = document.querySelector("#newLead"); // Form for adding a new lead
  const q = document.querySelector("#q"); // Search input (query)
  const statusSel = document.querySelector("#status"); // Status filter dropdown
  const applyFiltersBtn = document.querySelector("#applyFilters"); // "Apply Filters" button
  const modal = document.querySelector("#modal"); // Modal window for viewing/editing lead details
  const modalBody = document.querySelector("#modalBody"); // Content area inside the modal
  const closeModal = document.querySelector("#closeModal"); // "Close" button on modal

  let editingLead = null; // store the lead currently being edited

  applyFiltersBtn.addEventListener("click", load); // Load leads when filters are applied

  //=========================  Handle new lead submission form ========================= 
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent page reload when form is submitted
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      // Send a POST request to create a new lead
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Handle case where server returns a duplicate/conflict error
      if (res.status === 409) {
        const { error } = await res.json();
        alert("❌ " + error);
        return;
      }

        // Handle generic validation errors
      if (!res.ok) throw new Error("Validation failed");

      // If successful: reset form and reload the table
      form.reset();
      load();
    } catch (err) {
      alert("❌ " + err.message);
    }
  });

  //=========================  Load leads and render table ========================= 
  async function load() {
    // Build URL query parameters based on filters
    const params = new URLSearchParams();
    if (q.value) params.set("q", q.value);
    if (statusSel.value) params.set("status", statusSel.value);

    // Fetch filtered leads from the server
    const res = await fetch("/api/leads?" + params.toString());
    const leads = await res.json();

    // Render the leads table and enable buttons
    grid.innerHTML = leads.map(row).join("");
    bindActions();
  }

  // Returns HTML for one table row representing a lead
  function row(l) {
    return `
      <tr>
        <td>${l.name}</td>
        <td>${l.email}</td>
        <td>${l.company || ""}</td>
        <td><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td> 
        <td class="actions">
          <button class="link neutral" data-id="${l.id}" data-action="view">View</button>
          <button class="link" data-id="${l.id}" data-action="edit">Edit</button>
          <button class="link danger" data-id="${l.id}" data-action="delete">Delete</button>
        </td>
      </tr>`;
  }

  //=========================  Fetch a single lead by ID ========================= 
  async function fetchLead(id) {
    try {
      const res = await fetch("/api/leads/" + id);
      if (!res.ok) throw new Error("Lead not found");
      return await res.json();
    } catch (err) {
      alert("❌ " + err.message);
      return null;
    }
  }

  /*  ========================= 
        Bind action buttons
      ========================= */
  function bindActions() {
    // Select all buttons (View, Edit, Delete, etc.) and attach click handlers
    document.querySelectorAll(".link").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        //========================= VIEW DETAILS ========================= 
        if (btn.dataset.action === "view") {
          const lead = await fetchLead(id);
          if (lead) showDetails(lead, false);
          return;
        }

        //=========================  EDIT  ========================= 
        if (btn.dataset.action === "edit") {
          const lead = await fetchLead(id);
          if (lead) showDetails(lead, true);
          return;
        }

        //=========================  DELETE LEAD ========================= 
        if (btn.dataset.action === "delete") {
          if (!confirm("Are you sure you want to permanently delete this lead?")) return;

          try {
            const res = await fetch("/api/leads/" + id, { method: "DELETE" });
            if (!res.ok) {
              const err = await res.json();
              alert("❌ Delete failed: " + (err.error || "Unknown error"));
              return;
            }
            alert("Lead deleted successfully");
            load(); // Refresh the table after deletion
          } catch (err) {
            alert("❌ " + err.message);
          }
          return;
        }

        //=========================  UPDATE STATUS ========================= 
        const status = btn.dataset.s;
        if (status) {
          await fetch("/api/leads/" + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          load();
        }
      });
    });
  }

  /* =========================
     SHOW DETAILS IN MODAL
  ========================= */
  // Displays a lead’s full details in a modal window
  // If `editMode` is true, allows editing; otherwise, read-only view
  function showDetails(lead, editMode = false) {
    editingLead = lead;

    if (editMode) {
      // Render editable form for updating lead
      modalBody.innerHTML = `
        <form id="editForm">
          <label>Name <input name="name" value="${lead.name}" required /></label>
          <label>Email <input name="email" value="${lead.email}" type="email" required /></label>
          <label>Company <input name="company" value="${lead.company || ""}" /></label>
          <label>Source <input name="source" value="${lead.source || ""}" /></label>
          <label>Status
            <select name="status">
              <option ${lead.status === "New" ? "selected" : ""}>New</option>
              <option ${lead.status === "Contacted" ? "selected" : ""}>Contacted</option>
              <option ${lead.status === "Qualified" ? "selected" : ""}>Qualified</option>
              <option ${lead.status === "Lost" ? "selected" : ""}>Lost</option>
            </select>
          </label>
          <label>Notes <textarea name="notes">${lead.notes || ""}</textarea></label>
          <button type="submit" class="primary full">Save your Changes</button>
        </form>
      `;

       // Bind submit event to handle update
      const editForm = modalBody.querySelector("#editForm");
      editForm.addEventListener("submit", handleUpdate);
    } else {
      // Render read-only lead details
      modalBody.innerHTML = `
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Company:</strong> ${lead.company || "-"}</p>
        <p><strong>Source:</strong> ${lead.source || "-"}</p>
        <p><strong>Status:</strong> ${lead.status}</p>
        <p><strong>Notes:</strong><br>${lead.notes || "(none)"}</p>
        <p><em>Created at: ${new Date(lead.createdAt).toLocaleString()}</em></p>
      `;
    }

    // Show modal (remove hidden class)
    modal.classList.remove("hidden");
  }

  //=========================  Handle updating a lead ========================= 
  async function handleUpdate(e) {
    e.preventDefault(); // reloading after updated

    // Collect updated field values
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      // Send PATCH request to update the lead
      const res = await fetch("/api/leads/" + editingLead.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Update failed");

      alert("Lead successfully updated!");
      modal.classList.add("hidden"); // Close modal
      load();
    } catch (err) {
      alert("❌ " + err.message);
    }
  }

  /* =========================
     MODAL CLOSE HANDLERS
  ========================= */
  // Close modal when clicking the close button
  closeModal.addEventListener("click", () => modal.classList.add("hidden"));

  // Also close when clicking outside the modal content area
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  /* =========================
     INITIAL LOAD
  ========================= */
  // Load all leads when the page first opens
  load();
});
