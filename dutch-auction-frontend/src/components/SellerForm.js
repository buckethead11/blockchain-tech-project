import React, { useState, useEffect } from 'react';
import { web3, auctionContract } from '../web3';
import { useWallet, WalletProvider } from '../context/WalletContext';

const SellerForm = ({ onSubmit, onReset, isLoading }) => {
  const [formValues, setFormValues] = useState({
    initialPrice: '',
    reservePrice: '',
    priceDecreaseInterval: '',
    duration: '',
    totalTokens: '',
  });
  
  const { account } = useWallet();

  const [formErrors, setFormErrors] = useState({});

  // Add useEffect to check account status

  
  const validateForm = (values) => {
    const errors = {};
    
    if (!values.initialPrice || Number(values.initialPrice) <= 0) {
      errors.initialPrice = "Initial price must be greater than 0";
    }
    
    if (!values.reservePrice || Number(values.reservePrice) <= 0) {
      errors.reservePrice = "Reserve price must be greater than 0";
    }
    
    if (Number(values.reservePrice) >= Number(values.initialPrice)) {
      errors.reservePrice = "Reserve price must be less than initial price";
    }
    
    if (!values.priceDecreaseInterval || Number(values.priceDecreaseInterval) <= 0) {
      errors.priceDecreaseInterval = "Interval must be greater than 0";
    }
    
    if (!values.duration || Number(values.duration) <= 0) {
      errors.duration = "Duration must be greater than 0";
    }
    
    if (!values.totalTokens || Number(values.totalTokens) <= 0) {
      errors.totalTokens = "Total tokens must be greater than 0";
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    setFormErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with values:", formValues);
    
    const errors = validateForm(formValues);
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      console.log("Validation passed, calling onSubmit");
      onSubmit(formValues);
    } else {
      console.log("Form validation errors:", errors);
    }
};
  return (
    <div className="p-6 bg-background text-textWhite rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Seller Setup</h2>
      
      {/* Account Info Display */}
  {/* Remove the Account Info Display section completely, or replace with a simpler version: */}
  <div className="mb-4 p-4 bg-gray-800 rounded">
    <h3 className="font-semibold mb-2">Account Information</h3>
    Connected Account: {account ? account : 'No account connected'}
  </div>
      {/* Reset Button */}
      <button 
        onClick={onReset}
        className="mb-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
        disabled={isLoading}
        type="button"
      >
        {isLoading ? 'Resetting...' : 'Reset Auction'}
      </button>

      {/* Form Error Display */}
      {formErrors.submit && (
        <div className="mb-4 p-2 bg-red-500 text-white rounded">
          {formErrors.submit}
        </div>
      )}

      {/* Your existing form fields... */}
      <form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <label className="block">
      Initial Price (ETH):
      <input
        type="number"
        step="0.000000000000000001"
        name="initialPrice"
        value={formValues.initialPrice}
        onChange={handleChange}
        className={`p-2 rounded border w-full text-black ${
          formErrors.initialPrice ? 'border-red-500' : ''
        }`}
      />
      {formErrors.initialPrice && (
        <p className="text-red-500 text-sm mt-1">{formErrors.initialPrice}</p>
      )}
    </label>

    <label className="block">
      Reserve Price (ETH):
      <input
        type="number"
        step="0.000000000000000001"
        name="reservePrice"
        value={formValues.reservePrice}
        onChange={handleChange}
        className={`p-2 rounded border w-full text-black ${
          formErrors.reservePrice ? 'border-red-500' : ''
        }`}
      />
      {formErrors.reservePrice && (
        <p className="text-red-500 text-sm mt-1">{formErrors.reservePrice}</p>
      )}
    </label>

    <label className="block">
      Price Decrease Interval (seconds):
      <input
        type="number"
        name="priceDecreaseInterval"
        value={formValues.priceDecreaseInterval}
        onChange={handleChange}
        className={`p-2 rounded border w-full text-black ${
          formErrors.priceDecreaseInterval ? 'border-red-500' : ''
        }`}
      />
      {formErrors.priceDecreaseInterval && (
        <p className="text-red-500 text-sm mt-1">{formErrors.priceDecreaseInterval}</p>
      )}
    </label>

    <label className="block">
      Auction Duration (seconds):
      <input
        type="number"
        name="duration"
        value={formValues.duration}
        onChange={handleChange}
        className={`p-2 rounded border w-full text-black ${
          formErrors.duration ? 'border-red-500' : ''
        }`}
      />
      {formErrors.duration && (
        <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>
      )}
    </label>

    <label className="block">
      Total Tokens:
      <input
        type="number"
        name="totalTokens"
        value={formValues.totalTokens}
        onChange={handleChange}
        className={`p-2 rounded border w-full text-black ${
          formErrors.totalTokens ? 'border-red-500' : ''
        }`}
      />
      {formErrors.totalTokens && (
        <p className="text-red-500 text-sm mt-1">{formErrors.totalTokens}</p>
      )}
    </label>

    <button 
      type="submit" 
      className="w-full mt-6 bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded"
      disabled={isLoading}
    >
      {isLoading ? 'Initializing...' : 'Start Auction'}
    </button>

  </div>
</form>
      {/* Sample Values Helper */}
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">Sample Values:</h3>
        <button 
          onClick={() => setFormValues({
            initialPrice: "0.2",
            reservePrice: "0.01",
            priceDecreaseInterval: "5",
            duration: "300",
            totalTokens: "100"
          })}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          type="button"
        >
          Fill Sample Values
        </button>
      </div>
    </div>
  );
};

export default SellerForm;
