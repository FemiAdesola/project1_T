const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

const DATA = path.join(__dirname, "leads.json");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Utility: read and write JSON leads data
function readLeads() {
  if (!fs.existsSync(DATA)) return [];
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}
function writeLeads(leads) {
  fs.writeFileSync(DATA, JSON.stringify(leads, null, 2));
}

/* ---------------------- API ROUTES ---------------------- */

// GET all leads (with optional search + filter)
app.get("/api/leads", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const status = (req.query.status || "").toLowerCase();
  let list = readLeads();
  if (q)
    list = list.filter((l) =>
      (l.name + l.company + l.id).toLowerCase().includes(q)
    );
  if (status) list = list.filter((l) => l.status.toLowerCase() === status);
  res.json(list);
});

// POST create a new lead
app.post("/api/leads", (req, res) => {
  const { name, email, company, source, notes } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and email are required" });

  const leads = readLeads();

  // Check if email already exists
  const existingLead = leads.find((lead) => lead.email === email);
  if (existingLead) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const lead = {
    id: Date.now().toString(),
    name,
    email,
    company: company || "",
    source: source || "",
    notes: notes || "",
    status: "New",
    createdAt: new Date().toISOString(),
  };

  leads.push(lead);
  writeLeads(leads);
  res.status(201).json(lead);
});

// PATCH update a lead (status or notes)
app.patch("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const allowed = ["status", "notes"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) leads[idx][key] = req.body[key];
  }

  writeLeads(leads);
  res.json(leads[idx]);
});

// DELETE remove a lead by ID (persistent)
app.delete("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex((l) => l.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // Remove the selected lead
  const deleted = leads.splice(idx, 1)[0];
  writeLeads(leads);

  res.json({ message: "Lead deleted successfully", deleted });
});

/* --------------------------------------------------------- */

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.listen(PORT, () =>
  console.log("Server running at http://localhost:" + PORT)
);
