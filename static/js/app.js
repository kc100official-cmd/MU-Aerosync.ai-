// ChainForensix AI - Frontend Controller & Forensic Graph Renderer

let currentDossier = null;
let currentSampleTxs = null;

// Graph Visualization State
let graphNodes = [];
let graphEdges = [];
let canvas = null;
let ctx = null;
let animationId = null;
let hoveredNode = null;

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("forensicCanvas");
    if (canvas) {
        ctx = canvas.getContext("2d");
        setupCanvasResolution();
        window.addEventListener("resize", setupCanvasResolution);
        setupCanvasInteraction();
    }

    checkSystemHealth();
    loadSample('drainer');
});

function setupCanvasResolution() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    if (graphNodes.length > 0) {
        layoutGraph();
    }
}

async function checkSystemHealth() {
    try {
        const res = await fetch("/api/health");
        const data = await res.json();
        
        const cppPill = document.getElementById("cppStatusPill");
        const bchainPill = document.getElementById("bchainStatusPill");

        if (cppPill) {
            cppPill.innerHTML = `<span class="status-dot ${data.cpp_engine_ready ? 'active' : ''}"></span> C++ Engine: ${data.cpp_engine_ready ? 'Active (x64)' : 'Fallback'}`;
        }
        if (bchainPill) {
            bchainPill.innerHTML = `<span class="status-dot active"></span> Blockchain: ${data.blockchain_mode}`;
        }
    } catch (e) {
        console.error("Health check error:", e);
    }
}

async function loadSample(sampleType) {
    try {
        const res = await fetch(`/api/sample/${sampleType}`);
        const data = await res.json();

        document.getElementById("victimAddress").value = data.victim_address;
        document.getElementById("suspectAddress").value = data.suspect_address;
        document.getElementById("lossAmount").value = data.loss_amount;
        document.getElementById("tokenSelect").value = data.token || "ETH";
        document.getElementById("categorySelect").value = data.category || "PHISHING_DRAINER";
        document.getElementById("txHash").value = data.tx_hash || "";
        document.getElementById("incidentNotes").value = data.description || "";

        currentSampleTxs = data.transactions || [];

        // Auto-run trace for smooth first impression
        executeTrace();
    } catch (e) {
        console.error("Error loading sample:", e);
    }
}

async function executeTrace() {
    const victimAddr = document.getElementById("victimAddress").value.trim();
    const suspectAddr = document.getElementById("suspectAddress").value.trim();
    const lossAmt = parseFloat(document.getElementById("lossAmount").value) || 0;
    const token = document.getElementById("tokenSelect").value;
    const category = document.getElementById("categorySelect").value;
    const txHash = document.getElementById("txHash").value.trim();
    const description = document.getElementById("incidentNotes").value.trim();
    const autoAnchor = document.getElementById("autoAnchorCheckbox").checked;

    const btn = document.getElementById("btnTrace");
    btn.innerHTML = `<span class="spinner"></span> ANALYZING MULTI-HOP GRAPH...`;
    btn.disabled = true;

    try {
        const payload = {
            victim_address: victimAddr,
            suspect_address: suspectAddr,
            loss_amount: lossAmt,
            token: token,
            category: category,
            tx_hash: txHash,
            description: description,
            transactions: currentSampleTxs,
            auto_anchor: autoAnchor
        };

        const response = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            alert(`Error: ${err.detail || "Ingestion failed"}`);
            return;
        }

        currentDossier = await response.json();
        renderInvestigationResults(currentDossier);
        renderRecentCases();
    } catch (err) {
        console.error(err);
        alert("Execution failed: " + err.message);
    } finally {
        btn.innerHTML = `⚡ INGEST & EXECUTE NATIVE C++ FORENSIC TRACE`;
        btn.disabled = false;
    }
}

function renderInvestigationResults(dossier) {
    const ai = dossier.ai_evaluation;
    const graph = dossier.full_graph;
    const anchor = dossier.immutable_anchor_status;

    // 1. Attribution & Severity
    document.getElementById("threatActorName").innerText = ai.attribution.actor;
    document.getElementById("threatActorSub").innerText = `${ai.attribution.actor_type} • Confidence: ${ai.attribution.confidence}%`;
    document.getElementById("riskScoreNum").innerText = ai.risk_score;
    
    const severityPill = document.getElementById("severityPill");
    severityPill.innerText = ai.severity;
    severityPill.className = `severity-pill severity-${ai.severity}`;

    // 2. Metrics
    document.getElementById("metricNodes").innerText = graph.discovered_nodes_count;
    document.getElementById("metricHops").innerText = ai.summary_metrics.total_hops;
    document.getElementById("metricPeel").innerText = ai.summary_metrics.peeling_chain_detected ? "DETECTED" : "NONE";
    document.getElementById("metricOfframps").innerText = ai.summary_metrics.exchanges_detected_count;

    // 3. Directives
    const dirList = document.getElementById("directivesList");
    dirList.innerHTML = "";
    ai.recommendations.forEach((rec, idx) => {
        const div = document.createElement("div");
        div.className = `directive-item ${rec.includes('URGENT') ? 'urgent' : ''}`;
        div.innerText = rec;
        dirList.appendChild(div);
    });

    // 4. Blockchain Seal
    document.getElementById("sealCaseId").innerText = dossier.case_id;
    document.getElementById("sealReportHash").innerText = dossier.report_hash;
    document.getElementById("sealIpfsCid").innerText = dossier.ipfs_cid;
    
    if (anchor.is_anchored) {
        document.getElementById("sealBlockNum").innerText = `#${anchor.block_number}`;
        const txEl = document.getElementById("sealTxHash");
        txEl.innerHTML = `<a href="${anchor.explorer_url}" target="_blank">${anchor.tx_hash.substring(0, 14)}...${anchor.tx_hash.substring(58)}</a>`;
        document.getElementById("sealContract").innerText = `${anchor.contract_address.substring(0, 10)}...${anchor.contract_address.substring(34)}`;
        document.getElementById("anchorBadge").innerHTML = `✓ ANCHORED ON-CHAIN (${anchor.mode})`;
    } else {
        document.getElementById("sealBlockNum").innerText = "Pending Anchor";
        document.getElementById("sealTxHash").innerText = "Not Anchored";
        document.getElementById("anchorBadge").innerHTML = `UNANCHORED`;
    }

    // 5. Initialize Canvas Graph
    buildGraphData(graph);
}

function buildGraphData(graph) {
    graphNodes = (graph.nodes || []).map(n => ({
        ...n,
        x: 0,
        y: 0,
        radius: n.is_seed ? 18 : (n.is_terminal_sink ? 16 : 12)
    }));

    graphEdges = graph.edges || [];
    layoutGraph();
}

function layoutGraph() {
    if (!canvas || graphNodes.length === 0) return;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;

    // Organize nodes by hop distance in columns/layers
    const hops = {};
    graphNodes.forEach(node => {
        const hop = node.hop_distance || 0;
        if (!hops[hop]) hops[hop] = [];
        hops[hop].push(node);
    });

    const hopLevels = Object.keys(hops).map(Number).sort((a, b) => a - b);
    const numLayers = Math.max(hopLevels.length, 1);
    const paddingX = 80;
    const paddingY = 60;
    const layerWidth = (w - 2 * paddingX) / Math.max(numLayers - 1, 1);

    hopLevels.forEach((hop, layerIdx) => {
        const nodesInHop = hops[hop];
        const stepY = (h - 2 * paddingY) / Math.max(nodesInHop.length + 1, 2);

        nodesInHop.forEach((node, idx) => {
            node.x = paddingX + (layerIdx * layerWidth);
            node.y = paddingY + ((idx + 1) * stepY);
        });
    });

    startGraphAnimation();
}

function startGraphAnimation() {
    if (animationId) cancelAnimationFrame(animationId);

    let tick = 0;
    function render() {
        tick += 0.03;
        drawGraph(tick);
        animationId = requestAnimationFrame(render);
    }
    render();
}

function drawGraph(tick) {
    if (!ctx || !canvas) return;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Draw Edges
    graphEdges.forEach(edge => {
        const sourceNode = graphNodes.find(n => n.address.toLowerCase() === edge.from.toLowerCase());
        const targetNode = graphNodes.find(n => n.address.toLowerCase() === edge.to.toLowerCase());

        if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
            ctx.lineWidth = Math.min(4, Math.max(1.5, edge.amount / 5));
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();

            // Flow particles animation
            const particleT = (tick + (sourceNode.x * 0.01)) % 1;
            const px = sourceNode.x + (targetNode.x - sourceNode.x) * particleT;
            const py = sourceNode.y + (targetNode.y - sourceNode.y) * particleT;

            ctx.beginPath();
            ctx.fillStyle = "#38bdf8";
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();

            // Label transfer amount
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            ctx.fillStyle = "#94a3b8";
            ctx.font = "10px monospace";
            ctx.fillText(`${edge.amount} ${edge.token}`, midX, midY - 6);
        }
    });

    // Draw Nodes
    graphNodes.forEach(node => {
        ctx.beginPath();
        let fillCol = "#3b82f6"; // default intermediary
        if (node.is_seed) fillCol = "#ef4444"; // Suspect
        else if (node.sink_type === "mixer") fillCol = "#a855f7"; // Mixer
        else if (node.sink_type === "exchange") fillCol = "#f59e0b"; // CEX Offramp
        else if (node.is_peeling) fillCol = "#06b6d4";

        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillCol;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = (hoveredNode === node) ? "#fff" : "rgba(255, 255, 255, 0.3)";
        ctx.stroke();

        // Node Label
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "11px monospace";
        const shortAddr = node.address.substring(0, 6) + "..." + node.address.substring(node.address.length - 4);
        ctx.fillText(shortAddr, node.x - 28, node.y + node.radius + 14);

        if (node.sink_type !== "unknown" && node.sink_type !== "seed") {
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText(node.sink_type.toUpperCase(), node.x - 20, node.y - node.radius - 6);
        }
    });

    // Tooltip for hovered node
    if (hoveredNode) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(hoveredNode.x + 15, hoveredNode.y - 40, 220, 65, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`Hop ${hoveredNode.hop_distance}: ${hoveredNode.sink_type.toUpperCase()}`, hoveredNode.x + 25, hoveredNode.y - 22);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px monospace";
        ctx.fillText(`Addr: ${hoveredNode.address.substring(0, 16)}...`, hoveredNode.x + 25, hoveredNode.y - 8);
        ctx.fillText(`In: ${hoveredNode.in_degree} | Out: ${hoveredNode.out_degree} | Recv: ${hoveredNode.total_received} ETH`, hoveredNode.x + 25, hoveredNode.y + 6);
    }
}

function setupCanvasInteraction() {
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        hoveredNode = null;
        for (const node of graphNodes) {
            const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
            if (dist <= node.radius + 5) {
                hoveredNode = node;
                canvas.style.cursor = "pointer";
                return;
            }
        }
        canvas.style.cursor = "default";
    });
}

async function verifyOnChain() {
    if (!currentDossier) return;
    try {
        const res = await fetch(`/api/verify/${currentDossier.case_id}`);
        const data = await res.json();
        
        if (data.verification_result && data.verification_result.verified) {
            alert(`✅ ON-CHAIN EVIDENCE VERIFIED!\n\nCase ID: ${data.case_id}\nBlock: #${data.verification_result.block_number}\nContract: ${data.verification_result.contract}\nTx Hash: ${data.verification_result.tx_hash}\nCryptographic Integrity: 100% Tamper-Proof`);
        } else {
            alert(`⚠️ Verification notice: ${data.verification_result?.reason || "Hash verification unconfirmed."}`);
        }
    } catch (e) {
        alert("Verification error: " + e.message);
    }
}

function exportJSON() {
    if (!currentDossier) {
        alert("No active case to export.");
        return;
    }
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentDossier, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", str);
    dlAnchor.setAttribute("download", `${currentDossier.case_id}_forensic_dossier.json`);
    dlAnchor.click();
}

async function renderRecentCases() {
    try {
        const res = await fetch("/api/cases");
        const list = await res.json();
        const container = document.getElementById("casesList");
        if (!container) return;

        container.innerHTML = "";
        list.forEach(c => {
            const div = document.createElement("div");
            div.className = "case-item";
            div.innerHTML = `
                <div class="case-header">
                    <span>${c.case_id}</span>
                    <span class="severity-pill severity-${c.severity}">${c.severity}</span>
                </div>
                <div style="font-size:0.75rem; color:#94a3b8;">${c.attribution} • ${c.loss_amount} ${c.token}</div>
            `;
            div.onclick = async () => {
                const cRes = await fetch(`/api/case/${c.case_id}`);
                currentDossier = await cRes.json();
                renderInvestigationResults(currentDossier);
            };
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Error rendering cases:", e);
    }
}
