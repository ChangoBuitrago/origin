pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

import "./Registry.sol";
import "./PublicIssuer.sol";

contract PrivateIssuer is Initializable, Ownable {
	event CommitmentUpdated(address indexed _owner, uint256 indexed _id, bytes32 _commitment);

	event IssueRequest(address indexed _owner, uint256 indexed _id);
	event MigrateToPublicRequest(address indexed _owner, uint256 indexed _id);
	event PrivateTransferRequest(address indexed _owner, uint256 indexed _id);
	event PublicCertificateCreated(uint indexed _from, uint indexed _to);

	Registry public registry;
	PublicIssuer public publicIssuer;

	int public privateCertificateTopic = 1234;
	int public publicCertificateTopic = 1235;

	struct RequestIssue {
		address owner;
		bytes data;
		bool approved;
        bool revoked;
	}

	struct RequestStateChange {
		address owner;
		uint certificateId;
		bytes32 hash;
		bool approved;
	}

	struct Proof {
		bool left;
		bytes32 hash;
	}

	uint public requestIssueNonce;
	uint public requestMigrateToPublicNonce;
	uint public requestPrivateTransferNonce;

	mapping(uint256 => RequestIssue) public requestIssueStorage;
	mapping(uint256 => RequestStateChange) public requestMigrateToPublicStorage;
	mapping(uint256 => RequestStateChange) public requestPrivateTransferStorage;

	mapping(uint256 => bytes32) public commitments;
	mapping(uint256 => bool) public migrations;

	function initialize(address _registry, address _publicIssuer) public initializer {
		require(_registry != address(0), "initialize: Cannot use address 0x0 as registry address.");
		registry = Registry(_registry);

		require(_publicIssuer != address(0), "initialize: Cannot use address 0x0 as public issuer.");
		publicIssuer = PublicIssuer(_publicIssuer);

		Ownable.initialize(msg.sender);
	}

	function updateCommitment(uint _id, bytes32 _previousCommitment, bytes32 _commitment) public {
		require(commitments[_id] == _previousCommitment, "updateCommitment: previous commitment invalid");

		commitments[_id] = _commitment;

		emit CommitmentUpdated(msg.sender, _id, _commitment);
	}

	/*
		Private Issue
	*/

	function encodeIssue(uint _from, uint _to, string memory _deviceId) public pure returns (bytes memory) {
		return abi.encode(_from, _to, _deviceId);
	}

	function decodeIssue(bytes memory _data) public pure returns (uint, uint, string memory) {
		return abi.decode(_data, (uint, uint, string));
	}

    function getRequestIssue(uint _requestId) external returns (RequestIssue memory) {
        return requestIssueStorage[_requestId];
    }

	function requestIssueFor(bytes memory _data, address _owner) public returns (uint256) {
		uint id = ++requestIssueNonce;

		requestIssueStorage[id] = RequestIssue({
			owner: _owner,
			data: _data,
			approved: false,
            revoked: false
		});

		emit IssueRequest(_owner, id);

        return id;
	}

    function requestIssue(bytes calldata _data) external {
        requestIssueFor(_data, msg.sender);
    }

	function approveIssue(address _to, uint _requestId, bytes32 _commitment, bytes calldata _validityData) external onlyOwner returns (uint256) {
		RequestIssue storage request = requestIssueStorage[_requestId];
		require(!request.approved, "Already issued"); //consider checking topic and other params from request

		request.approved = true;

		uint id = registry.issue(_to, _validityData, privateCertificateTopic, 0, request.data);

		updateCommitment(id, 0x0, _commitment);

		return id;
	}

	/*
		Migrate to public certificate (public issue)
	*/
	function requestMigrateToPublic(uint _certificateId, bytes32 _hash) external {
		uint id = ++requestMigrateToPublicNonce;

		requestMigrateToPublicStorage[id] = RequestStateChange({
			owner: msg.sender,
			hash: _hash,
			certificateId: _certificateId,
			approved: false
		});

		emit MigrateToPublicRequest(msg.sender, id);
	}

	function migrateToPublic(uint _requestId, uint _value, string calldata _salt, Proof[] calldata _proof, bytes32 _newCommitment) external {
		RequestStateChange storage request = requestMigrateToPublicStorage[_requestId];

		require(!request.approved, "Request already approved");
		require(request.hash == keccak256(abi.encodePacked(request.owner, _value, _salt)), "Requested hash does not match");
		require(validateProof(request.owner, _value, _salt, commitments[request.certificateId], _proof), "Invalid proof");

		request.approved = true;

		//here delegate both to public issuer
		//or even better move the logic to separate contract that keeps track of public to private and opposite direction
		if (migrations[request.certificateId]) {
			// registry.mint(request.owner, request.certificateId, _value);
			// publicIssuer.mint()
		} else {
			migrations[request.certificateId] = true;
			(,,bytes memory validityData, bytes memory data) = registry.getCertificate(request.certificateId);

			uint requestId = publicIssuer.requestIssueFor(data, request.owner);
			uint id = publicIssuer.approveIssue(request.owner, requestId, _value, validityData);

			emit PublicCertificateCreated(request.certificateId, id);
		}
	}

	/*
		Transfer volume to public
	*/
	function transferToPublic(uint _requestId, uint _value, string calldata _salt, Proof[] calldata _proof) external {
		RequestStateChange storage request = requestMigrateToPublicStorage[_requestId];

		require(!request.approved, "Request already approved");
		require(request.hash == keccak256(abi.encodePacked(request.owner, _value, _salt)), "Requested hash does not match");
		require(validateProof(request.owner, _value, _salt, commitments[request.certificateId], _proof), "Invalid proof");

		request.approved = true;

		registry.safeTransferFrom(address(this), request.owner, request.certificateId, _value, new bytes(0)); //TODO: do we need a data here?
	}

	/*
		Private transfer
	*/
	function requestPrivateTransfer(uint _certificateId, bytes32 _hash) external {
		uint id = ++requestPrivateTransferNonce;

		requestPrivateTransferStorage[id] = RequestStateChange({
			owner: msg.sender,
			hash: _hash,
			certificateId: _certificateId,
			approved: false
		});

		emit PrivateTransferRequest(msg.sender, id);
	}

	function privateTransfer(uint _requestId, Proof[] calldata _proof, bytes32 _previousCommitment, bytes32 _commitment) external {
		RequestStateChange storage request = requestPrivateTransferStorage[_requestId];

		require(!request.approved, "Request already approved");
		require(validateMerkle(request.hash, _commitment, _proof), "Wrong merkle tree");

		request.approved = true;

		updateCommitment(request.certificateId, _previousCommitment, _commitment);
	}

	/*
		Utils
	*/
	function validateProof(address _key, uint _value, string memory _salt, bytes32 _rootHash, Proof[] memory _proof) private pure returns(bool) {
		bytes32 hash = keccak256(abi.encodePacked(_key, _value, _salt));

		return validateMerkle(hash, _rootHash, _proof);
	}

	function validateMerkle(bytes32 _leaf, bytes32 _rootHash, Proof[] memory _proof) private pure returns(bool) {
		bytes32 hash = _leaf;

		for (uint i = 0; i < _proof.length; i++) {
			Proof memory p = _proof[i];
			if (p.left) {
				hash = keccak256(abi.encodePacked(p.hash, hash));
			} else {
				hash = keccak256(abi.encodePacked(hash, p.hash));
			}
		}

		return _rootHash == hash;
	}

    function revokeRequest(uint256 _requestId) public onlyOwner {
        RequestIssue storage request = requestIssueStorage[_requestId];
        require(!request.revoked, "revokeRequest(): Already revoked");

        request.revoked = true;
    }

    function isRequestValid(uint256 _requestId) external view returns (bool) {
        RequestIssue storage request = requestIssueStorage[_requestId];

        return _requestId <= requestIssueNonce && request.approved && request.revoked == false;
    }

    function getPublicIssuerAddress() public view returns (address) {
        return address(publicIssuer);
    }

    function getRegistryAddress() public view returns (address) {
        return address(registry);
    }

    function version() public view returns (string memory) {
        return "v0.1";
    }
}