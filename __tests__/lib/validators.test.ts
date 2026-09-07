import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateCoordinates,
  validateDate,
  validatePositiveNumber,
  validateRange,
  validateEnum,
  validateStringLength,
  validatePhoneNumber,
  validateUrl,
  validateJsonSchema,
  validateFarmData,
  validateCropData,
  validateSoilData,
  validateIrrigationData,
  validateHarvestData,
  validateEquipmentData,
  validateWeatherData,
  validateMarketData,
} from '@/lib/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('name.lastname@domain.co')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('user domain@example.com')).toBe(false);
      expect(validateEmail('user@domain@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongP@ss1')).toBe(true);
      expect(validatePassword('MyS3cure!Pass')).toBe(true);
      expect(validatePassword('Ab1!abcd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('nouppercase1!')).toBe(false);
      expect(validatePassword('NOLOWERCASE1!')).toBe(false);
      expect(validatePassword('NoNumbers!')).toBe(false);
      expect(validatePassword('NoSpecial123')).toBe(false);
    });

    it('should enforce minimum length', () => {
      expect(validatePassword('A1!a')).toBe(false);
      expect(validatePassword('A1!abc')).toBe(true);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
      expect(validatePhoneNumber('1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('abc')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should validate valid coordinates', () => {
      expect(validateCoordinates(36.7783, -119.4179)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      expect(validateDate('2024-07-15')).toBe(true);
      expect(validateDate('2024-12-31')).toBe(true);
      expect(validateDate('2024-01-01')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('2024-13-01')).toBe(false);
      expect(validateDate('2024-07-32')).toBe(false);
      expect(validateDate('')).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(1)).toBe(true);
      expect(validatePositiveNumber(0.5)).toBe(true);
      expect(validatePositiveNumber(1000)).toBe(true);
    });

    it('should reject non-positive numbers', () => {
      expect(validatePositiveNumber(0)).toBe(false);
      expect(validatePositiveNumber(-1)).toBe(false);
      expect(validatePositiveNumber(-0.5)).toBe(false);
    });

    it('should handle zero option', () => {
      expect(validatePositiveNumber(0, true)).toBe(true);
      expect(validatePositiveNumber(0, false)).toBe(false);
    });
  });

  describe('validateRange', () => {
    it('should validate numbers within range', () => {
      expect(validateRange(5, 0, 10)).toBe(true);
      expect(validateRange(0, 0, 10)).toBe(true);
      expect(validateRange(10, 0, 10)).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(validateRange(-1, 0, 10)).toBe(false);
      expect(validateRange(11, 0, 10)).toBe(false);
    });
  });

  describe('validateEnum', () => {
    it('should validate valid enum values', () => {
      const validValues = ['active', 'inactive', 'pending'];
      expect(validateEnum('active', validValues)).toBe(true);
      expect(validateEnum('inactive', validValues)).toBe(true);
      expect(validateEnum('pending', validValues)).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const validValues = ['active', 'inactive', 'pending'];
      expect(validateEnum('deleted', validValues)).toBe(false);
      expect(validateEnum('', validValues)).toBe(false);
    });
  });

  describe('validateStringLength', () => {
    it('should validate string length', () => {
      expect(validateStringLength('hello', 3, 10)).toBe(true);
      expect(validateStringLength('hi', 3, 10)).toBe(false);
      expect(validateStringLength('a'.repeat(10), 3, 10)).toBe(true);
      expect(validateStringLength('a'.repeat(11), 3, 10)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(validateStringLength('', 0, 10)).toBe(true);
      expect(validateStringLength('', 1, 10)).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com/path')).toBe(true);
      expect(validateUrl('https://example.com:8080/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('invalid-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('validateJsonSchema', () => {
    it('should validate data against schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      expect(validateJsonSchema({ name: 'John', age: 30 }, schema)).toBe(true);
      expect(validateJsonSchema({ name: 'John' }, schema)).toBe(true);
    });

    it('should reject data not matching schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      expect(validateJsonSchema({ age: 30 }, schema)).toBe(false);
      expect(validateJsonSchema({ name: 123 }, schema)).toBe(false);
    });
  });

  describe('validateFarmData', () => {
    it('should validate complete farm data', () => {
      const farmData = {
        name: 'Green Valley Farm',
        location: 'California, USA',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
      };

      const result = validateFarmData(farmData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid farm data', () => {
      const farmData = {
        name: '',
        location: '',
        latitude: 91,
        longitude: 181,
        area: -100,
      };

      const result = validateFarmData(farmData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCropData', () => {
    it('should validate complete crop data', () => {
      const cropData = {
        name: 'Tomato Plot A',
        cropTypeId: 'type-1',
        farmId: 'farm-1',
        plantedDate: '2024-03-01',
        area: 2.5,
        areaUnit: 'hectares',
      };

      const result = validateCropData(cropData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid crop data', () => {
      const cropData = {
        name: '',
        cropTypeId: '',
        farmId: '',
        plantedDate: 'invalid',
        area: -1,
      };

      const result = validateCropData(cropData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSoilData', () => {
    it('should validate complete soil data', () => {
      const soilData = {
        farmId: 'farm-1',
        testDate: '2024-07-15',
        ph: 6.8,
        nitrogen: 45,
        phosphorus: 35,
        potassium: 180,
        organicMatter: 3.2,
        moisture: 28,
        temperature: 18,
      };

      const result = validateSoilData(soilData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate pH range', () => {
      const soilData = {
        farmId: 'farm-1',
        testDate: '2024-07-15',
        ph: 15,
        nitrogen: 45,
        phosphorus: 35,
        potassium: 180,
        organicMatter: 3.2,
        moisture: 28,
        temperature: 18,
      };

      const result = validateSoilData(soilData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('pH must be between 0 and 14');
    });
  });

  describe('validateIrrigationData', () => {
    it('should validate complete irrigation data', () => {
      const irrigationData = {
        farmId: 'farm-1',
        name: 'Drip System - Zone A',
        type: 'drip',
        flowRate: 2.5,
        flowUnit: 'L/min',
        pressure: 2.0,
        pressureUnit: 'bar',
        zone: 'A',
        coverage: 50,
        coverageUnit: 'hectares',
      };

      const result = validateIrrigationData(irrigationData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate flow rate range', () => {
      const irrigationData = {
        farmId: 'farm-1',
        name: 'Drip System',
        type: 'drip',
        flowRate: -1,
        flowUnit: 'L/min',
        pressure: 2.0,
        pressureUnit: 'bar',
        zone: 'A',
        coverage: 50,
        coverageUnit: 'hectares',
      };

      const result = validateIrrigationData(irrigationData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow rate must be positive');
    });
  });

  describe('validateHarvestData', () => {
    it('should validate complete harvest data', () => {
      const harvestData = {
        cropId: 'crop-1',
        farmId: 'farm-1',
        harvestDate: '2024-05-20',
        quantity: 12000,
        quantityUnit: 'kg',
        quality: 'GRADE_A',
        moistureContent: 14,
      };

      const result = validateHarvestData(harvestData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate quantity is positive', () => {
      const harvestData = {
        cropId: 'crop-1',
        farmId: 'farm-1',
        harvestDate: '2024-05-20',
        quantity: -100,
        quantityUnit: 'kg',
        quality: 'GRADE_A',
        moistureContent: 14,
      };

      const result = validateHarvestData(harvestData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be positive');
    });

    it('should validate moisture content range', () => {
      const harvestData = {
        cropId: 'crop-1',
        farmId: 'farm-1',
        harvestDate: '2024-05-20',
        quantity: 12000,
        quantityUnit: 'kg',
        quality: 'GRADE_A',
        moistureContent: 150,
      };

      const result = validateHarvestData(harvestData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Moisture content must be between 0 and 100%'
      );
    });
  });

  describe('validateEquipmentData', () => {
    it('should validate complete equipment data', () => {
      const equipmentData = {
        farmId: 'farm-1',
        name: 'John Deere 5075E',
        type: 'tractor',
        brand: 'John Deere',
        model: '5075E',
        serialNumber: 'JD-2024-001',
        year: 2024,
        purchaseDate: '2024-01-15',
        purchasePrice: 45000,
        fuelType: 'diesel',
        horsepower: 75,
      };

      const result = validateEquipmentData(equipmentData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate purchase price', () => {
      const equipmentData = {
        farmId: 'farm-1',
        name: 'Tractor',
        type: 'tractor',
        brand: 'John Deere',
        model: '5075E',
        serialNumber: 'JD-2024-001',
        year: 2024,
        purchaseDate: '2024-01-15',
        purchasePrice: -1000,
        fuelType: 'diesel',
        horsepower: 75,
      };

      const result = validateEquipmentData(equipmentData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase price must be positive');
    });
  });
});
