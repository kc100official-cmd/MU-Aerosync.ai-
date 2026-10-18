// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ForensicAttributionAnchor
 * @notice Immutable on-chain anchor for victim-reported cryptocurrency incident evidence
 *         and AI-driven multi-hop forensic attribution dossiers.
 * @dev Anchors cryptographic fingerprints (Keccak-256 / SHA-256) of forensic investigation graphs
 *      to provide tamper-proof provenance for law enforcement, exchanges, and cyber-incident teams.
 */
contract ForensicAttributionAnchor {
    
    struct CaseDossier {
        bytes32 caseId;
        bytes32 reportHash;           // Cryptographic hash of full graph & AI attribution dossier
        address victimAddress;        // Address of victim filing the report
        address suspectAddress;       // Suspect / attacker entry address
        uint256 stolenAmountWei;      // Stolen amount normalized to 18 decimals
        uint8 riskScore;              // AI-computed risk score (0 - 100)
        string attributionTag;        // AI attribution (e.g., "Inferno Drainer Cluster", "Lazarus Group")
        string ipfsEvidenceCid;       // IPFS/Arweave content identifier containing raw traces
        uint256 timestamp;            // Block timestamp of anchoring
        address investigator;         // Registered authority / reporting agent
        bool isAnchored;
    }

    address public immutable owner;
    uint256 public totalCases;
    
    // Mapping from caseId => CaseDossier
    mapping(bytes32 => CaseDossier) public cases;
    // Mapping from suspect address => array of caseIds
    mapping(address => bytes32[]) private suspectToCases;
    // Array of all case IDs
    bytes32[] public allCaseIds;

    event EvidenceAnchored(
        bytes32 indexed caseId,
        bytes32 indexed reportHash,
        address indexed suspectAddress,
        address victimAddress,
        uint8 riskScore,
        string attributionTag,
        uint256 timestamp,
        address investigator
    );

    event AttributionUpdated(
        bytes32 indexed caseId,
        string newAttributionTag,
        uint8 updatedRiskScore,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Seals and anchors forensic incident evidence onto the blockchain
     */
    function anchorEvidence(
        bytes32 caseId,
        bytes32 reportHash,
        address victimAddress,
        address suspectAddress,
        uint256 stolenAmountWei,
        uint8 riskScore,
        string calldata attributionTag,
        string calldata ipfsEvidenceCid
    ) external returns (bool) {
        require(caseId != bytes32(0), "Invalid caseId");
        require(reportHash != bytes32(0), "Invalid report hash");
        require(!cases[caseId].isAnchored, "Case already anchored");
        require(riskScore <= 100, "Risk score must be between 0 and 100");

        CaseDossier memory dossier = CaseDossier({
            caseId: caseId,
            reportHash: reportHash,
            victimAddress: victimAddress,
            suspectAddress: suspectAddress,
            stolenAmountWei: stolenAmountWei,
            riskScore: riskScore,
            attributionTag: attributionTag,
            ipfsEvidenceCid: ipfsEvidenceCid,
            timestamp: block.timestamp,
            investigator: msg.sender,
            isAnchored: true
        });

        cases[caseId] = dossier;
        suspectToCases[suspectAddress].push(caseId);
        allCaseIds.push(caseId);
        totalCases++;

        emit EvidenceAnchored(
            caseId,
            reportHash,
            suspectAddress,
            victimAddress,
            riskScore,
            attributionTag,
            block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @notice Cryptographically verifies if a given report dossier matches the on-chain immutable hash
     */
    function verifyEvidence(bytes32 caseId, bytes32 candidateHash) external view returns (bool isValid, uint256 timestamp, address investigator) {
        CaseDossier memory dossier = cases[caseId];
        if (!dossier.isAnchored) {
            return (false, 0, address(0));
        }
        return (dossier.reportHash == candidateHash, dossier.timestamp, dossier.investigator);
    }

    /**
     * @notice Retrieves full case dossier details
     */
    function getCase(bytes32 caseId) external view returns (CaseDossier memory) {
        require(cases[caseId].isAnchored, "Case not found");
        return cases[caseId];
    }

    /**
     * @notice Returns all case IDs associated with a suspect address
     */
    function getCasesBySuspect(address suspect) external view returns (bytes32[] memory) {
        return suspectToCases[suspect];
    }

    /**
     * @notice Returns total count of anchored forensic cases
     */
    function getIncidentCount() external view returns (uint256) {
        return totalCases;
    }
}
