"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Car,
  DollarSign,
  Gauge
} from "lucide-react";
import { AnalysisRequest } from "@/types/vehicle";

interface VinInputFormProps {
  onSubmit: (data: AnalysisRequest) => void;
  isLoading: boolean;
}

export function VinInputForm({ onSubmit, isLoading }: VinInputFormProps) {
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [location, setLocation] = useState(""); // For disaster geography checking

  const validateVin = (value: string): boolean => {
    // Basic VIN validation (17 characters, alphanumeric except I, O, Q)
    // VINs can contain: A-H, J-N, P-R, S, T-Z, 0-9
    // This excludes: I, O, Q
    // Using explicit character class to avoid regex parsing issues
    if (!value || typeof value !== 'string') {
      return false;
    }
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length !== 17) {
      return false;
    }
    const vinRegex = /^[A-HJ-NPRST-Z0-9]{17}$/i;
    const isValid = vinRegex.test(trimmed);
    console.log('[VIN Validation]', { value, trimmed, length: trimmed.length, isValid });
    return isValid;
  };

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow all valid VIN characters: A-H, J-N, P-R, S, T-Z, 0-9 (excludes I, O, Q)
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPRST-Z0-9]/gi, '');
    const newVin = value.slice(0, 17);
    console.log('[VIN Change]', { original: e.target.value, cleaned: value, final: newVin, length: newVin.length });
    setVin(newVin);
    if (vinError) setVinError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // VIN is required
    if (!vin || !validateVin(vin)) {
      setVinError("Please enter a valid 17-character VIN");
      return;
    }
    
    // Parse price, removing commas
    const priceValueStr = askingPrice.replace(/,/g, '');
    const priceValue = parseFloat(priceValueStr);
    
    if (!priceValueStr || isNaN(priceValue) || priceValue <= 0) {
      return;
    }

    // Parse mileage if provided, removing commas
    const mileageValue = mileage 
      ? parseInt(mileage.replace(/,/g, ''), 10) 
      : undefined;
    
    onSubmit({
      vin: vin.trim().toUpperCase(),
      askingPrice: priceValue,
      mileage: mileageValue,
      location: location.trim() || undefined,
    });
  };

  const formatPrice = (value: string) => {
    // Remove all non-numeric characters
    const num = value.replace(/[^0-9]/g, '');
    if (num) {
      // Format with commas
      return parseInt(num, 10).toLocaleString();
    }
    return '';
  };

  const formatMileage = (value: string) => {
    // Remove all non-numeric characters
    const num = value.replace(/[^0-9]/g, '');
    if (num) {
      // Format with commas
      return parseInt(num, 10).toLocaleString();
    }
    return '';
  };

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMileage(formatMileage(value));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPrice(value);
    console.log('[Price Change]', { value, formatted, willSet: formatted });
    setAskingPrice(formatted);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };


  // Helper to check if price is valid
  const isPriceValid = () => {
    if (!askingPrice || askingPrice.trim().length === 0) {
      console.log('[Price Validation]', { askingPrice, result: 'empty' });
      return false;
    }
    const priceValueStr = askingPrice.replace(/,/g, '').trim();
    if (priceValueStr.length === 0) {
      console.log('[Price Validation]', { askingPrice, priceValueStr, result: 'no digits' });
      return false;
    }
    const priceValue = parseFloat(priceValueStr);
    const isValid = !isNaN(priceValue) && priceValue > 0;
    console.log('[Price Validation]', { askingPrice, priceValueStr, priceValue, isValid });
    return isValid;
  };

  // Check if form is valid
  const isFormValid = () => {
    // VIN is required and must be valid
    if (!vin || !validateVin(vin)) {
      console.log('[Form Validation] VIN invalid');
      return false;
    }

    // Asking price is required
    if (!isPriceValid()) {
      console.log('[Form Validation] Price invalid');
      return false;
    }

    console.log('[Form Validation] Form is valid');
    return true;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* VIN Input */}
          <div className="space-y-2">
            <Label htmlFor="vin" className="text-sm font-medium text-charcoal">
              Vehicle Identification Number (VIN) *
            </Label>
            <div className="relative">
              <Input
                id="vin"
                type="text"
                value={vin}
                onChange={handleVinChange}
                placeholder="1HGCM82633A004352"
                className="font-mono text-base tracking-wider pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                maxLength={17}
                required
              />
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            {vinError && (
              <p className="text-disaster text-sm font-medium">{vinError}</p>
            )}
            <p className="text-xs text-gray-600">
              Found on driver&apos;s side dashboard or door jamb.
            </p>
          </div>

          {/* Mileage */}
          <div className="space-y-2">
            <Label htmlFor="mileage" className="text-sm font-medium text-gray-900">
              Current Mileage
              <span className="text-gray-500 font-normal ml-1">(optional but recommended)</span>
            </Label>
            <div className="relative">
              <Input
                id="mileage"
                type="text"
                inputMode="numeric"
                value={mileage}
                onChange={handleMileageChange}
                placeholder="85000"
                className="font-mono pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            {mileage && (
              <p className="text-xs text-gray-500">
                Entered: {mileage} miles
              </p>
            )}
          </div>

          {/* Location (for disaster checking) */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-900">
              Vehicle Location
              <span className="text-gray-500 font-normal ml-1">(optional - for disaster risk analysis)</span>
            </Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={handleLocationChange}
              placeholder="City, State or ZIP code"
              className="h-12 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-500">
              Helps check for flood, hurricane, or wildfire damage history
            </p>
          </div>


          {/* Asking Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-gray-900">
              Asking Price *
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="text"
                inputMode="numeric"
                value={askingPrice}
                onChange={handlePriceChange}
                placeholder="15000"
                className="font-mono text-lg pl-10 h-14 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                required
              />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold tracking-wide transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-lg shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Analyze This Deal
              </span>
            )}
          </Button>
          
          {/* Validation Hint */}
          {!isFormValid() && !isLoading && (
            <p className="text-sm text-gray-500 text-center mt-2">
              {!vin || !validateVin(vin) ? (
                <span>Please enter a valid 17-character VIN</span>
              ) : !isPriceValid() ? (
                <span>Please enter a valid asking price</span>
              ) : (
                <span>Please complete all required fields</span>
              )}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

