"use client";

import React, { useState } from "react";
import { AmountInput } from "./AmountInput";

interface CreateEscrowFormProps {
  onSubmit: (data: {
    customerPhone: string;
    description: string;
    amountKobo: number;
    deliveryMethod: string;
  }) => void;
  isLoading?: boolean;
}

export function CreateEscrowForm({
  onSubmit,
  isLoading,
}: CreateEscrowFormProps) {
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [amountKobo, setAmountKobo] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerPhone) {
      setError("Customer phone is required");
      return;
    }
    if (!description) {
      setError("Description is required");
      return;
    }
    if (amountKobo <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    onSubmit({
      customerPhone,
      description,
      amountKobo,
      deliveryMethod,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Create Escrow Link
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Generate a safe payment link for your customer.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="customerPhone"
          className="block text-sm font-medium text-gray-700"
        >
          Customer Phone
        </label>
        <input
          type="tel"
          id="customerPhone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="08012345678"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Item Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. iPhone 13 Pro Max"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <AmountInput label="Price" value={amountKobo} onChange={setAmountKobo} />

      <div className="space-y-1">
        <label
          htmlFor="deliveryMethod"
          className="block text-sm font-medium text-gray-700"
        >
          Delivery Method
        </label>
        <select
          id="deliveryMethod"
          value={deliveryMethod}
          onChange={(e) => setDeliveryMethod(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="pickup">Store Pickup</option>
          <option value="delivery">Home Delivery</option>
          <option value="digital">Digital Transfer</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0B6E4F] hover:bg-[#095940] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B6E4F] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Creating..." : "Create Escrow Link"}
      </button>
    </form>
  );
}
