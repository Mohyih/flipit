// backend/src/server.cpp 

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <ctime>
#include <iomanip>

// Include paths relative to the project root as specified in CMakeLists.txt
#include "httplib.h"
#include "json.hpp" 

// ... (Rest of the C++ code from the previous response) ...
// The full implementation of setup_routes, main, and data structures goes here.

// Placeholder to keep the response concise, the full content is the server.cpp file previously provided.
int main() {
    httplib::Server svr;
    
    // ... Initialize mock data and setup_routes ...

    std::cout << "Starting FLIPIT! C++ Backend on http://localhost:8080..." << std::endl;
    if (!svr.listen("0.0.0.0", 8080)) {
        std::cerr << "Failed to start server." << std::endl;
    }
    return 0;
}