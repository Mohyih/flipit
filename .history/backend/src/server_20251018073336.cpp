#define _WIN32_WINNT 0x0A00
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <ctime>
#include <iomanip>
#include <algorithm> // Required for std::remove_if
#include <cstdlib>   // Required for std::srand, std::rand

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

// Simple global in-memory "databases"
std::map<std::string, User> g_users;
std::map<std::string, FlashcardSet> g_sets;
std::map<std::string, std::string> g_sessions; // user_id -> token/session_id

// Utility Functions
std::string generate_id() {
    // Generates a simple time-based ID.
    return std::to_string(std::time(nullptr)) + "-" + std::to_string(std::rand());
}

std::string hash_password(const std::string& password) {
    // Simple mock hashing for demonstration.
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
        // Token is the User ID in this setup
        if (g_users.count(token)) { 
            return token; 
        }
    }
    return "";
}

// Data Serialization Helpers
json card_to_json(const Flashcard& card) {
    return json{
        {"card_id", card.card_id},
        {"front", card.front},
        {"back", card.back},
        {"streak", card.streak}
    };
}

json set_to_json(const FlashcardSet& set, bool include_cards = true) {
    json set_json = {
        {"set_id", set.set_id},
        {"user_id", set.user_id},
        {"title", set.title},
        {"card_count", set.cards.size()}
    };
    if (include_cards) {
        set_json["cards"] = json::array();
        for (const auto& card : set.cards) {
            set_json["cards"].push_back(card_to_json(card));
        }
    }
    return set_json;
}


// --- Main Server Setup ---
void setup_routes(httplib::Server& svr) {
    // --- 1. Authentication Routes (With CORS Fixes) ---

    svr.Post("/api/register", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*"); // CORS Fix

        try {
            auto req_json = json::parse(req.body);
            std::string username = req_json.at("username");
            std::string password = req_json.at("password");

            // Check if username already exists
            for (const auto& pair : g_users) {
                if (pair.second.username == username) {
                    res.status = 409; // Conflict
                    res.set_content("{\"error\": \"Username already exists\"}", "application/json");
                    return;
                }
            }

            // Create new user
            std::string new_user_id = generate_id();
            User new_user = {new_user_id, username, hash_password(password)};
            g_users[new_user_id] = new_user;

            json response_json = {
                {"message", "Registration successful"},
                {"user_id", new_user_id}
            };
            res.status = 201; // Created
            res.set_content(response_json.dump(), "application/json");

        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\": \"Invalid JSON or missing username/password\"}", "application/json");
        }
    });

    svr.Post("/api/login", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*"); // CORS Fix

        try {
            auto req_json = json::parse(req.body);
            std::string username = req_json.at("username");
            std::string password = req_json.at("password");

            // Find user by username and check password
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
                // Successful login! Return the user_id as the token.
                json response_json = {
                    {"message", "Login successful"},
                    {"user_id", found_user.user_id} // CRITICAL for frontend
                };
                res.status = 200;
                res.set_content(response_json.dump(), "application/json");
            } else {
                // Failed login
                res.status = 401; // Unauthorized
                res.set_content("{\"error\": \"Invalid username or password\"}", "application/json");
            }

        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\": \"Invalid JSON or missing username/password\"}", "application/json");
        }
    });

    // --- 2. Flashcard Set CRUD Routes (Requires Auth) ---

    // GET /api/sets - Read All
    svr.Get("/api/sets", [](const httplib::Request& req, httplib::Response& res) {
        std::string user_id = authenticate_request(req);
        if (user_id.empty()) { res.status = 403; res.set_content("{\"error\": \"Authentication required\"}", "application/json"); return; }
        json sets_list = json::array();
        for (const auto& pair : g_sets) {
            if (pair.second.user_id == user_id) {
                sets_list.push_back(set_to_json(pair.second, false)); // Don't include all cards in the list view
            }
        }
        res.set_content(sets_list.dump(), "application/json");
    });

    // GET /api/sets/:set_id - Read One
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
        res.set_content("{\"message\": \"Set deleted\"}", "application/json");
    });

    // --- 3. Card CRUD Routes (Nested within a Set) ---

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

        // Use erase-remove idiom to safely remove element from vector
        cards.erase(std::remove_if(cards.begin(), cards.end(),
                                   [&card_id](const Flashcard& c){ return c.card_id == card_id; }),
                    cards.end());

        if (cards.size() < old_size) {
            res.set_content("{\"message\": \"Card deleted\"}", "application/json");
        } else {
            res.status = 404; res.set_content("{\"error\": \"Card not found\"}", "application/json");
        }
    });

    // --- 4. Statistics Route (Placeholder) ---
    svr.Post("/api/stats", [](const httplib::Request& req, httplib::Response& res) { 
        res.status = 501; // Not Implemented
        res.set_content("{\"error\": \"Stats route is not yet implemented\"}", "application/json");
    });


    // --- 5. Preflight CORS handling (Critical for React frontend) ---
    svr.Options(R"(/.*)", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set_content("", "text/plain");
    });
}

// --- Main function ---
int main() {
    // Seed random number generator for generate_id
    std::srand(static_cast<unsigned int>(std::time(nullptr)));

    httplib::Server svr;

    // --- Mock Data Setup ---
    g_users["123-user"] = {"123-user", "testuser", hash_password("password")};
    FlashcardSet mock_set;
    mock_set.set_id = "456-set";
    mock_set.user_id = "123-user";
    mock_set.title = "Math Fundamentals";
    mock_set.cards = {
        {"c1", "What is 2 + 2?", "4"},
        {"c2", "Square root of 9?", "3"},
        {"c3", "First 3.14 digits of Pi?", "3.14"}
    };
    g_sets[mock_set.set_id] = mock_set;
    std::cout << "Mock user 'testuser' (password: password) and set 'Math Fundamentals' created." << std::endl;
    // --- End Mock Data Setup ---

    setup_routes(svr);

    // Set CORS headers for all responses
    // This is a final safety net, but adding headers directly to auth routes is the most reliable fix.
    svr.set_post_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        if (res.get_header_value("Access-Control-Allow-Origin").empty()) {
            res.set_header("Access-Control-Allow-Origin", "*");
        }
    });

    std::cout << "Starting FLIPIT! C++ Backend on http://localhost:8080..." << std::endl;
    if (!svr.listen("0.0.0.0", 8080)) {
        std::cerr << "Failed to start server." << std::endl;
    }

    return 0;
}