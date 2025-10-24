# Micro CRM Leads
>Micro CRM is a simple, file-based CRM (Customer Relationship Management) system built using **Node.js**, **Express**, and **JavaScript**.  
It helps small teams tracking customer leads, filter, view, update, search, delete and manage leads — with persistence through a JSON file.

> **View the live website link [here](https://femi-micro-crm.onrender.com)**
---

![home page](/img/CRMPage.png)

## Features

- Add new leads via a form (with validation)
- View all leads in a searchable, filterable table
- Update lead status (New → Contacted → Qualified → Lost)
- Delete leads permanently (via persistent API)
- View full lead details in a modal window
- Fully responsive UI with a clean design

---

## Project Structure

```
├── img/
│   ├── CRMPage.png
│   ├── EditPage.png
│   ├── EmailError.png
│   └── ViewModal.png
│ 
├── p1-leads/
│   ├── public/
│   │   ├── index.html       # Frontend HTML
│   │   ├── styles.css       # Styling (modern responsive layout)
│   │   └── app.js           # Frontend JavaScript logic
│   │
│   ├── leads.json           # Persistent data file (auto-created)
│   ├── package-lock.json   
│   ├── package.json    
│   ├── server.js            # Express backend server with REST API
│   └── server.js            # Express backend server with REST API
│ 
│ 
│ 
└── README.md            # Documentation
```

---

## Installation & Usage

### Clone the repository

```bash
git clone https://github.com/FemiAdesola/project1_T.git
cd project1_T
```

### Install dependencies

```bash
cd p1-leads
npm install express
```

### Start the server

```bash
cd p1-leads
node server.js
```

You’ll see:
```
Server running at http://localhost:3000
```

### Open in browser

Go to: [http://localhost:3000](http://localhost:3000)

---

## Example Usage

### Add a New Lead

1. Fill in **Name**, **Email**, **Company**, **Source**, and **Notes**.  
2. Click **Create Lead** — the lead will appear in the table below.

### Filter Leads

- Use the search bar to find leads by **name or company**.
- Filter by **status** (New, Contacted, Qualified, Lost).

### Update Status

- Click **Contacted**, **Qualified**, or **Lost** to update a lead’s status instantly.

![Update](/img/EditPage.png)

### View Details

- Click **View** to open a modal showing all lead information.

![View](/img/ViewModal.png)

### Delete Lead

- Click **Delete** and confirm to permanently remove the lead from the system.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| `GET` | `/api/leads` | Get all leads (with optional filters) |
| `GET` | `/api/leads:id` | Get single leads (view single lead) |
| `POST` | `/api/leads` | Create a new lead |
| `PATCH` | `/api/leads/:id` | Update lead status or notes |
| `DELETE` | `/api/leads/:id` | Permanently delete a lead |

---

## Example API Call
> If the email is existing in the dataset, it wil throw error that `Email already exists`to avoid double mail.

![EmailError](/img/EmailError.png)

### Create a lead
```bash
curl -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc",
  "source": "LinkedIn",
  "notes": "Potential high-value client"
}'
```

### View all lead
```bash
curl -X GET http://localhost:3000/api/leads/
```

### Delete a lead
```bash
curl -X DELETE http://localhost:3000/api/leads/1234567890
```

### View single lead
```bash
curl -X GET http://localhost:3000/api/leads/1761250346291
```
---

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js + Express
- **Storage:** JSON file (no database required)

---

## Customization

- You can style the UI by editing `public/styles.css`.
- Data is saved persistently in `leads.json`.

---

