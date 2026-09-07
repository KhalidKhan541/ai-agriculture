import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommodityType =
  | 'wheat'
  | 'corn'
  | 'soybeans'
  | 'rice'
  | 'cotton'
  | 'barley'
  | 'sorghum'
  | 'oats'
  | 'sunflower'
  | 'canola'
  | 'sugarcane'
  | 'coffee'
  | 'cocoa'
  | 'palm_oil'
  | 'rubber'
  | 'vegetables'
  | 'fruits'
  | 'livestock'
  | 'poultry'
  | 'dairy';

export type ListingStatus =
  | 'draft'
  | 'active'
  | 'pending'
  | 'sold'
  | 'expired'
  | 'cancelled'
  | 'disputed';

export type ContractStatus =
  | 'pending_signature'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'breached'
  | 'cancelled'
  | 'expired';

export type QualityGrade = 'premium' | 'grade_a' | 'grade_b' | 'grade_c' | 'rejected';

export type BuyerType = 'individual' | 'cooperative' | 'distributor' | 'processor' | 'retailer' | 'exporter';

export type PaymentMethod = 'bank_transfer' | 'escrow' | 'cash_on_delivery' | 'letter_of_credit' | 'mobile_money' | 'commodity_token';

export type PriceUnit = 'per_kg' | 'per_ton' | 'per_bushel' | 'per_litre' | 'per_unit';

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  commodity: CommodityType;
  quantity: number;
  unit: PriceUnit;
  pricePerUnit: number;
  currency: string;
  qualityGrade: QualityGrade;
  qualityDetails: QualityMetrics;
  location: GeoLocation;
  availableFrom: Date;
  expiresAt: Date;
  status: ListingStatus;
  images: string[];
  certifications: string[];
  organic: boolean;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  shippingOptions: ShippingOption[];
  tags: string[];
  viewCount: number;
  inquiryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityMetrics {
  moisture?: number;
  purity?: number;
  protein?: number;
  weight?: number;
  defects?: number;
  contamination?: number;
  freshness?: number;
  customFields: Record<string, number>;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country: string;
  postalCode?: string;
}

export interface ShippingOption {
  method: string;
  costPerUnit: number;
  estimatedDays: number;
  minimumQuantity: number;
  carrier?: string;
}

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  email: string;
  phone: string;
  address: GeoLocation;
  businessRegistration: string;
  taxId: string;
  verified: boolean;
  verificationDate?: Date;
  rating: number;
  totalTransactions: number;
  totalVolume: number;
  preferredCommodities: CommodityType[];
  paymentMethods: PaymentMethod[];
  creditLimit: number;
  outstandingBalance: number;
  contracts: string[];
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface MarketContract {
  id: string;
  contractNumber: string;
  listingId: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  commodity: CommodityType;
  quantity: number;
  unit: PriceUnit;
  pricePerUnit: number;
  totalPrice: number;
  currency: string;
  qualityGrade: QualityGrade;
  qualityRequirements: QualityMetrics;
  deliveryDate: Date;
  deliveryLocation: GeoLocation;
  paymentMethod: PaymentMethod;
  paymentTerms: string;
  status: ContractStatus;
  terms: ContractTerms;
  milestones: ContractMilestone[];
  documents: ContractDocument[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ContractTerms {
  penaltyForLateDelivery: number;
  penaltyForQualityIssue: number;
  forceMajeure: boolean;
  disputeResolution: 'mediation' | 'arbitration' | 'court';
  jurisdiction: string;
  specialConditions: string[];
}

export interface ContractMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  paymentPercentage: number;
}

export interface ContractDocument {
  id: string;
  name: string;
  type: 'invoice' | 'certificate' | 'inspection_report' | 'receipt' | 'other';
  url: string;
  uploadedAt: Date;
}

export interface PriceHistory {
  id: string;
  commodity: CommodityType;
  region: string;
  pricePerUnit: number;
  unit: PriceUnit;
  currency: string;
  date: Date;
  source: string;
}

export interface MarketAnalytics {
  commodity: CommodityType;
  region: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange: number;
  priceChangePercent: number;
  totalVolume: number;
  totalListings: number;
  activeListings: number;
  averageDaysToSell: number;
  demandIndex: number;
  supplyIndex: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
}

export interface MarketFilter {
  commodities?: CommodityType[];
  regions?: string[];
  minPrice?: number;
  maxPrice?: number;
  qualityGrades?: QualityGrade[];
  organic?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  certifications?: string[];
  sellerVerified?: boolean;
  sortBy?: 'price' | 'date' | 'quantity' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BulkListingRequest {
  sellerId: string;
  listings: Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'inquiryCount'>[];
}

export interface BulkListingResult {
  successful: string[];
  failed: { index: number; error: string }[];
  totalCreated: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class MarketService {
  private listings: Map<string, MarketListing> = new Map();
  private buyers: Map<string, Buyer> = new Map();
  private contracts: Map<string, MarketContract> = new Map();
  private priceHistory: PriceHistory[] = [];
  private analytics: Map<string, MarketAnalytics> = new Map();

  // ── Listings ─────────────────────────────────────────────────────────────

  async createListing(
    data: Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'inquiryCount' | 'status'>,
  ): Promise<MarketListing> {
    const now = new Date();
    const listing: MarketListing = {
      ...data,
      id: randomUUID(),
      status: 'active',
      viewCount: 0,
      inquiryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.listings.set(listing.id, listing);
    this.recordPricePoint(listing);
    return listing;
  }

  async updateListing(id: string, updates: Partial<MarketListing>): Promise<MarketListing> {
    const existing = this.listings.get(id);
    if (!existing) throw new Error(`Listing ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.listings.set(id, updated);
    if (updates.pricePerUnit || updates.quantity) this.recordPricePoint(updated);
    return updated;
  }

  async getListing(id: string): Promise<MarketListing | undefined> {
    const listing = this.listings.get(id);
    if (listing) {
      listing.viewCount++;
      this.listings.set(id, listing);
    }
    return listing;
  }

  async deleteListing(id: string): Promise<void> {
    const listing = this.listings.get(id);
    if (!listing) throw new Error(`Listing ${id} not found`);
    listing.status = 'cancelled';
    listing.updatedAt = new Date();
    this.listings.set(id, listing);
  }

  async searchListings(filter: MarketFilter): Promise<{ listings: MarketListing[]; total: number; page: number; totalPages: number }> {
    let results = Array.from(this.listings.values()).filter((l) => l.status === 'active');

    if (filter.commodities?.length) results = results.filter((l) => filter.commodities!.includes(l.commodity));
    if (filter.regions?.length) results = results.filter((l) => l.location.region && filter.regions!.includes(l.location.region));
    if (filter.minPrice !== undefined) results = results.filter((l) => l.pricePerUnit >= filter.minPrice!);
    if (filter.maxPrice !== undefined) results = results.filter((l) => l.pricePerUnit <= filter.maxPrice!);
    if (filter.qualityGrades?.length) results = results.filter((l) => filter.qualityGrades!.includes(l.qualityGrade));
    if (filter.organic !== undefined) results = results.filter((l) => l.organic === filter.organic);
    if (filter.minQuantity !== undefined) results = results.filter((l) => l.quantity >= filter.minQuantity!);
    if (filter.maxQuantity !== undefined) results = results.filter((l) => l.quantity <= filter.maxQuantity!);
    if (filter.certifications?.length) results = results.filter((l) => filter.certifications!.some((c) => l.certifications.includes(c)));

    const sortKey = filter.sortBy || 'date';
    const order = filter.sortOrder === 'asc' ? 1 : -1;
    results.sort((a, b) => {
      switch (sortKey) {
        case 'price': return (a.pricePerUnit - b.pricePerUnit) * order;
        case 'quantity': return (a.quantity - b.quantity) * order;
        case 'date': return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
        default: return 0;
      }
    });

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const listings = results.slice((page - 1) * limit, page * limit);

    return { listings, total, page, totalPages };
  }

  async createBulkListings(request: BulkListingRequest): Promise<BulkListingResult> {
    const result: BulkListingResult = { successful: [], failed: [], totalCreated: 0 };
    for (let i = 0; i < request.listings.length; i++) {
      try {
        const listing = await this.createListing({ ...request.listings[i], sellerId: request.sellerId });
        result.successful.push(listing.id);
        result.totalCreated++;
      } catch (err) {
        result.failed.push({ index: i, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
    return result;
  }

  async getPopularListings(limit: number = 10): Promise<MarketListing[]> {
    return Array.from(this.listings.values())
      .filter((l) => l.status === 'active')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  // ── Buyers ───────────────────────────────────────────────────────────────

  async registerBuyer(data: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'totalTransactions' | 'totalVolume' | 'contracts' | 'outstandingBalance'>): Promise<Buyer> {
    const now = new Date();
    const buyer: Buyer = {
      ...data,
      id: randomUUID(),
      totalTransactions: 0,
      totalVolume: 0,
      contracts: [],
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };
    this.buyers.set(buyer.id, buyer);
    return buyer;
  }

  async updateBuyer(id: string, updates: Partial<Buyer>): Promise<Buyer> {
    const existing = this.buyers.get(id);
    if (!existing) throw new Error(`Buyer ${id} not found`);
    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date() };
    this.buyers.set(id, updated);
    return updated;
  }

  async getBuyer(id: string): Promise<Buyer | undefined> {
    const buyer = this.buyers.get(id);
    if (buyer) {
      buyer.lastActiveAt = new Date();
      this.buyers.set(id, buyer);
    }
    return buyer;
  }

  async searchBuyers(query: { type?: BuyerType; verified?: boolean; commodity?: CommodityType; region?: string }): Promise<Buyer[]> {
    let results = Array.from(this.buyers.values());
    if (query.type) results = results.filter((b) => b.type === query.type);
    if (query.verified !== undefined) results = results.filter((b) => b.verified === query.verified);
    if (query.commodity) results = results.filter((b) => b.preferredCommodities.includes(query.commodity!));
    return results;
  }

  async getBuyerPerformance(id: string): Promise<{
    buyer: Buyer;
    averageOrderSize: number;
    totalSpent: number;
    onTimePaymentRate: number;
    disputeRate: number;
    loyaltyScore: number;
  } | undefined> {
    const buyer = this.buyers.get(id);
    if (!buyer) return undefined;
    const buyerContracts = Array.from(this.contracts.values()).filter((c) => c.buyerId === id);
    const completed = buyerContracts.filter((c) => c.status === 'completed');
    const disputed = buyerContracts.filter((c) => c.status === 'disputed');
    return {
      buyer,
      averageOrderSize: completed.length ? completed.reduce((s, c) => s + c.totalPrice, 0) / completed.length : 0,
      totalSpent: completed.reduce((s, c) => s + c.totalPrice, 0),
      onTimePaymentRate: completed.length ? (completed.length - disputed.length) / completed.length : 1,
      disputeRate: buyerContracts.length ? disputed.length / buyerContracts.length : 0,
      loyaltyScore: Math.min(100, Math.round((buyer.totalTransactions * 5) + (buyer.rating * 10))),
    };
  }

  // ── Contracts ────────────────────────────────────────────────────────────

  async createContract(data: {
    listingId: string;
    buyerId: string;
    quantity: number;
    paymentMethod: PaymentMethod;
    paymentTerms: string;
    terms: ContractTerms;
    deliveryDate: Date;
    deliveryLocation: GeoLocation;
  }): Promise<MarketContract> {
    const listing = this.listings.get(data.listingId);
    if (!listing) throw new Error(`Listing ${data.listingId} not found`);
    if (listing.status !== 'active') throw new Error('Listing is not available');
    if (data.quantity > listing.quantity) throw new Error('Quantity exceeds available stock');

    const buyer = this.buyers.get(data.buyerId);
    if (!buyer) throw new Error(`Buyer ${data.buyerId} not found`);

    const now = new Date();
    const contractNumber = `CTR-${now.getFullYear()}-${String(this.contracts.size + 1).padStart(6, '0')}`;
    const totalPrice = data.quantity * listing.pricePerUnit;

    const contract: MarketContract = {
      id: randomUUID(),
      contractNumber,
      listingId: data.listingId,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      buyerId: data.buyerId,
      buyerName: buyer.name,
      commodity: listing.commodity,
      quantity: data.quantity,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      totalPrice,
      currency: listing.currency,
      qualityGrade: listing.qualityGrade,
      qualityRequirements: listing.qualityDetails,
      deliveryDate: data.deliveryDate,
      deliveryLocation: data.deliveryLocation,
      paymentMethod: data.paymentMethod,
      paymentTerms: data.paymentTerms,
      status: 'pending_signature',
      terms: data.terms,
      milestones: this.generateDefaultMilestones(data.deliveryDate, totalPrice),
      documents: [],
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    this.contracts.set(contract.id, contract);
    listing.quantity -= data.quantity;
    if (listing.quantity <= 0) listing.status = 'sold';
    listing.updatedAt = now;
    this.listings.set(listing.id, listing);

    buyer.contracts.push(contract.id);
    buyer.updatedAt = now;
    this.buyers.set(buyer.id, buyer);

    return contract;
  }

  async updateContractStatus(id: string, status: ContractStatus): Promise<MarketContract> {
    const contract = this.contracts.get(id);
    if (!contract) throw new Error(`Contract ${id} not found`);
    contract.status = status;
    contract.updatedAt = new Date();
    if (status === 'completed') contract.completedAt = new Date();
    this.contracts.set(id, contract);
    return contract;
  }

  async getContract(id: string): Promise<MarketContract | undefined> {
    return this.contracts.get(id);
  }

  async getSellerContracts(sellerId: string): Promise<MarketContract[]> {
    return Array.from(this.contracts.values()).filter((c) => c.sellerId === sellerId);
  }

  async getBuyerContracts(buyerId: string): Promise<MarketContract[]> {
    return Array.from(this.contracts.values()).filter((c) => c.buyerId === buyerId);
  }

  async addContractMilestone(contractId: string, milestone: Omit<ContractMilestone, 'id' | 'status'>): Promise<MarketContract> {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);
    contract.milestones.push({ ...milestone, id: randomUUID(), status: 'pending' });
    contract.updatedAt = new Date();
    this.contracts.set(contractId, contract);
    return contract;
  }

  async completeContractMilestone(contractId: string, milestoneId: string): Promise<MarketContract> {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error(`Contract ${contractId} not found`);
    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new Error(`Milestone ${milestoneId} not found`);
    milestone.status = 'completed';
    milestone.completedDate = new Date();
    contract.updatedAt = new Date();
    this.contracts.set(contractId, contract);
    return contract;
  }

  // ── Price Tracking ───────────────────────────────────────────────────────

  private recordPricePoint(listing: MarketListing): void {
    this.priceHistory.push({
      id: randomUUID(),
      commodity: listing.commodity,
      region: listing.location.region || 'global',
      pricePerUnit: listing.pricePerUnit,
      unit: listing.unit,
      currency: listing.currency,
      date: new Date(),
      source: 'listing',
    });
  }

  async getPriceHistory(commodity: CommodityType, region?: string, days: number = 30): Promise<PriceHistory[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.priceHistory.filter(
      (p) => p.commodity === commodity && p.date >= cutoff && (!region || p.region === region),
    );
  }

  async getCurrentMarketPrice(commodity: CommodityType, region?: string): Promise<{
    average: number;
    min: number;
    max: number;
    sampleSize: number;
  }> {
    const active = Array.from(this.listings.values()).filter(
      (l) => l.commodity === commodity && l.status === 'active' && (!region || l.location.region === region),
    );
    if (!active.length) return { average: 0, min: 0, max: 0, sampleSize: 0 };
    const prices = active.map((l) => l.pricePerUnit);
    return {
      average: prices.reduce((s, p) => s + p, 0) / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      sampleSize: prices.length,
    };
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getMarketAnalytics(commodity: CommodityType, region: string, period: MarketAnalytics['period']): Promise<MarketAnalytics> {
    const now = new Date();
    const periodMs = { daily: 86400000, weekly: 604800000, monthly: 2592000000, quarterly: 7776000000 }[period];
    const startDate = new Date(now.getTime() - periodMs);
    const history = this.priceHistory.filter(
      (p) => p.commodity === commodity && p.region === region && p.date >= startDate,
    );
    const prices = history.map((h) => h.pricePerUnit);
    const listings = Array.from(this.listings.values()).filter(
      (l) => l.commodity === commodity && l.location.region === region,
    );

    const average = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const prevPeriodStart = new Date(startDate.getTime() - periodMs);
    const prevPrices = this.priceHistory
      .filter((p) => p.commodity === commodity && p.region === region && p.date >= prevPeriodStart && p.date < startDate)
      .map((h) => h.pricePerUnit);
    const prevAverage = prevPrices.length ? prevPrices.reduce((s, p) => s + p, 0) / prevPrices.length : average;

    const analytics: MarketAnalytics = {
      commodity,
      region,
      averagePrice: average,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      priceChange: average - prevAverage,
      priceChangePercent: prevAverage ? ((average - prevAverage) / prevAverage) * 100 : 0,
      totalVolume: listings.reduce((s, l) => s + l.quantity, 0),
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === 'active').length,
      averageDaysToSell: this.calculateAverageDaysToSell(commodity, region),
      demandIndex: this.calculateDemandIndex(commodity, region),
      supplyIndex: listings.filter((l) => l.status === 'active').length,
      marketTrend: average > prevAverage ? 'rising' : average < prevAverage ? 'falling' : 'stable',
      period,
      startDate,
      endDate: now,
    };

    this.analytics.set(`${commodity}-${region}-${period}`, analytics);
    return analytics;
  }

  private calculateAverageDaysToSell(commodity: CommodityType, region: string): number {
    const sold = Array.from(this.listings.values()).filter(
      (l) => l.commodity === commodity && l.location.region === region && l.status === 'sold',
    );
    if (!sold.length) return 0;
    const days = sold.map((l) => (l.updatedAt.getTime() - l.createdAt.getTime()) / 86400000);
    return days.reduce((s, d) => s + d, 0) / days.length;
  }

  private calculateDemandIndex(commodity: CommodityType, region: string): number {
    const listings = Array.from(this.listings.values()).filter(
      (l) => l.commodity === commodity && l.location.region === region,
    );
    const active = listings.filter((l) => l.status === 'active').length;
    const inquiries = listings.reduce((s, l) => s + l.inquiryCount, 0);
    return active > 0 ? Math.min(100, Math.round((inquiries / active) * 10)) : 0;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private generateDefaultMilestones(deliveryDate: Date, totalPrice: number): ContractMilestone[] {
    const now = new Date();
    const deliveryMs = deliveryDate.getTime() - now.getTime();
    return [
      { id: randomUUID(), name: 'Contract Signed', description: 'Both parties sign the contract', dueDate: new Date(now.getTime() + 7 * 86400000), status: 'pending', paymentPercentage: 0 },
      { id: randomUUID(), name: 'Payment Received', description: 'Initial payment processed', dueDate: new Date(now.getTime() + 14 * 86400000), status: 'pending', paymentPercentage: 30 },
      { id: randomUUID(), name: 'Quality Inspection', description: 'Product quality verified', dueDate: new Date(now.getTime() + deliveryMs * 0.5), status: 'pending', paymentPercentage: 0 },
      { id: randomUUID(), name: 'Shipment Dispatched', description: 'Goods shipped to buyer', dueDate: new Date(now.getTime() + deliveryMs * 0.8), status: 'pending', paymentPercentage: 40 },
      { id: randomUUID(), name: 'Delivery Confirmed', description: 'Buyer confirms receipt', dueDate: deliveryDate, status: 'pending', paymentPercentage: 30 },
    ];
  }

  // ── Statistics ───────────────────────────────────────────────────────────

  async getSellerStats(sellerId: string): Promise<{
    totalListings: number;
    activeListings: number;
    totalSold: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    const listings = Array.from(this.listings.values()).filter((l) => l.sellerId === sellerId);
    const sellerContracts = Array.from(this.contracts.values()).filter((c) => c.sellerId === sellerId && c.status === 'completed');
    return {
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === 'active').length,
      totalSold: sellerContracts.length,
      totalRevenue: sellerContracts.reduce((s, c) => s + c.totalPrice, 0),
      averageRating: 0,
    };
  }

  async getGlobalStats(): Promise<{
    totalListings: number;
    totalBuyers: number;
    totalContracts: number;
    totalVolume: number;
    topCommodities: { commodity: CommodityType; count: number }[];
  }> {
    const listings = Array.from(this.listings.values());
    const contracts = Array.from(this.contracts.values());
    const commodityCounts: Record<string, number> = {};
    listings.forEach((l) => { commodityCounts[l.commodity] = (commodityCounts[l.commodity] || 0) + 1; });
    const topCommodities = Object.entries(commodityCounts)
      .map(([commodity, count]) => ({ commodity: commodity as CommodityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return {
      totalListings: listings.length,
      totalBuyers: this.buyers.size,
      totalContracts: contracts.length,
      totalVolume: listings.reduce((s, l) => s + l.quantity, 0),
      topCommodities,
    };
  }
}
