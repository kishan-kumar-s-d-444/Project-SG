// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NonceValidator {
    // Struct to store client details and permissions
    struct Client {
        bool isRegistered;
        string allowedEndpoints;  // Comma-separated list of endpoints
    }
    
    // Mappings
    mapping(address => Client) public clients;
    mapping(bytes32 => bool) public usedNonces;
    
    // Events
    event NonceValidated(string nonce, address client, string endpoint);
    event ClientRegistered(address clientAddress, string allowedEndpoints);
    event FileHashStored(address indexed client, string filename, bytes32 hash, uint256 version);
    
    // File hash storage
    struct FileHash {
        bytes32 hash;
        uint256 timestamp;
        uint256 version;
        bool isValid;
    }
    mapping(address => mapping(string => FileHash[])) public fileHashes;
    
    // Constructor
    constructor(address[] memory _clientAddresses, string[] memory _allowedEndpoints) {
        require(_clientAddresses.length == _allowedEndpoints.length, "Arrays must be same length");
        
        for (uint i = 0; i < _clientAddresses.length; i++) {
            clients[_clientAddresses[i]] = Client(true, _allowedEndpoints[i]);
            emit ClientRegistered(_clientAddresses[i], _allowedEndpoints[i]);
        }
    }
    
    // Helper function to check if a string contains a substring
    function contains(string memory what, string memory where) internal pure returns (bool) {
        bytes memory whatBytes = bytes(what);
        bytes memory whereBytes = bytes(where);
        
        if (whereBytes.length < whatBytes.length) {
            return false;
        }
        
        for (uint i = 0; i <= whereBytes.length - whatBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < whatBytes.length; j++) {
                if (whereBytes[i + j] != whatBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        return false;
    }
    
    // Function to validate access
    function validateAccess(string memory nonce, bytes memory signature, string memory endpoint) public view returns (bool) {
        // Hash the message that was signed
        bytes32 messageHash = keccak256(abi.encodePacked(nonce));
        
        // Get the ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        // Recover the signer's address
        address signer = recoverSigner(ethSignedMessageHash, signature);
        
        // Check if client is registered
        require(clients[signer].isRegistered, "Client not registered");
        
        // Check if client can access this endpoint
        require(
            contains(endpoint, clients[signer].allowedEndpoints),
            "Client not authorized for this endpoint"
        );
        
        // Check if nonce was already used
        bytes32 nonceHash = keccak256(abi.encodePacked(nonce));
        require(!usedNonces[nonceHash], "Nonce already used");
        
        return true;
    }
    
    // Optional: Function to mark nonce as used (only if you want on-chain nonce tracking)
    function markNonceAsUsed(string memory nonce) public {
        bytes32 nonceHash = keccak256(abi.encodePacked(nonce));
        require(!usedNonces[nonceHash], "Nonce already used");
        usedNonces[nonceHash] = true;
        emit NonceValidated(nonce, msg.sender, clients[msg.sender].allowedEndpoints);
    }
    
    // Function to check if a client can access an endpoint
    function canAccessEndpoint(address clientAddr, string memory endpoint) public view returns (bool) {
        if (!clients[clientAddr].isRegistered) return false;
        return contains(endpoint, clients[clientAddr].allowedEndpoints);
    }
    
    // Store file hash
    function storeFileHash(
        address client,
        string memory filename,
        bytes32 fileHash,
        uint256 version
    ) public {
        FileHash memory newFile = FileHash({
            hash: fileHash,
            timestamp: block.timestamp,
            version: version,
            isValid: true
        });
        
        fileHashes[client][filename].push(newFile);
        emit FileHashStored(client, filename, fileHash, version);
    }
    
    // Verify file hash
    function verifyFileHash(
        address client,
        string memory filename,
        bytes32 fileHash,
        uint256 version
    ) public view returns (bool) {
        FileHash[] storage files = fileHashes[client][filename];
        
        for (uint i = 0; i < files.length; i++) {
            if (files[i].version == version && files[i].isValid) {
                return files[i].hash == fileHash;
            }
        }
        return false;
    }
    
    // Helper function to recover signer from signature
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) public pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature 'v' value");
        
        return ecrecover(ethSignedMessageHash, v, r, s);
    }
}