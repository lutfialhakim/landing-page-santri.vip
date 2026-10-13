package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Config represents server and admin settings
type Config struct {
	Port          string `json:"port"`
	AdminUser     string `json:"admin_user"`
	AdminPassword string `json:"admin_password"`
}

// Content represents website content structure
type Content struct {
	Name           string            `json:"name"`
	Role           string            `json:"role"`
	Email          string            `json:"email"`
	Avatar         string            `json:"avatar"`
	Favicon        string            `json:"favicon,omitempty"`
	GithubURL      string            `json:"github_url"`
	LinkedinURL    string            `json:"linkedin_url"`
	XURL           string            `json:"x_url"`
	ShowExperience bool              `json:"show_experience"`
	ShowProjects   bool              `json:"show_projects"`
	ShowStack      bool              `json:"show_stack"`
	SectionIcons   map[string]string `json:"section_icons,omitempty"`
	SectionTitles  map[string]string `json:"section_titles,omitempty"`
	BioParagraphs  []string          `json:"bio_paragraphs"`
	Experiences    []Experience      `json:"experiences"`
	Projects       []Project         `json:"projects"`
	TechStack      []TechItem        `json:"tech_stack"`
	SocialLinks    []SocialLink      `json:"social_links,omitempty"`
	Footer         string            `json:"footer"`
}

type SocialLink struct {
	Platform string `json:"platform"`
	URL      string `json:"url"`
	Icon     string `json:"icon"`
	Visible  bool   `json:"visible"`
}

type Experience struct {
	Visible   bool     `json:"visible"`
	Period    string   `json:"period"`
	Role      string   `json:"role"`
	Company   string   `json:"company"`
	Logo      string   `json:"logo"`
	SubPeriod string   `json:"sub_period,omitempty"`
	SubRole   string   `json:"sub_role,omitempty"`
	Bullets   []Bullet `json:"bullets"`
	Skills    []string `json:"skills"`
}

type Bullet struct {
	Text    string `json:"text"`
	Tooltip string `json:"tooltip,omitempty"`
}

type Project struct {
	Visible     bool   `json:"visible"`
	Title       string `json:"title"`
	Stars       string `json:"stars"`
	Image       string `json:"image"`
	Description string `json:"description"`
	URL         string `json:"url"`
}

type TechItem struct {
	Name      string `json:"name"`
	Visible   bool   `json:"visible"`
	IconClass string `json:"icon_class,omitempty"`
	CustomSVG string `json:"custom_svg,omitempty"`
}

var (
	configLock    sync.RWMutex
	contentLock   sync.RWMutex
	activeConfig  Config
	sessions      = make(map[string]time.Time)
	sessionsLock  sync.Mutex
)

const (
	configFile    = "config.json"
	contentFile   = "content.json"
	sessionCookie = "santri_session"
)

func main() {
	loadConfig()

	port := activeConfig.Port
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}
	if port == "" {
		port = "3456"
	}

	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("GET /", handlePublicHome)
	mux.HandleFunc("GET /content.json", handleGetContentPublic)
	mux.HandleFunc("GET /style.css", handleStaticFile("style.css", "text/css"))
	mux.HandleFunc("GET /script.js", handleStaticFile("script.js", "application/javascript"))
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))))

	// Auth & Admin UI routes
	mux.HandleFunc("GET /login", handleLoginPage)
	mux.HandleFunc("GET /login/", handleLoginPage)
	mux.HandleFunc("POST /login", handleApiLogin)
	mux.HandleFunc("POST /login/", handleApiLogin)

	mux.HandleFunc("GET /admin", requireAuth(handleAdminDashboard))
	mux.HandleFunc("GET /admin/", requireAuth(handleAdminDashboard))

	// API routes
	mux.HandleFunc("POST /api/login", handleApiLogin)
	mux.HandleFunc("POST /api/logout", handleApiLogout)
	mux.HandleFunc("GET /api/content", requireAuth(handleApiGetContent))
	mux.HandleFunc("POST /api/content", requireAuth(handleApiSaveContent))
	mux.HandleFunc("POST /api/upload", requireAuth(handleApiUpload))
	mux.HandleFunc("POST /api/change-password", requireAuth(handleApiChangePassword))
	mux.HandleFunc("GET /api/credentials", requireAuth(handleApiGetCredentials))

	log.Printf("=====================================================")
	log.Printf("Santri VIP - Micro CMS Server aktif di port :%s", port)
	log.Printf("Situs Publik  : http://localhost:%s/", port)
	log.Printf("Panel Admin   : http://localhost:%s/admin", port)
	log.Printf("Login Default : user '%s' / password '%s'", activeConfig.AdminUser, activeConfig.AdminPassword)
	log.Printf("=====================================================")

	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}

// Configuration
func loadConfig() {
	configLock.Lock()
	defer configLock.Unlock()

	data, err := os.ReadFile(configFile)
	if err != nil {
		activeConfig = Config{
			Port:          "3456",
			AdminUser:     "admin",
			AdminPassword: "santri123",
		}
		saveConfigNoLock()
		return
	}
	if err := json.Unmarshal(data, &activeConfig); err != nil {
		activeConfig = Config{
			Port:          "3456",
			AdminUser:     "admin",
			AdminPassword: "santri123",
		}
	}
}

func saveConfigNoLock() error {
	data, err := json.MarshalIndent(activeConfig, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configFile, data, 0644)
}

// Authentication Helpers
func createSessionToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	token := hex.EncodeToString(b)

	sessionsLock.Lock()
	sessions[token] = time.Now().Add(24 * time.Hour)
	sessionsLock.Unlock()

	return token
}

func isValidSession(r *http.Request) bool {
	cookie, err := r.Cookie(sessionCookie)
	if err != nil {
		return false
	}

	sessionsLock.Lock()
	expiry, exists := sessions[cookie.Value]
	sessionsLock.Unlock()

	if !exists || time.Now().After(expiry) {
		return false
	}
	return true
}

func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !isValidSession(r) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
				return
			}
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		next(w, r)
	}
}

// Route Handlers
func handlePublicHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	http.ServeFile(w, r, "index.html")
}

func handleGetContentPublic(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")
	http.ServeFile(w, r, contentFile)
}

func handleStaticFile(filename, contentType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", contentType)
		http.ServeFile(w, r, filename)
	}
}

func handleLoginPage(w http.ResponseWriter, r *http.Request) {
	if isValidSession(r) {
		http.Redirect(w, r, "/admin", http.StatusSeeOther)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	http.ServeFile(w, r, filepath.Join("admin", "login.html"))
}

func handleAdminDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	http.ServeFile(w, r, filepath.Join("admin", "index.html"))
}

// API Handlers
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func handleApiLogin(w http.ResponseWriter, r *http.Request) {
	var username, password string
	isJSON := strings.Contains(r.Header.Get("Content-Type"), "application/json")

	if isJSON {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Format data tidak valid"})
			return
		}
		username = req.Username
		password = req.Password
	} else {
		if err := r.ParseForm(); err != nil {
			sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Format data form tidak valid"})
			return
		}
		username = r.FormValue("username")
		password = r.FormValue("password")
	}

	loadConfig()
	configLock.RLock()
	expectedUser := activeConfig.AdminUser
	expectedPass := activeConfig.AdminPassword
	configLock.RUnlock()

	if expectedUser == "" {
		expectedUser = "admin"
	}
	if expectedPass == "" {
		expectedPass = "santri123"
	}

	cleanUser := strings.TrimSpace(username)
	cleanExpected := strings.TrimSpace(expectedUser)

	isUserMatch := strings.EqualFold(cleanUser, cleanExpected)
	isPassMatch := (password == expectedPass)

	if !isUserMatch || !isPassMatch {
		if isJSON {
			sendJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "message": "Nama pengguna atau kata sandi salah"})
		} else {
			http.Redirect(w, r, "/login?error=invalid", http.StatusSeeOther)
		}
		return
	}

	token := createSessionToken()
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400,
	})

	if isJSON {
		sendJSON(w, http.StatusOK, map[string]any{"success": true})
	} else {
		http.Redirect(w, r, "/admin", http.StatusSeeOther)
	}
}

func handleApiLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		sessionsLock.Lock()
		delete(sessions, cookie.Value)
		sessionsLock.Unlock()
	}

	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	sendJSON(w, http.StatusOK, map[string]any{"success": true})
}

func handleApiGetContent(w http.ResponseWriter, r *http.Request) {
	contentLock.RLock()
	defer contentLock.RUnlock()

	data, err := os.ReadFile(contentFile)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"error": "Gagal membaca berkas konten"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func handleApiSaveContent(w http.ResponseWriter, r *http.Request) {
	contentLock.Lock()
	defer contentLock.Unlock()

	var payload map[string]any
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "JSON konten tidak valid"})
		return
	}

	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Gagal serialize konten"})
		return
	}

	if err := os.WriteFile(contentFile, data, 0644); err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Gagal menulis content.json"})
		return
	}

	sendJSON(w, http.StatusOK, map[string]any{"success": true})
}

// Media upload handler
func handleApiUpload(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(25 << 20)

	file, handler, err := r.FormFile("file")
	if err != nil {
		file, handler, err = r.FormFile("image")
	}
	if err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Berkas tidak ditemukan dalam formulir"})
		return
	}
	defer file.Close()

	cleanName := filepath.Base(handler.Filename)
	cleanName = strings.ReplaceAll(cleanName, " ", "-")
	
	ext := strings.ToLower(filepath.Ext(cleanName))
	allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".webp": true, ".svg": true, ".gif": true}
	if !allowed[ext] {
		sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Format berkas tidak diizinkan. Gunakan PNG, JPG, WebP, atau SVG"})
		return
	}

	if err := os.MkdirAll("assets", 0755); err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Gagal membuat folder assets"})
		return
	}

	targetPath := filepath.Join("assets", cleanName)
	dst, err := os.Create(targetPath)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Gagal menyimpan berkas di server"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Gagal menulis data berkas"})
		return
	}

	relPath := "assets/" + cleanName
	sendJSON(w, http.StatusOK, map[string]any{"success": true, "path": relPath})
}

type CredentialsChangeRequest struct {
	Username        string `json:"username"`
	Password        string `json:"password"`
	NewUsername     string `json:"new_username"`
	NewPassword     string `json:"new_password"`
	CurrentPassword string `json:"current_password"`
}

func handleApiGetCredentials(w http.ResponseWriter, r *http.Request) {
	configLock.RLock()
	defer configLock.RUnlock()

	user := activeConfig.AdminUser
	if user == "" {
		user = "admin"
	}
	sendJSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"username": user,
	})
}

func handleApiChangePassword(w http.ResponseWriter, r *http.Request) {
	var req CredentialsChangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Format permintaan tidak valid"})
		return
	}

	newUsername := strings.TrimSpace(req.Username)
	if newUsername == "" {
		newUsername = strings.TrimSpace(req.NewUsername)
	}

	newPassword := req.Password
	if newPassword == "" {
		newPassword = req.NewPassword
	}

	if newUsername == "" && newPassword == "" {
		sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Nama pengguna atau kata sandi baru harus diisi"})
		return
	}

	configLock.Lock()
	defer configLock.Unlock()

	// Jika ada current_password yang dikirim dan tidak cocok
	if req.CurrentPassword != "" && req.CurrentPassword != activeConfig.AdminPassword {
		sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Kata sandi saat ini salah"})
		return
	}

	if newPassword != "" {
		if len(newPassword) < 6 {
			sendJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Kata sandi baru minimal 6 karakter"})
			return
		}
		activeConfig.AdminPassword = newPassword
	}

	if newUsername != "" {
		activeConfig.AdminUser = newUsername
	}

	if err := saveConfigNoLock(); err != nil {
		sendJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": "Gagal menyimpan konfigurasi baru"})
		return
	}

	log.Printf("[AUTH] Kredensial admin diperbarui: username '%s'", activeConfig.AdminUser)
	sendJSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"message":  "Kredensial berhasil diperbarui",
		"username": activeConfig.AdminUser,
	})
}

func sendJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func hashSha256(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}
