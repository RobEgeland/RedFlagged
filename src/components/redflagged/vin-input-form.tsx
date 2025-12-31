"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Car,
  DollarSign,
  Gauge
} from "lucide-react";
import { AnalysisRequest } from "@/types/vehicle";

interface VinInputFormProps {
  onSubmit: (data: AnalysisRequest) => void;
  isLoading: boolean;
}

const carMakes = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", 
  "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", 
  "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Nissan", 
  "Porsche", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export function VinInputForm({ onSubmit, isLoading }: VinInputFormProps) {
  const [inputMode, setInputMode] = useState<'vin' | 'manual'>('vin');
  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [showManual, setShowManual] = useState(false);
  
  // Manual entry fields
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
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

    if (inputMode === 'vin') {
      if (vin && !validateVin(vin)) {
        setVinError("Please enter a valid 17-character VIN");
        return;
      }
      
      onSubmit({
        vin: vin || undefined,
        askingPrice: priceValue,
        year: year ? parseInt(year, 10) : undefined,
        make: make || undefined,
        model: model || undefined,
        mileage: mileageValue,
        location: location.trim() || undefined,
      });
    } else {
      if (!year || !make || !model.trim()) {
        return;
      }
      
      onSubmit({
        year: parseInt(year, 10),
        make: make.trim(),
        model: model.trim(),
        mileage: mileageValue,
        askingPrice: priceValue,
        location: location.trim() || undefined,
      });
    }
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
    // Asking price is always required
    if (!isPriceValid()) {
      console.log('[Form Validation] Price invalid');
      return false;
    }

    // In manual mode, year, make, and model are required
    if (inputMode === 'manual') {
      if (!year || !make || !model.trim()) {
        console.log('[Form Validation] Manual fields incomplete:', { year, make, model });
        return false;
      }
    }

    // In VIN mode, if VIN is provided, it must be valid
    if (inputMode === 'vin' && vin && vin.length > 0) {
      const vinValid = validateVin(vin);
      console.log('[Form Validation] VIN check:', { vin, length: vin.length, isValid: vinValid });
      if (!vinValid) {
      return false;
      }
    }

    console.log('[Form Validation] Form is valid');
    return true;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setInputMode('vin')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                inputMode === 'vin' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Enter VIN
            </button>
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                inputMode === 'manual' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {/* VIN Input Mode */}
          {inputMode === 'vin' && (
            <div className="space-y-2">
              <Label htmlFor="vin" className="text-sm font-medium text-charcoal">
                Vehicle Identification Number (VIN)
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
                />
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {vinError && (
                <p className="text-disaster text-sm font-medium">{vinError}</p>
              )}
              <p className="text-xs text-gray-600">
                Found on driver&apos;s side dashboard or door jamb. Leave blank to skip VIN lookup.
              </p>
            </div>
          )}

          {/* Manual Entry Mode */}
          {inputMode === 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-medium text-gray-900">
                  Year *
                </Label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md bg-white focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required={inputMode === 'manual'}
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="make" className="text-sm font-medium text-gray-900">
                  Make *
                </Label>
                <select
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md bg-white focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  required={inputMode === 'manual'}
                >
                  <option value="">Select Make</option>
                  {carMakes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="model" className="text-sm font-medium text-gray-900">
                  Model *
                </Label>
                <Input
                  id="model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., Camry, Civic, F-150"
                  className="h-12 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  required={inputMode === 'manual'}
                />
              </div>
            </div>
          )}

          {/* Optional Fields Toggle for VIN mode */}
          {inputMode === 'vin' && (
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showManual ? 'Hide' : 'Add'} vehicle details for better accuracy
            </button>
          )}

          {/* Optional Manual Fields for VIN mode */}
          {inputMode === 'vin' && showManual && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="year-optional" className="text-sm font-medium text-gray-600">
                  Year
                </Label>
                <select
                  id="year-optional"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
                >
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="make-optional" className="text-sm font-medium text-gray-600">
                  Make
                </Label>
                <select
                  id="make-optional"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white text-sm"
                >
                  <option value="">Select</option>
                  {carMakes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model-optional" className="text-sm font-medium text-gray-600">
                  Model
                </Label>
                <Input
                  id="model-optional"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model"
                  className="h-10 border-gray-200 text-sm"
                />
              </div>
            </div>
          )}

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
              {!isPriceValid() ? (
                <span>Please enter a valid asking price</span>
              ) : inputMode === 'vin' && vin && vin.length > 0 && !validateVin(vin) ? (
                <span>Please enter a valid 17-character VIN</span>
              ) : inputMode === 'manual' && (!year || !make || !model.trim()) ? (
                <span>Please fill in all required fields (Year, Make, Model)</span>
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
