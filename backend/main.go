
package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

var (
	userCollection    *mongo.Collection
	chatCollection    *mongo.Collection
	configCollection  *mongo.Collection
	jwtSecret         = []byte("your-secret-key-change-in-production-please-12345678901234567890")
	apiKey            string
)

type User struct {
	ID       primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Username string             `json:"username" bson:"username"`
	Email    string             `json:"email,omitempty" bson:"email,omitempty"`
	Password string             `json:"password,omitempty" bson:"password,omitempty"`
	IsGuest  bool               `json:"isGuest" bson:"isGuest"`
	IsAdmin  bool               `json:"isAdmin" bson:"isAdmin"`
}

type Message struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"userId,omitempty" bson:"userId,omitempty"`
	Sender    string             `json:"sender" bson:"sender"` // "user" or "bot"
	Text      string             `json:"text" bson:"text"`
	Timestamp time.Time          `json:"timestamp" bson:"timestamp"`
}

type Claims struct {
	UserID  string `json:"userId"`
	IsGuest bool   `json:"isGuest"`
	IsAdmin bool   `json:"isAdmin"`
	jwt.RegisteredClaims
}

type BotConfig struct {
	ID      string `json:"id" bson:"_id"`
	BotName string `json:"botName" bson:"botName"`
}

type StreamRequest struct {
	Message string `json:"message"`
}

type Analytics struct {
	TotalUsers     int `json:"totalUsers"`
	ActiveUsers    int `json:"activeUsers"`
	TotalMessages  int `json:"totalMessages"`
	MessagesToday  int `json:"messagesToday"`
	TotalConversations int `json:"totalConversations"`
}

func initDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		fmt.Println("⚠️ MongoDB offline. Fallback mode active.")
		return
	}
	if err := client.Ping(ctx, nil); err != nil {
		fmt.Println("⚠️ MongoDB ping failed. Fallback mode active.")
		return
	}
	db := client.Database("omnichat")
	userCollection = db.Collection("users")
	chatCollection = db.Collection("chats")
	configCollection = db.Collection("settings")

	// Create default admin user if not exists
	var adminUser User
	err = userCollection.FindOne(ctx, bson.M{"username": "admin"}).Decode(&adminUser)
	if err != nil {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		adminUser = User{
			ID:       primitive.NewObjectID(),
			Username: "admin",
			Password: string(hashedPassword),
			IsAdmin:  true,
			IsGuest:  false,
		}
		userCollection.InsertOne(ctx, adminUser)
		fmt.Println("✅ Default admin created: admin / admin123")
	}

	fmt.Println("✅ Successfully synchronized with MongoDB Container.")
}

func generateToken(userID primitive.ObjectID, isGuest, isAdmin bool) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:  userID.Hex(),
		IsGuest: isGuest,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingUser User
	err := userCollection.FindOne(ctx, bson.M{"username": user.Username}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error processing password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)
	user.IsGuest = false
	user.IsAdmin = false
	user.ID = primitive.NewObjectID()

	_, err = userCollection.InsertOne(ctx, user)
	if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	token, err := generateToken(user.ID, false, false)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":    token,
		"username": user.Username,
		"userId":   user.ID.Hex(),
		"isAdmin":  user.IsAdmin,
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var credentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err := userCollection.FindOne(ctx, bson.M{"username": credentials.Username}).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := generateToken(user.ID, user.IsGuest, user.IsAdmin)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":    token,
		"username": user.Username,
		"userId":   user.ID.Hex(),
		"isAdmin":  user.IsAdmin,
	})
}

func guestLoginHandler(w http.ResponseWriter, r *http.Request) {
	user := User{
		ID:       primitive.NewObjectID(),
		Username: fmt.Sprintf("Guest%d", time.Now().Unix()),
		IsGuest:  true,
		IsAdmin:  false,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = userCollection.InsertOne(ctx, user)

	token, err := generateToken(user.ID, true, false)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token":    token,
		"username": user.Username,
		"userId":   user.ID.Hex(),
		"isAdmin":  false,
	})
}

func getChatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	userID, _, _, err := getUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	filter := bson.M{"userId": objID}
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}})
	cursor, err := chatCollection.Find(ctx, filter, opts)
	if err != nil {
		http.Error(w, "Error fetching history", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var messages []Message
	if err = cursor.All(ctx, &messages); err != nil {
		http.Error(w, "Error parsing history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func getUserFromToken(r *http.Request) (string, bool, bool, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", false, false, fmt.Errorf("no token")
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", false, false, err
	}
	return claims.UserID, claims.IsGuest, claims.IsAdmin, nil
}

func requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _, isAdmin, err := getUserFromToken(r)
		if err != nil || !isAdmin {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func saveMessageToDB(userID string, msg Message) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("⚠️ Invalid user ID: %v", err)
		return
	}
	msg.UserID = objID
	msg.ID = primitive.NewObjectID()
	msg.Timestamp = time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = chatCollection.InsertOne(ctx, msg)
	if err != nil {
		log.Printf("⚠️ Error saving message: %v", err)
	}
}

// Admin Endpoints
func getAdminAnalytics(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	totalUsers, _ := userCollection.CountDocuments(ctx, bson.M{})
	totalMessages, _ := chatCollection.CountDocuments(ctx, bson.M{})
	today := time.Now().Truncate(24 * time.Hour)
	messagesToday, _ := chatCollection.CountDocuments(ctx, bson.M{"timestamp": bson.M{"$gte": today}})
	activeUsers, _ := chatCollection.Distinct(ctx, "userId", bson.M{"timestamp": bson.M{"$gte": today}})
	totalConversations, _ := chatCollection.Distinct(ctx, "userId", bson.M{})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Analytics{
		TotalUsers:    int(totalUsers),
		ActiveUsers:   len(activeUsers),
		TotalMessages: int(totalMessages),
		MessagesToday: int(messagesToday),
		TotalConversations: len(totalConversations),
	})
}

func deleteAdminUser(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	userIDParam := chi.URLParam(r, "userId")
	objID, err := primitive.ObjectIDFromHex(userIDParam)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// First delete user's chat history
	_, err = chatCollection.DeleteMany(ctx, bson.M{"userId": objID})
	if err != nil {
		log.Printf("⚠️ Error deleting chat history: %v", err)
	}

	// Then delete user
	_, err = userCollection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		http.Error(w, "Error deleting user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "User deleted successfully"})
}

func deleteAdminChatHistory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	userIDParam := chi.URLParam(r, "userId")
	objID, err := primitive.ObjectIDFromHex(userIDParam)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	_, err = chatCollection.DeleteMany(ctx, bson.M{"userId": objID})
	if err != nil {
		http.Error(w, "Error deleting chat history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Chat history deleted successfully"})
}

func getAdminUsers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	opts := options.Find().SetProjection(bson.M{"password": 0})
	cursor, err := userCollection.Find(ctx, bson.M{}, opts)
	if err != nil {
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var users []User
	if err = cursor.All(ctx, &users); err != nil {
		http.Error(w, "Error parsing users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func getAdminUserChat(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	userIDParam := chi.URLParam(r, "userId")
	objID, err := primitive.ObjectIDFromHex(userIDParam)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	filter := bson.M{"userId": objID}
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}})
	cursor, err := chatCollection.Find(ctx, filter, opts)
	if err != nil {
		http.Error(w, "Error fetching chat history", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var messages []Message
	if err = cursor.All(ctx, &messages); err != nil {
		http.Error(w, "Error parsing chat history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func handleSaveConfig(w http.ResponseWriter, r *http.Request) {
	var config BotConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		log.Printf("⚠️ Config decode error: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	config.ID = "default"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Update().SetUpsert(true)
	filter := bson.M{"_id": "default"}
	update := bson.M{"$set": bson.M{"botName": config.BotName}}

	if configCollection != nil {
		_, err := configCollection.UpdateOne(ctx, filter, update, opts)
		if err != nil {
			log.Printf("⚠️ Database error: %v", err)
			http.Error(w, "Database persistence failure", http.StatusInternalServerError)
			return
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Configuration saved cleanly."})
}

func handleChatStream(w http.ResponseWriter, r *http.Request) {
	userID, _, _, err := getUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported by runtime infrastructure", http.StatusInternalServerError)
		return
	}

	var req StreamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("⚠️ Stream request decode error: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Save user message to DB
	userMsg := Message{
		Sender: "user",
		Text:   req.Message,
	}
	go saveMessageToDB(userID, userMsg)

	// Lock in standard streaming headers
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	tokenChan := make(chan string)
	var botResponseText string

	go func(userPrompt string) {
		defer close(tokenChan)

		payload := map[string]interface{}{
			"model": "llama-3.3-70b-versatile",
			"messages": []map[string]string{
				{"role": "user", "content": userPrompt},
			},
			"stream": true,
		}
		jsonData, err := json.Marshal(payload)
		if err != nil {
			log.Printf("⚠️ JSON marshal error: %v", err)
			sendFallbackResponse(tokenChan, userPrompt, &botResponseText)
			return
		}

		aiReq, err := http.NewRequestWithContext(r.Context(), "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("⚠️ Request create error: %v", err)
			sendFallbackResponse(tokenChan, userPrompt, &botResponseText)
			return
		}

		aiReq.Header.Set("Authorization", "Bearer "+apiKey)
		aiReq.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 60 * time.Second}
		aiResp, err := client.Do(aiReq)
		if err != nil {
			log.Printf("⚠️ AI API request error: %v", err)
			sendFallbackResponse(tokenChan, userPrompt, &botResponseText)
			return
		}
		defer aiResp.Body.Close()

		if aiResp.StatusCode != http.StatusOK {
			errBody, _ := io.ReadAll(aiResp.Body)
			log.Printf("⚠️ AI API returned status: %d, body: %s", aiResp.StatusCode, string(errBody))
			sendFallbackResponse(tokenChan, userPrompt, &botResponseText)
			return
		}

		scanner := bufio.NewScanner(aiResp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if line == "" || !strings.HasPrefix(line, "data: ") {
				continue
			}

			dataStr := strings.TrimPrefix(line, "data: ")
			if dataStr == "[DONE]" {
				break
			}

			var streamObj struct {
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
				} `json:"choices"`
			}

			if err := json.Unmarshal([]byte(dataStr), &streamObj); err == nil {
				if len(streamObj.Choices) > 0 {
					contentChunk := streamObj.Choices[0].Delta.Content
					if contentChunk != "" {
						tokenChan <- contentChunk
						botResponseText += contentChunk
					}
				}
			}
		}

		if err := scanner.Err(); err != nil {
			log.Printf("⚠️ Scanner error: %v", err)
		}
	}(req.Message)

	for {
		select {
		case token, open := <-tokenChan:
			if !open {
				if botResponseText != "" {
					botMsg := Message{
						Sender: "bot",
						Text:   botResponseText,
					}
					go saveMessageToDB(userID, botMsg)
				}
				return
			}
			_, err := fmt.Fprintf(w, "%s", token)
			if err != nil {
				log.Printf("⚠️ Write error: %v", err)
				return
			}
			flusher.Flush()
		case <-r.Context().Done():
			log.Println("Context closed by client.")
			if botResponseText != "" {
				botMsg := Message{
					Sender: "bot",
					Text:   botResponseText,
				}
				go saveMessageToDB(userID, botMsg)
			}
			return
		}
	}
}

func sendFallbackResponse(tokenChan chan string, userPrompt string, botResponseText *string) {
	fallbackResponses := map[string]string{
		"default": "Hi there! Thanks for your message! Right now our external AI service is temporarily unavailable, but I'm here to help in any way I can! Try asking simple questions, or feel free to come back later when the service is restored!",
		"joke":    "Why did the AI go to therapy? It had too many deep learning issues! 😄",
		"weather": "I wish I could check the weather for you right now! Our external weather service is unavailable, but you can check your local weather app for the latest info!",
	}

	var response string
	promptLower := strings.ToLower(userPrompt)
	if strings.Contains(promptLower, "joke") {
		response = fallbackResponses["joke"]
	} else if strings.Contains(promptLower, "weather") {
		response = fallbackResponses["weather"]
	} else {
		response = fallbackResponses["default"]
	}

	for _, char := range response {
		tokenChan <- string(char)
		*botResponseText += string(char)
		time.Sleep(30 * time.Millisecond)
	}
}

func main() {
	// Load environment variables from .env
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ Warning: Could not load .env file")
	}
	
	// Get GROQ API key from environment variable
	apiKey = os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		log.Println("⚠️ Warning: GROQ_API_KEY not set in environment")
	}

	initDB()
	r := chi.NewRouter()

	// CORS setup - allow any origin for now (MUST COME FIRST!)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Root route for health check
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "OmniChat Ecosystem API is running!",
			"status":  "ok",
		})
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", registerHandler)
		r.Post("/auth/login", loginHandler)
		r.Post("/auth/guest", guestLoginHandler)
		r.Get("/chat/history", getChatHistoryHandler)
		r.Post("/chatbot/config", handleSaveConfig)
		r.Post("/chatbot/stream", handleChatStream)

		// Admin routes
		r.Route("/admin", func(r chi.Router) {
			r.Use(requireAdmin)
			r.Get("/analytics", getAdminAnalytics)
			r.Get("/users", getAdminUsers)
			r.Get("/chat/{userId}", getAdminUserChat)
			r.Delete("/users/{userId}", deleteAdminUser)
			r.Delete("/chat/{userId}", deleteAdminChatHistory)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	fmt.Printf("🚀 Gateway listening on port :%s...\n", port)
	fmt.Println("🔑 Admin credentials: admin / admin123")
	log.Fatal(http.ListenAndServe(":"+port, r))
}

