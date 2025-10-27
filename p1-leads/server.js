// Import core Node.js and Express modules
const path = require("path"); // For handling and transforming file paths
const fs = require("fs"); // For reading/writing files on the server
const express = require("express"); // For creating the server and handling routes

const app = express(); // Initialize Express app

const PORT = process.env.PORT || 3000; // Set server port (from env or default 3000)

const DATA = path.join(__dirname, "leads.json"); // Define path to leads data JSON file

/*========================================
  Middleware to handle form data and JSON
  ========================================  */
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (HTML, CSS, JS)

/*======================================
  Utility: read and write JSON leads data
  ======================================  */
// Function to read leads data from JSON file
function readLeads() {
  if (!fs.existsSync(DATA)) return []; // If file doesn’t exist, return empty array
  return JSON.parse(fs.readFileSync(DATA, "utf8")); // Parse JSON into JS object
}

// Function to write updated leads data back to JSON file
function writeLeads(leads) {
  fs.writeFileSync(DATA, JSON.stringify(leads, null, 2)); // Save data prettified
}

/* ===========================
    API ROUTES
   =========================== */

/**
 * GET /api/leads
 * Fetch all leads with optional search and filter by status.
 */
app.get("/api/leads", (req, res) => {
  const q = (req.query.q || "").toLowerCase(); // Search query
  const status = (req.query.status || "").toLowerCase(); // Status filter
  let list = readLeads();  // Read all leads

   // Apply search filter if query provided
  if (q)
    list = list.filter((l) =>
      (l.name + l.company + l.id).toLowerCase().includes(q)
    );
  
  // Apply status filter if provided
  if (status) list = list.filter((l) => l.status.toLowerCase() === status);
  res.json(list); // Return filtered list
});

/**
 * GET /api/leads/:id
 * Fetch a single lead by ID.
 */
app.get("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const lead = leads.find((l) => l.id === req.params.id); // Find lead by ID
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(lead);
});

/**
 * POST /api/leads
 * Create a new lead with required name and email fields.
 */
app.post("/api/leads", (req, res) => {
  const { name, email, company, source, notes } = req.body;

  // Validate required fields
  if (!name || !email)
    return res.status(400).json({ error: "Name and email are required" });

  const leads = readLeads();

   // Check for duplicate email
  const existingLead = leads.find((lead) => lead.email === email);
  if (existingLead) {
    return res.status(409).json({ error: "Email already exists" });
  }

  // Create new lead object
  const lead = {
    id: Date.now().toString(), // Unique ID based on timestamp
    name,
    email,
    company: company || "",
    source: source || "",
    notes: notes || "",
    status: "New", // Default status
    createdAt: new Date().toISOString(),  // Timestamp
  };

  // Save new lead to file
  leads.push(lead);
  writeLeads(leads);
  res.status(201).json(lead); // Return the newly created lead status 
});

/**
 * PATCH /api/leads/:id
 * Update specific fields (status, notes, company) for a lead.
 */
app.patch("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

   // Only allow updates to certain fields ["status", "notes", "company"]
  const allowed = ["status", "notes", "company"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) leads[idx][key] = req.body[key];
  }

  writeLeads(leads);
  res.json(leads[idx]); // Return the updated lead
});

/**
 * DELETE /api/leads/:id
 * Permanently delete a lead by ID.
 */
app.delete("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex((l) => l.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // Remove the selected lead
  const deleted = leads.splice(idx, 1)[0];
  writeLeads(leads); // Save updated data

  res.json({ message: "Lead deleted successfully", deleted });
});

/* ============================================================= */


/* ===========================
    Serve Frontend (index.html)
   =========================== */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ===========================
    Start the Server
  =========================== */
// Start the Express server and log the running URL
app.listen(PORT, () =>
  console.log(`Server running at http://localhost: ${PORT} mode on port ${PORT}`)
);
