#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <sstream>
#include <fstream>
#include <iomanip>
#include <algorithm>
#include <cmath>

// High-Performance Native Multi-Hop Crypto Transaction Graph Traversal Engine
// Developed for ChainForensix AI Hackathon Pipeline

struct Transaction {
    std::string tx_hash;
    std::string from_addr;
    std::string to_addr;
    double amount;
    std::string token;
    uint64_t timestamp;
    int block_number;
};

struct NodeMetrics {
    std::string address;
    int hop_distance;
    double total_received;
    double total_sent;
    int in_degree;
    int out_degree;
    bool is_seed;
    bool is_mixer_suspect;
    bool is_peeling_chain_node;
    bool is_terminal_sink;
    std::string sink_type; // "exchange", "mixer", "cold_wallet", "unknown"
};

struct EdgeMetrics {
    std::string from_addr;
    std::string to_addr;
    double amount;
    std::string token;
    std::string tx_hash;
    uint64_t timestamp;
    int hop_level;
    double flow_percentage;
};

class GraphTracer {
private:
    std::unordered_map<std::string, std::vector<Transaction>> adjacency_list;
    std::unordered_map<std::string, std::vector<Transaction>> reverse_adjacency;
    std::unordered_set<std::string> known_exchanges;
    std::unordered_set<std::string> known_mixers;

    std::string to_lower(const std::string& str) {
        std::string lower = str;
        std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
        return lower;
    }

public:
    GraphTracer() {
        // Pre-seed high-profile known mixer signatures and exchange hotspots
        known_mixers.insert(to_lower("0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b")); // Tornado Cash Router
        known_mixers.insert(to_lower("0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936")); // Tornado Cash 0.1 ETH
        known_mixers.insert(to_lower("0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF")); // Tornado Cash 1 ETH
        known_mixers.insert(to_lower("0xA160ba730345f3275467007266E351342770B258")); // Tornado Cash 10 ETH
        known_mixers.insert(to_lower("0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc")); // Tornado Cash 100 ETH
        known_mixers.insert(to_lower("0x000000000000000000000000000000000000dead")); // Burn address

        known_exchanges.insert(to_lower("0x28C6c06298d514Db089934071355E5743bf21d60")); // Binance Hot Wallet 14
        known_exchanges.insert(to_lower("0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549")); // Binance Hot Wallet 15
        known_exchanges.insert(to_lower("0xDFd5293D8e347dFe59E90eFd55b2956a1343ee33")); // Binance Hot Wallet 16
        known_exchanges.insert(to_lower("0x503828976D22510aad0201ac7EC88293211D23Da")); // Coinbase Hot Wallet
        known_exchanges.insert(to_lower("0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43")); // Coinbase 10
        known_exchanges.insert(to_lower("0x2FAF487A4414Fe30e230961aFeA6568b3c1D8dE7")); // Kraken Hot Wallet
        known_exchanges.insert(to_lower("0x0D0707963952f2fBA59dD06f2b425ace40b492Fe")); // Gate.io
        known_exchanges.insert(to_lower("0x70faa28a6b8d6829a4b1e649d26ec9a2a39ba413")); // OKX
    }

    void add_transaction(const Transaction& tx) {
        std::string from = to_lower(tx.from_addr);
        std::string to = to_lower(tx.to_addr);
        Transaction normalized = tx;
        normalized.from_addr = from;
        normalized.to_addr = to;
        adjacency_list[from].push_back(normalized);
        reverse_adjacency[to].push_back(normalized);
    }

    void load_json_or_csv(const std::string& filepath) {
        std::ifstream file(filepath);
        if (!file.is_open()) {
            std::cerr << "[-] Error opening input file: " << filepath << std::endl;
            return;
        }

        // Check if CSV format: tx_hash,from_addr,to_addr,amount,token,timestamp,block_number
        std::string line;
        bool is_header = true;
        while (std::getline(file, line)) {
            if (line.empty()) continue;
            if (is_header && (line.find("tx_hash") != std::string::npos || line.find("from") != std::string::npos)) {
                is_header = false;
                continue;
            }
            std::stringstream ss(line);
            std::string tx_hash, from, to, amount_str, token, ts_str, block_str;
            if (std::getline(ss, tx_hash, ',') &&
                std::getline(ss, from, ',') &&
                std::getline(ss, to, ',') &&
                std::getline(ss, amount_str, ',')) {
                
                std::getline(ss, token, ',');
                if (token.empty()) token = "ETH";
                std::getline(ss, ts_str, ',');
                std::getline(ss, block_str, ',');

                double amt = 0.0;
                try { amt = std::stod(amount_str); } catch (...) { amt = 0.0; }
                uint64_t ts = 0;
                try { ts = std::stoull(ts_str); } catch (...) { ts = 0; }
                int block = 0;
                try { block = std::stoi(block_str); } catch (...) { block = 0; }

                Transaction tx{tx_hash, from, to, amt, token, ts, block};
                add_transaction(tx);
            }
        }
    }

    std::string trace_multi_hop(const std::string& seed_address, int max_depth = 5, double min_amount = 0.001) {
        std::string seed = to_lower(seed_address);

        std::unordered_map<std::string, NodeMetrics> node_data;
        std::vector<EdgeMetrics> discovered_edges;
        std::unordered_set<std::string> visited_nodes;

        // BFS Queue: <address, current_hop, incoming_volume>
        std::queue<std::pair<std::string, int>> q;
        q.push({seed, 0});
        visited_nodes.insert(seed);

        node_data[seed] = {
            seed, 0, 0.0, 0.0, 0, 0, true, false, false, false, "seed"
        };

        while (!q.empty()) {
            std::pair<std::string, int> front = q.front();
            q.pop();

            std::string curr_addr = front.first;
            int curr_hop = front.second;

            if (curr_hop >= max_depth) continue;

            auto it = adjacency_list.find(curr_addr);
            if (it == adjacency_list.end()) continue;

            const std::vector<Transaction>& out_txs = it->second;
            double total_outflow = 0.0;
            for (const auto& tx : out_txs) {
                if (tx.amount >= min_amount) total_outflow += tx.amount;
            }

            // Peeling chain heuristic: 2 outputs where 1 is small (fee/peel) and 1 is large (reinvest/hop)
            bool is_peeling = false;
            if (out_txs.size() == 2) {
                double diff = std::abs(out_txs[0].amount - out_txs[1].amount);
                if (diff > 0.5 * std::max(out_txs[0].amount, out_txs[1].amount)) {
                    is_peeling = true;
                }
            }

            for (const auto& tx : out_txs) {
                if (tx.amount < min_amount) continue;

                std::string next_addr = tx.to_addr;
                double flow_pct = (total_outflow > 0.00001) ? (tx.amount / total_outflow * 100.0) : 100.0;

                EdgeMetrics edge{
                    curr_addr, next_addr, tx.amount, tx.token, tx.tx_hash, tx.timestamp, curr_hop + 1, flow_pct
                };
                discovered_edges.push_back(edge);

                // Update sender metrics
                node_data[curr_addr].total_sent += tx.amount;
                node_data[curr_addr].out_degree++;

                // Update or create receiver metrics
                if (node_data.find(next_addr) == node_data.end()) {
                    bool is_mixer = (known_mixers.find(next_addr) != known_mixers.end());
                    bool is_exchange = (known_exchanges.find(next_addr) != known_exchanges.end());
                    std::string sink_type = "unknown";
                    if (is_mixer) sink_type = "mixer";
                    else if (is_exchange) sink_type = "exchange";

                    node_data[next_addr] = {
                        next_addr,
                        curr_hop + 1,
                        tx.amount,
                        0.0,
                        1,
                        0,
                        false,
                        is_mixer,
                        is_peeling,
                        is_mixer || is_exchange,
                        sink_type
                    };
                } else {
                    node_data[next_addr].total_received += tx.amount;
                    node_data[next_addr].in_degree++;
                    if (is_peeling) node_data[next_addr].is_peeling_chain_node = true;
                }

                // If not an exchange or mixer terminal, continue BFS
                if (visited_nodes.find(next_addr) == visited_nodes.end()) {
                    visited_nodes.insert(next_addr);
                    if (!node_data[next_addr].is_terminal_sink) {
                        q.push({next_addr, curr_hop + 1});
                    }
                }
            }
        }

        // Serialize results into strict JSON for high-performance IPC with Python
        std::stringstream json;
        json << "{\n";
        json << "  \"engine\": \"C++ Multi-Hop Native Tracer v2.0\",\n";
        json << "  \"seed_address\": \"" << seed << "\",\n";
        json << "  \"max_depth\": " << max_depth << ",\n";
        json << "  \"discovered_nodes_count\": " << node_data.size() << ",\n";
        json << "  \"discovered_edges_count\": " << discovered_edges.size() << ",\n";

        // Nodes array
        json << "  \"nodes\": [\n";
        bool first_node = true;
        for (const auto& kv : node_data) {
            const auto& n = kv.second;
            if (!first_node) json << ",\n";
            first_node = false;
            json << "    {\n";
            json << "      \"address\": \"" << n.address << "\",\n";
            json << "      \"hop_distance\": " << n.hop_distance << ",\n";
            json << "      \"total_received\": " << std::fixed << std::setprecision(6) << n.total_received << ",\n";
            json << "      \"total_sent\": " << std::fixed << std::setprecision(6) << n.total_sent << ",\n";
            json << "      \"in_degree\": " << n.in_degree << ",\n";
            json << "      \"out_degree\": " << n.out_degree << ",\n";
            json << "      \"is_seed\": " << (n.is_seed ? "true" : "false") << ",\n";
            json << "      \"is_mixer\": " << (n.is_mixer_suspect ? "true" : "false") << ",\n";
            json << "      \"is_peeling\": " << (n.is_peeling_chain_node ? "true" : "false") << ",\n";
            json << "      \"is_terminal_sink\": " << (n.is_terminal_sink ? "true" : "false") << ",\n";
            json << "      \"sink_type\": \"" << n.sink_type << "\"\n";
            json << "    }";
        }
        json << "\n  ],\n";

        // Edges array
        json << "  \"edges\": [\n";
        bool first_edge = true;
        for (const auto& e : discovered_edges) {
            if (!first_edge) json << ",\n";
            first_edge = false;
            json << "    {\n";
            json << "      \"from\": \"" << e.from_addr << "\",\n";
            json << "      \"to\": \"" << e.to_addr << "\",\n";
            json << "      \"amount\": " << std::fixed << std::setprecision(6) << e.amount << ",\n";
            json << "      \"token\": \"" << e.token << "\",\n";
            json << "      \"tx_hash\": \"" << e.tx_hash << "\",\n";
            json << "      \"timestamp\": " << e.timestamp << ",\n";
            json << "      \"hop_level\": " << e.hop_level << ",\n";
            json << "      \"flow_percentage\": " << std::fixed << std::setprecision(2) << e.flow_percentage << "\n";
            json << "    }";
        }
        json << "\n  ]\n";
        json << "}\n";

        return json.str();
    }
};

int main(int argc, char* argv[]) {
    // Usage: graph_tracer <seed_address> [max_depth=5] [transactions_csv] [output_json]
    if (argc < 2) {
        std::cerr << "Usage: graph_tracer <seed_address> [max_depth] [transactions_csv] [output_json]" << std::endl;
        return 1;
    }

    std::string seed = argv[1];
    int max_depth = (argc >= 3) ? std::stoi(argv[2]) : 5;
    std::string csv_file = (argc >= 4) ? argv[3] : "";
    std::string out_file = (argc >= 5) ? argv[4] : "";

    GraphTracer tracer;

    if (!csv_file.empty()) {
        tracer.load_json_or_csv(csv_file);
    }

    std::string result_json = tracer.trace_multi_hop(seed, max_depth);

    if (!out_file.empty()) {
        std::ofstream out(out_file);
        if (out.is_open()) {
            out << result_json;
            out.close();
        } else {
            std::cout << result_json;
        }
    } else {
        std::cout << result_json;
    }

    return 0;
}
