# santri.vip

Minimalist personal engineering portfolio and lightweight **Go Micro-CMS** powering **[santri.vip](https://santri.vip)**.

Designed for speed, simplicity, and zero database overhead—all portfolio content, experience timelines, project showcases, and tech stack items are served dynamically from a flat-file JSON store (`content.json`) backed by a single-binary Go HTTP server.

---

## Features

- **Zero-Database Flat-File Engine** — Reads and persists structured portfolio data directly via `content.json` with zero external database dependencies.
- **Single-Binary Go Server** — Built purely on Go's standard library (`net/http`), capable of compiling into a standalone executable for Windows or Linux.
- **Adaptive Theme System** — Supports `Light`, `Dark`, and `System` color schemes with smooth transitions and editorial typography (*Inter* & *Newsreader*).
- **Interactive Command Menu (`Ctrl + K`)** — Floating navigation pill with quick section jumping and theme switching.
- **Live GitHub Activity Card** — Fetches and renders real-time GitHub contribution graphs on social hover.
- **Built-in Content Manager** — Protected management interface for updating bio paragraphs, career history, project cards, media assets, and tech stack items on the fly.

---

## Tech Stack

- **Backend**: Go (`1.23+`, standard `net/http`)
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Tailwind CSS v4
- **Storage**: Flat-file JSON (`content.json` & `config.json`)

---

## Project Structure

```text
├── admin/                  # Content management UI templates
├── assets/                 # Static media, avatars, and project thumbnails
├── config.example.json     # Server & authentication configuration template
├── content.json            # Structured portfolio data store
├── go.mod                  # Go module definition
├── index.html              # Rendered public landing page
├── index.template.html     # Base HTML template
├── main.go                 # Go HTTP server, API routes, and static file handler
├── script.js               # Client-side interactivity, theme switcher & command menu
└── style.css               # Compiled Tailwind CSS v4 stylesheet
```

---

## Getting Started

### Prerequisites

- **Go** `1.22` or newer installed on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/lutfialhakim/landing-page-santri.vip.git
cd landing-page-santri.vip
```

### 2. Configure Environment

Copy the example configuration file and set your local port and credentials:

```bash
cp config.example.json config.json
```

Example `config.json`:

```json
{
  "port": "3456",
  "admin_user": "admin",
  "admin_password": "change_this_password"
}
```

> **Note:** `config.json` is excluded via `.gitignore` so credentials are never committed to version control.

### 3. Run the Server

Run directly in development mode:

```bash
go run main.go
```

Or compile a standalone production binary:

```bash
# Linux (amd64)
GOOS=linux GOARCH=amd64 go build -o server-linux-amd64 main.go

# Windows
go build -o server.exe main.go
```

The application will be available at `http://localhost:3456`.

---

## License

Released under the [LICENSE](./LICENSE) included in this repository.  
© 2026 [Lutfi Alhakim](https://santri.vip).