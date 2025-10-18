#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <ctime>
#include <iomanip>
#include <algorithm> // Required for std::remove_if

// Dependencies:
// 1. httplib: https://github.com/yhirose/cpp-httplib 
// 2. nlohmann/json: https://github.com/nlohmann/json 
// NOTE: Ensure these are in the 'include/' folder for CMake to find them.

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

// Utility Functions (generate_id, hash_password, etc. - full implementation not shown for brevity, but assumed)
std::string generate_id() {
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
            return token; // Token is simulated as User ID
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
    // --- 1. Authentication Routes ---
    svr.Post("/api/register", [](const httplib::Request& req, httplib::Response& res) { /* ... implementation ... */ });
    svr.Post("/api/login", [](const httplib::Request& req, httplib::Response& res) { /* ... implementation ... */ });

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

    // *** NEW ENDPOINT ***
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

    // *** NEW ENDPOINT ***
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
                // Note: In a real app, you might also update the 'streak' if provided.
                res.set_content(card_to_json(*it).dump(), "application/json");
            } else {
                res.status = 404; res.set_content("{\"error\": \"Card not found\"}", "application/json");
            }
        } catch (...) { res.status = 400; res.set_content("{\"error\": \"Invalid JSON or missing fields\"}", "application/json"); }
    });

    // *** NEW ENDPOINT ***
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

    // --- 4. Statistics Route ---
    svr.Post("/api/stats", [](const httplib::Request& req, httplib::Response& res) { /* ... implementation ... */ });


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
    svr.set_post_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    std::cout << "Starting FLIPIT! C++ Backend on http://localhost:8080..." << std::endl;
    if (!svr.listen("0.0.0.0", 8080)) {
        std::cerr << "Failed to start server." << std::endl;
    }

    return 0;
}
