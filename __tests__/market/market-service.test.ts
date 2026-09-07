import { MarketService } from '@/services/market.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('MarketService', () => {
  let marketService: MarketService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockMarketPrice = {
    id: 'price-1',
    cropType: 'Tomato',
    market: 'FreshMart',
    location: 'Los Angeles, CA',
    date: new Date('2024-07-15'),
    price: 2.5,
    currency: 'USD',
    unit: 'kg',
    quality: 'Grade A',
    supply: 5000,
    demand: 6000,
    trend: 'stable',
    updatedAt: new Date('2024-07-15'),
  };

  const mockMarketListing = {
    id: 'listing-1',
    sellerId: 'user-1',
    cropId: 'crop-1',
    title: 'Fresh Organic Tomatoes',
    description: 'High-quality organic tomatoes from Green Valley Farm',
    quantity: 5000,
    quantityUnit: 'kg',
    pricePerUnit: 3.0,
    currency: 'USD',
    quality: 'Organic Grade A',
    location: 'California, USA',
    availableFrom: new Date('2024-07-20'),
    availableUntil: new Date('2024-07-30'),
    images: ['tomato-1.jpg', 'tomato-2.jpg'],
    status: 'active',
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-15'),
    seller: {
      id: 'user-1',
      name: 'John Farmer',
      rating: 4.8,
      totalSales: 150,
    },
    crop: {
      id: 'crop-1',
      name: 'Tomato Plot A',
      cropType: { name: 'Tomato' },
    },
  };

  const mockMarketAlert = {
    id: 'alert-1',
    userId: 'user-1',
    cropType: 'Tomato',
    type: 'PRICE_DROP',
    threshold: 2.0,
    direction: 'below',
    enabled: true,
    createdAt: new Date('2024-07-15'),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    marketService = new MarketService(prisma as unknown as PrismaClient);
  });

  describe('getMarketPrices', () => {
    it('should return current market prices', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([mockMarketPrice]);

      const result = await marketService.getMarketPrices('Tomato');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('price');
      expect(result[0]).toHaveProperty('market');
      expect(result[0]).toHaveProperty('trend');
    });

    it('should filter by location', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([mockMarketPrice]);

      await marketService.getMarketPrices('Tomato', 'Los Angeles');

      expect(prisma.marketPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cropType: 'Tomato',
            location: expect.objectContaining({
              contains: 'Los Angeles',
            }),
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([mockMarketPrice]);

      await marketService.getMarketPrices(
        'Tomato',
        undefined,
        new Date('2024-07-01'),
        new Date('2024-07-31')
      );

      expect(prisma.marketPrice.findMany).toHaveBeenCalled();
    });
  });

  describe('getPriceTrends', () => {
    it('should return price trends for a crop', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([
        { ...mockMarketPrice, date: new Date('2024-07-01'), price: 2.2 },
        { ...mockMarketPrice, date: new Date('2024-07-08'), price: 2.4 },
        { ...mockMarketPrice, date: new Date('2024-07-15'), price: 2.5 },
      ]);

      const result = await marketService.getPriceTrends(
        'Tomato',
        new Date('2024-07-01'),
        new Date('2024-07-15')
      );

      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('dataPoints');
      expect(result).toHaveProperty('averagePrice');
      expect(result).toHaveProperty('minPrice');
      expect(result).toHaveProperty('maxPrice');
      expect(result).toHaveProperty('volatility');
      expect(result.trend).toBe('increasing');
    });

    it('should calculate price volatility', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([
        { ...mockMarketPrice, date: new Date('2024-07-01'), price: 2.0 },
        { ...mockMarketPrice, date: new Date('2024-07-08'), price: 3.5 },
        { ...mockMarketPrice, date: new Date('2024-07-15'), price: 1.5 },
      ]);

      const result = await marketService.getPriceTrends(
        'Tomato',
        new Date('2024-07-01'),
        new Date('2024-07-15')
      );

      expect(result.volatility).toBeGreaterThan(0);
    });
  });

  describe('getMarketInsights', () => {
    it('should provide market insights for a crop type', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([mockMarketPrice]);
      prisma.marketListing.findMany.mockResolvedValue([mockMarketListing]);

      const result = await marketService.getMarketInsights('Tomato');

      expect(result).toHaveProperty('supplyDemand');
      expect(result).toHaveProperty('priceForecast');
      expect(result).toHaveProperty('competitorAnalysis');
      expect(result).toHaveProperty('bestSellingTime');
      expect(result).toHaveProperty('recommendedActions');
    });

    it('should include supply demand analysis', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([mockMarketPrice]);
      prisma.marketListing.findMany.mockResolvedValue([mockMarketListing]);

      const result = await marketService.getMarketInsights('Tomato');

      expect(result.supplyDemand).toHaveProperty('currentSupply');
      expect(result.supplyDemand).toHaveProperty('currentDemand');
      expect(result.supplyDemand).toHaveProperty('balance');
      expect(result.supplyDemand).toHaveProperty('forecast');
    });
  });

  describe('createListing', () => {
    it('should create a market listing', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.crop.findUnique.mockResolvedValue({
        id: 'crop-1',
        name: 'Tomato Plot A',
        cropTypeId: 'type-1',
        farmId: 'farm-1',
        plantedDate: new Date(),
        expectedHarvestDate: new Date(),
        actualHarvestDate: null,
        status: 'ACTIVE',
        growthStage: 'FRUITING',
        area: 2.5,
        areaUnit: 'hectares',
        yieldEstimate: 15000,
        yieldUnit: 'kg',
        costPerUnit: 0.5,
        revenuePerUnit: 2.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.marketListing.create.mockResolvedValue(mockMarketListing);

      const result = await marketService.createListing('user-1', {
        cropId: 'crop-1',
        title: 'Fresh Organic Tomatoes',
        description: 'High-quality organic tomatoes',
        quantity: 5000,
        quantityUnit: 'kg',
        pricePerUnit: 3.0,
        currency: 'USD',
        quality: 'Organic Grade A',
        availableFrom: '2024-07-20',
        availableUntil: '2024-07-30',
      });

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('active');
    });

    it('should validate pricing', async () => {
      await expect(
        marketService.createListing('user-1', {
          cropId: 'crop-1',
          title: 'Test',
          description: 'Test',
          quantity: 100,
          quantityUnit: 'kg',
          pricePerUnit: -5,
          currency: 'USD',
          quality: 'Grade A',
          availableFrom: '2024-07-20',
          availableUntil: '2024-07-30',
        })
      ).rejects.toThrow('Price must be positive');
    });

    it('should validate date range', async () => {
      await expect(
        marketService.createListing('user-1', {
          cropId: 'crop-1',
          title: 'Test',
          description: 'Test',
          quantity: 100,
          quantityUnit: 'kg',
          pricePerUnit: 2.5,
          currency: 'USD',
          quality: 'Grade A',
          availableFrom: '2024-07-30',
          availableUntil: '2024-07-20',
        })
      ).rejects.toThrow('Available until must be after available from');
    });
  });

  describe('getListings', () => {
    it('should return active market listings', async () => {
      prisma.marketListing.findMany.mockResolvedValue([mockMarketListing]);

      const result = await marketService.getListings();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter listings by crop type', async () => {
      prisma.marketListing.findMany.mockResolvedValue([mockMarketListing]);

      await marketService.getListings({ cropType: 'Tomato' });

      expect(prisma.marketListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            crop: expect.objectContaining({
              cropType: expect.objectContaining({
                name: 'Tomato',
              }),
            }),
          }),
        })
      );
    });

    it('should sort by price', async () => {
      prisma.marketListing.findMany.mockResolvedValue([mockMarketListing]);

      await marketService.getListings({ sortBy: 'price', sortOrder: 'asc' });

      expect(prisma.marketListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            pricePerUnit: 'asc',
          }),
        })
      );
    });
  });

  describe('getBuyerMatches', () => {
    it('should find matching buyers for a crop', async () => {
      prisma.farm.findUnique.mockResolvedValue({
        id: 'farm-1',
        ownerId: 'user-1',
        name: 'Green Valley Farm',
        location: 'California',
        latitude: 36.7783,
        longitude: -119.4179,
        area: 500,
        areaUnit: 'acres',
        soilType: 'loamy',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.marketBuyer.findMany.mockResolvedValue([
        {
          id: 'buyer-1',
          name: 'FreshMart Co.',
          location: 'Los Angeles, CA',
          cropTypes: ['Tomato', 'Pepper'],
          minQuantity: 1000,
          maxQuantity: 50000,
          priceRange: { min: 2.0, max: 4.0 },
          rating: 4.7,
          verified: true,
          lastActive: new Date(),
        },
      ]);

      const result = await marketService.getBuyerMatches(
        'farm-1',
        'user-1',
        'Tomato',
        5000
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('matchScore');
    });
  });

  describe('getPriceAlerts', () => {
    it('should return user price alerts', async () => {
      prisma.marketAlert.findMany.mockResolvedValue([mockMarketAlert]);

      const result = await marketService.getPriceAlerts('user-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create a price alert', async () => {
      prisma.marketAlert.create.mockResolvedValue(mockMarketAlert);

      const result = await marketService.createPriceAlert('user-1', {
        cropType: 'Tomato',
        type: 'PRICE_DROP',
        threshold: 2.0,
        direction: 'below',
      });

      expect(result).toHaveProperty('id');
      expect(result.enabled).toBe(true);
    });
  });

  describe('getMarketForecast', () => {
    it('should provide market price forecast', async () => {
      prisma.marketPrice.findMany.mockResolvedValue([
        { ...mockMarketPrice, price: 2.2 },
        { ...mockMarketPrice, price: 2.4 },
        { ...mockMarketPrice, price: 2.5 },
      ]);

      const result = await marketService.getMarketForecast('Tomato', 30);

      expect(result).toHaveProperty('forecast');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result.forecast).toBeInstanceOf(Array);
    });
  });
});
