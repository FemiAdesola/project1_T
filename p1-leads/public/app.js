// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("#grid tbody");
  const form = document.querySelector("#newLead");
  const q = document.querySelector("#q");
  const statusSel = document.querySelector("#status");
  const applyFiltersBtn = document.querySelector("#applyFilters");
  const modal = document.querySelector("#modal");
  const modalBody = document.querySelector("#modalBody");
  const closeModal = document.querySelector("#closeModal");

  // Load leads when filters are applied
  applyFiltersBtn.addEventListener("click", load);

  // Handle new lead submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        const { error } = await res.json();
        alert("❌ " + error); // Show specific error about email
        return;
      }

      if (!res.ok) throw new Error("Validation failed");

      form.reset();
      load();
    } catch (err) {
      alert("❌ " + err.message);
    }
  });

  // Load leads and render table
  async function load() {
    const params = new URLSearchParams();
    if (q.value) params.set("q", q.value);
    if (statusSel.value) params.set("status", statusSel.value);

    const res = await fetch("/api/leads?" + params.toString());
    const leads = await res.json();

    grid.innerHTML = leads.map(row).join("");
    bindActions();
  }

  // Render a table row
  function row(l) {
    return `
      <tr>
        <td>${l.name}</td>
        <td>${l.email}</td>
        <td>${l.company || ""}</td>
        <td><span class="badge ${l.status.toLowerCase()}">${
      l.status
    }</span></td>
        <td class="actions">
          <button class="link" data-id="${
            l.id
          }" data-s="Contacted">Contacted</button>
          <button class="link" data-id="${
            l.id
          }" data-s="Qualified">Qualified</button>
          <button class="link danger" data-id="${
            l.id
          }" data-s="Lost">Lost</button>
          <button class="link neutral" data-id="${
            l.id
          }" data-action="view">View</button>
          <button class="link danger" data-id="${
            l.id
          }" data-action="delete">Delete</button>
        </td>
      </tr>`;
  }

  // Bind action buttons
  function bindActions() {
    document.querySelectorAll(".link").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        // VIEW DETAILS
        if (btn.dataset.action === "view") {
          const res = await fetch(
            "/api/leads?" + new URLSearchParams({ q: id })
          );
          const leads = await res.json();
          const lead = leads.find((l) => l.id === id);
          if (lead) showDetails(lead);
          return;
        }

        // DELETE LEAD (persistent)
        if (btn.dataset.action === "delete") {
          if (
            !confirm("Are you sure you want to permanently delete this lead?")
          )
            return;

          try {
            const res = await fetch("/api/leads/" + id, { method: "DELETE" });

            if (!res.ok) {
              const err = await res.json();
              alert("❌ Delete failed: " + (err.error || "Unknown error"));
              return;
            }

            alert("Lead deleted successfully");
            load();
          } catch (err) {
            alert("❌ " + err.message);
          }
          return;
        }

        //  UPDATE STATUS
        const status = btn.dataset.s;
        await fetch("/api/leads/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        load();
      });
    });
  }

  // Show lead details in modal
  function showDetails(lead) {
    modalBody.innerHTML = `
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Company:</strong> ${lead.company || "-"}</p>
      <p><strong>Source:</strong> ${lead.source || "-"}</p>
      <p><strong>Status:</strong> ${lead.status}</p>
      <p><strong>Notes:</strong><br>${lead.notes || "(none)"}</p>
      <p><em>Created at: ${new Date(lead.createdAt).toLocaleString()}</em></p>
    `;
    modal.classList.remove("hidden");
  }

  // Close modal
  closeModal.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  // Initial load
  load();
});
