
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  unitsSold: number;
}

export interface VendorConfig {
  menuItems: MenuItem[];
  totalVisitors: number;
  
  mileage: number;
  costPerMile: number;
  vanRental: number;
  
  staffCount: number;
  staffDayRate: number;
  eventDays: number;
  
  accommodationCost: number;
  ingredientsCost: number;
  fuelCost: number;

  potentialLeads: number;
  leadValue: number;
  brandMediaValue: number;
}

export interface ROIResult {
  directRevenue: number;
  pitchFee: number;
  totalOperatingCosts: number;
  netProfit: number;
  totalValue: number;
  roiPercentage: number;
}
