// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NonceValidator {
    address public clientAddress;
    mapping(bytes32 => bool) public usedNonces;
    
    event NonceValidated(bytes32 nonce, bool success);
    
    constructor(address _clientAddress) {
        clientAddress = _clientAddress;
    }
    
    function validateSignedNonce(bytes32 nonce, bytes memory signature) public returns (bool) {
        require(!usedNonces[nonce], "Nonce already used");
        
        // Reconstruct the signed message
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                nonce
            )
        );
        
        // Recover the signer
        address recoveredSigner = recoverSigner(messageHash, signature);
        
        // Verify signer and mark nonce as used
        bool isValid = (recoveredSigner == clientAddress);
        if (isValid) {
            usedNonces[nonce] = true;
        }
        
        emit NonceValidated(nonce, isValid);
        return isValid;
    }
    
    function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
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
        
        return ecrecover(messageHash, v, r, s);
    }
}