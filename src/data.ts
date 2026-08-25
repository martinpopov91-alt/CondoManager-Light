import { Apartment, FixedBill, Fund } from "./types";

export const DEFAULT_APARTMENTS: Apartment[] = [
  { id: "1.1", name: "Ap. 1.1", owner: "Стефан Дечков", idealParts: 5.406, peopleCount: 2, garageCount: 1 },
  { id: "1.2", name: "Ap. 1.2", owner: "Ваня и Иван", idealParts: 5.248, peopleCount: 2, garageCount: 1 },
  { id: "1.3", name: "Ap. 1.3", owner: "", idealParts: 4.720, peopleCount: 0, garageCount: 1 },
  { id: "1.4", name: "Ap. 1.4", owner: "Габриела и Никола", idealParts: 4.803, peopleCount: 2, garageCount: 1 },
  { id: "2.5", name: "Ap. 2.5", owner: "Атанас и Лора", idealParts: 7.228, peopleCount: 2, garageCount: 1 },
  { id: "2.6", name: "Ap. 2.6", owner: "", idealParts: 6.662, peopleCount: 1, garageCount: 1 },
  { id: "2.7", name: "Ap. 2.7", owner: "Ивайло Ангелов", idealParts: 6.457, peopleCount: 1, garageCount: 1 },
  { id: "2.8", name: "Ap. 2.8", owner: "Яна и Дейвид", idealParts: 6.562, peopleCount: 2, garageCount: 1 },
  { id: "3.9", name: "Ap. 3.9", owner: "Люба и Мирослава", idealParts: 7.228, peopleCount: 2, garageCount: 0 },
  { id: "3.10", name: "Ap. 3.10", owner: "Антония и Мартин", idealParts: 6.662, peopleCount: 2, garageCount: 2 },
  { id: "3.11", name: "Ap. 3.11", owner: "Цветелина Стоянова", idealParts: 6.457, peopleCount: 1, garageCount: 1 },
  { id: "3.12", name: "Ap. 3.12", owner: "Емилиян", idealParts: 6.562, peopleCount: 2, garageCount: 2 },
  { id: "4.13", name: "Ap. 4.13", owner: "Жоро Деспотов", idealParts: 7.510, peopleCount: 2, garageCount: 1 },
  { id: "4.14", name: "Ap. 4.14", owner: "Крисиян", idealParts: 4.907, peopleCount: 2, garageCount: 1 },
  { id: "4.15", name: "Ap. 4.15", owner: "Yosif Danchev", idealParts: 10.929, peopleCount: 1, garageCount: 2 },
  { id: "5.16", name: "Ap. 5.16", owner: "Ивайло", idealParts: 2.660, peopleCount: 1, garageCount: 0 }
];

export const DEFAULT_FIXED_BILLS: FixedBill[] = [
  { id: "el-ent", name: "Electricity (Entrance)", amount: 0, isPaid: false, category: 'general', isFixed: false },
  { id: "el-elev", name: "Electricity (Elevator)", amount: 0, isPaid: false, category: 'general', isFixed: false },
  { id: "el-sub", name: "Electricity (Substation)", amount: 0, isPaid: false, category: 'general', isFixed: false },
  { id: "elev-fee", name: "Elevator Fee", amount: 0, isPaid: false, category: 'general', isFixed: true },
  { id: "ent-clean", name: "Entrance Cleaning", amount: 0, isPaid: false, category: 'general', isFixed: true },
  
  { id: "elev-conn", name: "Elevator Connection (Yearly)", amount: 0, isPaid: false, category: 'yearly', isFixed: false },
  { id: "tech-insp", name: "Technical Inspection (Yearly)", amount: 0, isPaid: false, category: 'yearly', isFixed: false },
  
  { id: "gar-el", name: "Garage Electricity", amount: 0, isPaid: false, category: 'garage', isFixed: false },
  { id: "gar-clean", name: "Garage Cleaning", amount: 0, isPaid: false, category: 'garage', isFixed: true },
  
  { id: "maint-mow", name: "Mowing", amount: 0, isPaid: false, category: 'maintenance', isFixed: true },
  { id: "maint-septic", name: "Septic", amount: 0, isPaid: false, category: 'maintenance', isFixed: true },
  { id: "maint-complex", name: "Complex Cleaning", amount: 0, isPaid: false, category: 'maintenance', isFixed: true },
  
  { id: "repair-fee", name: "Repair Fee", amount: 0, isPaid: false, category: 'general', isFixed: false },
  { id: "repair-fund", name: "Repair Fund", amount: 0, isPaid: false, category: 'repair', isFixed: true },
];

export const DEFAULT_FUNDS: Fund[] = [
  { id: "Repair", name: "Repair", startBalance: 0 },
  { id: "Mowing", name: "Mowing", startBalance: 0 },
  { id: "Septic", name: "Septic", startBalance: 0 },
  { id: "Complex", name: "Complex", startBalance: 0 },
];
