#define _WIN32_WINNT 0x0A00
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <ctime>
#include <iomanip>
#include <algorithm>
#include <cstdlib>
#include <fstream> // Required for file I/O (Persistence)

// Dependencies:
#include "httplib.h"
#include "json.hpp"

using json = nlohmann::json;

// --- Data Structures (In-Memory Database Simulation) ---

struct Flashcard {
    std::string card_id;
    std::string front;
    std::string back;
    int streak = 0; // For spaced repetition simulation
};

struct FlashcardSet {
    std::string set_id;
    std::string user_id;
    std::string title;
    std::vector<Flashcard> cards;
};

struct User {
    std::string user_id;
    std::string username;
    std::string password_hash; 
};

// Global Persistence File Path
const std::string DATA_FILE = "data.json";

// Simple global in-memory "databases"
std::map<std::string, User> g_users;
std::map<std::string, FlashcardSet> g_sets;
std::map<std::string, std::string> g_sessions; // user_id -> token/session_id

// --- Persistence Helpers (to_json / from_json) ---
// These allow nlohmann/json to serialize/deserialize our custom structs.

// Flashcard Serialization
void to_json(json& j, const Flashcard& p) {
    j = json{{"card_id", p.card_id}, {"front", p.front}, {"back", p.back}, {"streak", p.streak}};
}

void from_json(const json& j, Flashcard& p) {
    p.card_id = j.at("card_id");
    p.front = j.at("front");
    p.back = j.at("back");
    p.streak = j.at("streak").get<int>();
}

// FlashcardSet Serialization
void to_json(json& j, const FlashcardSet& p) {
    j = json{{"set_id", p.set_id}, {"user_id", p.user_id}, {"title", p.title}, {"cards", p.cards}};
}

void from_json(const json& j, FlashcardSet& p) {
    p.set_id = j.at("set_id");
    p.user_id = j.at("user_id");
    p.title = j.at("title");
    // Handle the case where the JSON might be missing the cards field (though it shouldn't)
    if (j.contains("cards")) {
        p.cards = j.at("cards").get<std::vector<Flashcard>>();
    } else {
        p.cards = {};
    }
}

// User Serialization (NOTE: We include the password_hash here for persistence)
void to_json(json& j, const User& p) {
    j = json{{"user_id", p.user_id}, {"username", p.username}, {"password_hash", p.password_hash}};
}

void from_json(const json& j, User& p) {
    p.user_id = j.at("user_id");
    p.username = j.at("username");
    p.password_hash = j.at("password_hash");
}

// --- Persistence Functions ---

void saveData() {
    json j;
    // Store maps directly. The to_json/from_json helpers handle the struct conversion.
    j["users"] = g_users; 
    j["sets"] = g_sets;   
    
    std::ofstream o(DATA_FILE);
    if (o.is_open()) {
        o << std::setw(4) << j << std::endl; // Pretty print
        o.close();
        std::cout << "SUCCESS: Data saved to " << DATA_FILE << std::endl;
    } else {
        std::cerr << "ERROR: Could not open " << DATA_FILE << " for writing!" << std::endl;
    }
}

void loadData() {
    std::ifstream i(DATA_FILE);
    if (i.is_open()) {
        try {
            json j;
            i >> j; // Read the JSON from the file

            // Restore users and sets from JSON
            g_users = j.at("users").get<std::map<std::string, User>>();
            g_sets = j.at("sets").get<std::map<std::string, FlashcardSet>>();
            
            i.close();
            std::cout << "SUCCESS: Data loaded from " << DATA_FILE << ". " 
                      << g_users.size() << " users and " << g_sets.size() << " sets restored." << std::endl;
        } catch (const json::exception& e) {
            std::cerr << "ERROR: Failed to parse JSON data in " << DATA_FILE << ": " << e.what() << std::endl;
        }
    } else {
        std::cout << "INFO: No existing data file found (" << DATA_FILE << "). Starting fresh." << std::endl;
    }
}


// --- Utility Functions (UNCHANGED) ---
std::string generate_id() {
    // Generates a simple time-based ID.
    return std::to_string(std::time(nullptr)) + "-" + std::to_string(std::rand());
}

std::string hash_password(const std::string& password) {
    return "hashed_" + password;
}

// Simple Authentication Check (returns user_id if token is valid)
std::string authenticate_request(const httplib::Request& req) {
    auto it = req.headers.find("Authorization");
    if (it == req.headers.end()) {
        return "";
    }
    std::string auth_header = it->second;
    if (auth_header.length() > 7 && auth_header.substr(0, 7) == "Bearer ") {
        std::string token = auth_header.substr(7);
        if (g_users.count(token)) { 
            return token; 
        }
    }
    return "";
}

// Data Serialization Helpers (REPLACED by Persistence Helpers above)
// We keep card_to_json and set_to_json for route responses, but simplify them.

json card_to_json(const Flashcard& card) {
    // Uses the new to_json helper we defined above
    return card; 
}

json set_to_json(const FlashcardSet& set, bool include_cards = true) {
    json set_json = set; // Uses the new to_json helper
    set_json["card_count"] = set.cards.size();
    if (!include_cards) {
        set_json.erase("cards"); // Remove cards array if not needed for list view
    }
    return set_json;
}


// --- Main Server Setup (UPDATED to call saveData()) ---
void setup_routes(httplib::Server& svr) {
    // --- 1. Authentication Routes ---

    svr.Post("/api/register", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*"); 
        try {
            auto req_json = json::parse(req.body);
            std::string username = req_json.at("username");
            std::string password = req_json.at("password");

            for (const auto& pair : g_users) {
                if (pair.second.username == username) {
                    res.status = 409; 
                    res.set_content("{\"error\": \"Username already exists\"}", "application/json");
                    return;
                }
            }

            std::string new_user_id = generate_id();
            User new_user = {new_user_id, username, hash_password(password)};
            g_users[new_user_id] = new_user;
            
            // 🔥 PERSISTENCE: Save data after successful registration
            saveData(); 

            json response_json = {
                {"message", "Registration successful"},
                {"user_id", new_user_id}
            };
            res.status = 201; 
            res.set_content(response_json.dump(), "application/json");

        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\": \"Invalid JSON or missing username/password\"}", "application/json");
        }
    });

    svr.Post("/api/login", [](const httplib::Request& req, httplib::Response& res) {
        // ... (Login route remains unchanged as it doesn't modify data) ...
        res.set_header("Access-Control-Allow-Origin", "*"); 

        try {
            auto req_json = json::parse(req.body);
            std::string username = req_json.at("username");
            std::string password = req_json.at("password");

            User found_user;
            bool user_found = false;
            for (const auto& pair : g_users) {
                if (pair.second.username == username) {
                    found_user = pair.second;
                    user_found = true;
                    break;
                }
            }

            if (user_found && found_user.password_hash == hash_password(password)) {
                json response_json = {
                    {"message", "Login successful"},
                    {"user_id", found_user.user_id} 
                };
                res.status = 200;
                res.set_content(response_json.dump(), "application/json");
            } else {
                res.status = 401; 
                res.set_content("{\"error\": \"Invalid username or password\"}", "application/json");
            }
        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\": \"Invalid JSON or missing username/password\"}", "application/json");
        }
    });

    // --- 2. Flashcard Set CRUD Routes ---

    // GET /api/sets - Read All (Unchanged)
    svr.Get("/api/sets", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        if (user_id.empty()) { res.status = 403; res.set_content("{\"error\": \"Authentication required\"}", "application/json"); return; }
        json sets_list = json::array();
        for (const auto& pair : g_sets) {
            if (pair.second.user_id == user_id) {
                sets_list.push_back(set_to_json(pair.second, false)); 
            }
        }
        res.set_content(sets_list.dump(), "application/json");
    });

    // GET /api/sets/:set_id - Read One (Unchanged)
    svr.Get(R"(/api/sets/(\w+-\w+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        std::string set_id = req.matches[1];
        if (user_id.empty() || !g_sets.count(set_id) || g_sets.at(set_id).user_id != user_id) {
            res.status = 404; res.set_content("{\"error\": \"Set not found or unauthorized\"}", "application/json"); return;
        }
        res.set_content(set_to_json(g_sets.at(set_id)).dump(), "application/json");
    });

    // POST /api/sets - Create
    svr.Post("/api/sets", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        if (user_id.empty()) { res.status = 403; res.set_content("{\"error\": \"Authentication required\"}", "application/json"); return; }
        try {
            auto req_json = json::parse(req.body);
            std::string title = req_json.at("title");
            FlashcardSet new_set = {generate_id(), user_id, title, {}};
            g_sets[new_set.set_id] = new_set;
            
            // 🔥 PERSISTENCE: Save data after successful set creation
            saveData(); 

            res.status = 201; res.set_content(set_to_json(new_set).dump(), "application/json");
        } catch (...) { res.status = 400; res.set_content("{\"error\": \"Invalid JSON or missing title\"}", "application/json"); }
    });

    // PUT /api/sets/:set_id - Update Set Title
    svr.Put(R"(/api/sets/(\w+-\w+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        std::string set_id = req.matches[1];
        if (user_id.empty() || !g_sets.count(set_id) || g_sets.at(set_id).user_id != user_id) {
            res.status = 404; res.set_content("{\"error\": \"Set not found or unauthorized\"}", "application/json"); return;
        }
        try {
            auto req_json = json::parse(req.body);
            std::string new_title = req_json.at("title");
            g_sets.at(set_id).title = new_title;
            
            // 🔥 PERSISTENCE: Save data after successful set update
            saveData(); 

            res.set_content(set_to_json(g_sets.at(set_id)).dump(), "application/json");
        } catch (...) { res.status = 400; res.set_content("{\"error\": \"Invalid JSON or missing title\"}", "application/json"); }
    });

    // DELETE /api/sets/:set_id - Delete
    svr.Delete(R"(/api/sets/(\w+-\w+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        std::string set_id = req.matches[1];
        if (user_id.empty() || !g_sets.count(set_id) || g_sets.at(set_id).user_id != user_id) {
            res.status = 404; res.set_content("{\"error\": \"Set not found or unauthorized\"}", "application/json"); return;
        }
        g_sets.erase(set_id);
        
        // 🔥 PERSISTENCE: Save data after successful set deletion
        saveData(); 

        res.set_content("{\"message\": \"Set deleted\"}", "application/json");
    });

    // --- 3. Card CRUD Routes ---

    // POST /api/sets/:set_id/cards - Create Card
    svr.Post(R"(/api/sets/(\w+-\w+)/cards)", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        std::string set_id = req.matches[1];
        if (user_id.empty() || !g_sets.count(set_id) || g_sets.at(set_id).user_id != user_id) {
            res.status = 403; res.set_content("{\"error\": \"Unauthorized or Set not found\"}", "application/json"); return;
        }
        try {
            auto req_json = json::parse(req.body);
            Flashcard new_card = {generate_id(), req_json.at("front"), req_json.at("back")};
            g_sets[set_id].cards.push_back(new_card);
            
            // 🔥 PERSISTENCE: Save data after successful card creation
            saveData(); 

            res.status = 201; res.set_content(card_to_json(new_card).dump(), "application/json");
        } catch (...) { res.status = 400; res.set_content("{\"error\": \"Invalid JSON or missing fields for card\"}", "application/json"); }
    });

    // PUT /api/sets/:set_id/cards/:card_id - Update Card
    svr.Put(R"(/api/sets/(\w+-\w+)/cards/(\w+-\w+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        std::string set_id = req.matches[1];
        std::string card_id = req.matches[2];

        if (user_id.empty() || !g_sets.count(set_id) || g_sets.at(set_id).user_id != user_id) {
            res.status = 403; res.set_content("{\"error\": \"Unauthorized or Set not found\"}", "application/json"); return;
        }

        try {
            auto req_json = json::parse(req.body);
            std::string new_front = req_json.at("front");
            std::string new_back = req_json.at("back");

            auto& cards = g_sets.at(set_id).cards;
            auto it = std::find_if(cards.begin(), cards.end(), 
                                   [&card_id](const Flashcard& c){ return c.card_id == card_id; });

            if (it != cards.end()) {
                it->front = new_front;
                it->back = new_back;
                
                // 🔥 PERSISTENCE: Save data after successful card update
                saveData(); 

                res.set_content(card_to_json(*it).dump(), "application/json");
            } else {
                res.status = 404; res.set_content("{\"error\": \"Card not found\"}", "application/json");
            }
        } catch (...) { res.status = 400; res.set_content("{\"error\": \"Invalid JSON or missing fields\"}", "application/json"); }
    });

    // DELETE /api/sets/:set_id/cards/:card_id - Delete Card
    svr.Delete(R"(/api/sets/(\w+-\w+)/cards/(\w+-\w+))", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        std::string set_id = req.matches[1];
        std::string card_id = req.matches[2];

        if (user_id.empty() || !g_sets.count(set_id) || g_sets.at(set_id).user_id != user_id) {
            res.status = 403; res.set_content("{\"error\": \"Unauthorized or Set not found\"}", "application/json"); return;
        }

        auto& cards = g_sets.at(set_id).cards;
        size_t old_size = cards.size();

        cards.erase(std::remove_if(cards.begin(), cards.end(),
                                   [&card_id](const Flashcard& c){ return c.card_id == card_id; }),
                            cards.end());

        if (cards.size() < old_size) {
            // 🔥 PERSISTENCE: Save data after successful card deletion
            saveData(); 

            res.set_content("{\"message\": \"Card deleted\"}", "application/json");
        } else {
            res.status = 404; res.set_content("{\"error\": \"Card not found\"}", "application/json");
        }
    });

    // --- 4. Statistics Route (Placeholder - UNCHANGED) ---
    svr.Post("/api/stats", [](const httplib::Request& req, httplib::Response& res) { 
        res.status = 501; // Not Implemented
        res.set_content("{\"error\": \"Stats route is not yet implemented\"}", "application/json");
    });


    // --- 5. Preflight CORS handling (UNCHANGED) ---
    svr.Options(R"(/.*)", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set_content("", "text/plain");
    });
}

// --- Main function (UPDATED to call loadData and remove mock data) ---
int main() {
    // Seed random number generator for generate_id
    std::srand(static_cast<unsigned int>(std::time(nullptr)));

    // 🔥 PERSISTENCE: Load data at startup
    loadData(); 

    httplib::Server svr;
    
    // --- Mock Data Setup (REMOVED) ---
    // The data is now persisted in data.json
    // --- End Mock Data Setup ---

    setup_routes(svr);

    svr.set_post_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        if (res.get_header_value("Access-Control-Allow-Origin").empty()) {
            res.set_header("Access-Control-Allow-Origin", "*");
        }
    });

    std::cout << "Starting FLIPIT! C++ Backend on http://localhost:8080..." << std::endl;
    if (!svr.listen("0.0.0.0", 8080)) {
        std::cerr << "Failed to start server." << std::endl;
    }

    // You should ideally implement a signal handler (e.g., for SIGINT/Ctrl+C) 
    // to call saveData() on graceful shutdown. For now, it saves on every change.

    return 0;
}