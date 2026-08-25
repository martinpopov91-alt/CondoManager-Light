export interface Apartment {
  id: string;
  name: string;
  owner: string;
  idealParts: number;
  peopleCount: number;
  garageCount: number;
}

export interface Fund {
  id: string;
  name: string;
  startBalance: number;
}

export interface CalculatedFund extends Fund {
  collected: number;
  expenses: number;
  endBalance: number;
}

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
  category: 'general' | 'yearly' | 'garage' | 'maintenance' | 'repair';
  isFixed?: boolean;
}

export interface DynamicExpense {
  id: string;
  title: string;
  cost: number;
  category: 'Repair' | 'Mowing' | 'Septic' | 'Complex' | 'Other';
}

export interface ApartmentMonthState {
  id: string;
  oldDebt: number;
  status: 'Paid' | 'Unpaid';
  paidAmount?: number;
  paymentMethod?: 'cash' | 'revolut';
  comment: string;
  selected?: boolean;
}

export interface CalculatedApartmentState extends ApartmentMonthState {
  currentBill: number;
  grandTotal: number;
  monthsInDebt?: number;
  repairFundShare: number;
}

export interface MonthData {
  year: number;
  month: number;
  fixedBills: FixedBill[];
  dynamicExpenses: DynamicExpense[];
  funds: Fund[];
  apartmentsState: ApartmentMonthState[];
  revolutCash?: number;
  inHandCash?: number;
  notes?: string;
}

export interface GitHubCreds {
  token: string;
  gistId: string;
}
