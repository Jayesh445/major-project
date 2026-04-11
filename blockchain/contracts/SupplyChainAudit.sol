// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SupplyChainAudit
 * @notice Immutable audit trail for AutoStock AI supply chain events.
 *         Stores only cryptographic commitments (SHA-256 hashes) + minimal
 *         metadata on-chain. Full payloads remain off-chain in MongoDB.
 * @dev Hybrid anchor-and-verify pattern:
 *         - on-chain: hash, eventType, amount, timestamp, submitter
 *         - off-chain: PO line items, negotiation rounds, supplier details
 */
contract SupplyChainAudit {
    enum EventType {
        PO_CREATED,              // 0 — Purchase order minted after negotiation
        PO_APPROVED,             // 1 — Approved by procurement officer
        PO_SENT,                 // 2 — Sent to supplier
        PO_RECEIVED,             // 3 — Goods verified at warehouse dock
        NEGOTIATION_ACCEPTED,    // 4 — AI negotiation deal accepted
        NEGOTIATION_REJECTED,    // 5 — AI negotiation deal rejected
        INVENTORY_ADJUSTMENT,    // 6 — Manual stock correction
        SMART_CONTRACT_EXECUTED  // 7 — Auto payment settlement triggered
    }

    struct AuditEntry {
        bytes32 referenceId;
        uint8 eventType;
        bytes32 documentHash;
        uint256 amount;
        uint256 timestamp;
        address submittedBy;
    }

    /// @notice Per-reference ordered history (one reference can have many events)
    mapping(bytes32 => AuditEntry[]) private entriesByReference;

    /// @notice Fast lookup: latest hash per (referenceId, eventType)
    mapping(bytes32 => mapping(uint8 => bytes32)) public latestHashByRef;

    /// @notice Approved submitters (e.g. backend wallet)
    mapping(address => bool) public approvedSubmitters;

    address public owner;

    event AuditLogged(
        bytes32 indexed referenceId,
        uint8 indexed eventType,
        bytes32 documentHash,
        uint256 amount,
        uint256 timestamp,
        address indexed submittedBy
    );

    event SubmitterAdded(address indexed submitter);
    event SubmitterRemoved(address indexed submitter);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    modifier onlyApproved() {
        require(approvedSubmitters[msg.sender], "SupplyChainAudit: not approved submitter");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "SupplyChainAudit: only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        approvedSubmitters[msg.sender] = true;
        emit SubmitterAdded(msg.sender);
    }

    /// @notice Add an approved submitter (typically the backend wallet)
    function addSubmitter(address who) external onlyOwner {
        require(who != address(0), "Zero address");
        approvedSubmitters[who] = true;
        emit SubmitterAdded(who);
    }

    /// @notice Remove an approved submitter
    function removeSubmitter(address who) external onlyOwner {
        approvedSubmitters[who] = false;
        emit SubmitterRemoved(who);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        address previous = owner;
        owner = newOwner;
        approvedSubmitters[newOwner] = true;
        emit OwnerChanged(previous, newOwner);
        emit SubmitterAdded(newOwner);
    }

    /// @notice Log a single supply chain event
    /// @param referenceId  Off-chain reference (e.g. MongoDB ObjectId padded to 32 bytes)
    /// @param eventType    EventType enum value (0-7)
    /// @param documentHash SHA-256 hash of the canonical off-chain payload
    /// @param amount       Amount in smallest unit (paise for INR); 0 if N/A
    /// @return entryIndex  Index in the reference history
    function logEvent(
        bytes32 referenceId,
        uint8 eventType,
        bytes32 documentHash,
        uint256 amount
    ) external onlyApproved returns (uint256 entryIndex) {
        require(eventType <= uint8(EventType.SMART_CONTRACT_EXECUTED), "Invalid eventType");
        require(documentHash != bytes32(0), "Empty documentHash");
        require(referenceId != bytes32(0), "Empty referenceId");

        AuditEntry memory entry = AuditEntry({
            referenceId: referenceId,
            eventType: eventType,
            documentHash: documentHash,
            amount: amount,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        entriesByReference[referenceId].push(entry);
        latestHashByRef[referenceId][eventType] = documentHash;
        entryIndex = entriesByReference[referenceId].length - 1;

        emit AuditLogged(
            referenceId,
            eventType,
            documentHash,
            amount,
            block.timestamp,
            msg.sender
        );
    }

    /// @notice Batch-log multiple events in a single transaction (gas optimization)
    function logEventsBatch(
        bytes32[] calldata referenceIds,
        uint8[] calldata eventTypes,
        bytes32[] calldata documentHashes,
        uint256[] calldata amounts
    ) external onlyApproved {
        uint256 len = referenceIds.length;
        require(
            eventTypes.length == len &&
            documentHashes.length == len &&
            amounts.length == len,
            "Length mismatch"
        );

        for (uint256 i = 0; i < len; i++) {
            uint8 eType = eventTypes[i];
            require(eType <= uint8(EventType.SMART_CONTRACT_EXECUTED), "Invalid eventType");
            require(documentHashes[i] != bytes32(0), "Empty documentHash");
            require(referenceIds[i] != bytes32(0), "Empty referenceId");

            AuditEntry memory entry = AuditEntry({
                referenceId: referenceIds[i],
                eventType: eType,
                documentHash: documentHashes[i],
                amount: amounts[i],
                timestamp: block.timestamp,
                submittedBy: msg.sender
            });

            entriesByReference[referenceIds[i]].push(entry);
            latestHashByRef[referenceIds[i]][eType] = documentHashes[i];

            emit AuditLogged(
                referenceIds[i],
                eType,
                documentHashes[i],
                amounts[i],
                block.timestamp,
                msg.sender
            );
        }
    }

    /// @notice Verify a document hash matches the latest on-chain record
    function verifyHash(
        bytes32 referenceId,
        uint8 eventType,
        bytes32 documentHash
    ) external view returns (bool) {
        return latestHashByRef[referenceId][eventType] == documentHash;
    }

    /// @notice Get all audit entries for a reference
    function getEntries(bytes32 referenceId) external view returns (AuditEntry[] memory) {
        return entriesByReference[referenceId];
    }

    /// @notice Get count of audit entries for a reference
    function getEntryCount(bytes32 referenceId) external view returns (uint256) {
        return entriesByReference[referenceId].length;
    }

    /// @notice Get a specific entry by index
    function getEntry(bytes32 referenceId, uint256 index) external view returns (AuditEntry memory) {
        require(index < entriesByReference[referenceId].length, "Index out of bounds");
        return entriesByReference[referenceId][index];
    }
}
