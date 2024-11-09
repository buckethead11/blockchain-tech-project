import React from 'react';

const ReentryAttackWarning = () => {
  return (
    <div className="p-4 bg-accent1 text-white rounded-lg">
      <h2 className="text-2xl font-bold">Security: Reentry Attack Protection</h2>
      <p className="mt-2">
        A reentry attack is a type of security vulnerability in smart contracts where an external contract repeatedly calls back into the original function before the initial execution completes, potentially exploiting the contract’s state.
      </p>
      <p className="mt-2">
        This auction contract includes safeguards against reentry attacks, ensuring that only valid transactions are processed.
      </p>
      <p className="mt-2 text-green-300 font-semibold">Status: Protected against reentry attacks ✅</p>
    </div>
  );
};

export default ReentryAttackWarning;
