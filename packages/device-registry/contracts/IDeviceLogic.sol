pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

import "./DeviceDefinitions.sol";

contract IDeviceLogic {

    event LogDeviceCreated(address _sender, uint indexed _deviceId);
    event LogDeviceFullyInitialized(uint indexed _deviceId);
    event DeviceStatusChanged(uint indexed _deviceId, DeviceDefinitions.DeviceStatus _status);
    event LogNewMeterRead(
        uint indexed _deviceId,
        uint _oldMeterRead,
        uint _newMeterRead,
        uint _timestamp
    );

    function userLogicAddress() public view returns (address);

    /**
        public functions
    */

    /// @notice gets the Device-struct as memory
    /// @param _deviceId the id of an device
    /// @return the Device-struct as memory
    function getDevice(uint _deviceId) external view returns (DeviceDefinitions.Device memory device);

	/// @notice Sets status
	/// @param _deviceId The id belonging to an entry in the device registry
	/// @param _status device status
    function setStatus(uint _deviceId, DeviceDefinitions.DeviceStatus _status) external;

	/// @notice Logs meter read
	/// @param _deviceId The id belonging to an entry in the device registry
	/// @param _newMeterRead The current meter read of the device
	/// @param _lastSmartMeterReadFileHash Last meter read file hash
    function saveSmartMeterRead(
        uint _deviceId,
        uint _newMeterRead,
        string calldata _lastSmartMeterReadFileHash,
        uint _timestamp) external;

    /// @notice creates an device with the provided parameters
	/// @param _smartMeter smartmeter of the device
	/// @param _owner device-owner
	/// @param _status device status
	/// @return generated device-id
    function createDevice(
        address _smartMeter,
        address _owner,
        DeviceDefinitions.DeviceStatus _status
    ) external returns (uint deviceId);

    function getSmartMeterReadsForDevice(uint _deviceId) external view
        returns (DeviceDefinitions.SmartMeterRead[] memory reads);

    /// @notice Gets an device
	/// @param _deviceId The id belonging to an entry in the device registry
	/// @return Full informations of an device
    function getDeviceById(uint _deviceId) public view returns (DeviceDefinitions.Device memory);

	/// @notice gets the owner-address of an device
	/// @param _deviceId the id of an device
	/// @return the owner of that device
    function getDeviceOwner(uint _deviceId) external view returns (address);

	/// @notice gets the last meterreading and its hash
	/// @param _deviceId the id of an device
	/// @return the last meterreading and its hash
    function getLastMeterReadingAndHash(uint _deviceId)
        external view
        returns (uint _lastSmartMeterReadWh, string memory _lastSmartMeterReadFileHash);

    /// @notice function to get the amount of already onboarded devices
    /// @return the amount of devices already deployed
    function getDeviceListLength() public view returns (uint);
}
