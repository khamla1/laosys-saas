export const MODULES = {
  CORE: "CORE",
  INVENTORY: "INVENTORY",
  POS: "POS",
  ECOMMERCE: "ECOMMERCE",
  RESTAURANT: "RESTAURANT",
  BOOKING: "BOOKING",
  ACCOUNTING: "ACCOUNTING",
  RENTALS: "RENTALS",
  REPAIRS: "REPAIRS",
  FITTING: "FITTING",
  CONSIGNMENT: "CONSIGNMENT",
  TEAM: "TEAM",
  COMMUNITY: "COMMUNITY",
  TECH: "TECH",
  AMBASSADORS: "AMBASSADORS",
  COACHING: "COACHING",
  DATA_EDITOR: "DATA_EDITOR"
} as const;

export type ModuleName = keyof typeof MODULES;

export const DEFAULT_MODULES_BY_BUSINESS_TYPE: Record<string, ModuleName[]> = {
  RESTAURANT: ["CORE", "POS", "INVENTORY", "RESTAURANT", "ECOMMERCE"],
  SPORTS_CLUB: ["CORE", "POS", "INVENTORY", "BOOKING", "ECOMMERCE", "RENTALS", "REPAIRS", "FITTING", "CONSIGNMENT", "TEAM", "COMMUNITY", "TECH", "AMBASSADORS", "COACHING"],
  RETAIL: ["CORE", "POS", "INVENTORY", "ECOMMERCE"],
  SERVICE: ["CORE", "POS", "BOOKING", "ECOMMERCE"],
  COSMETICS: ["CORE", "POS", "INVENTORY", "ECOMMERCE", "FITTING"],
  ELECTRONICS: ["CORE", "POS", "INVENTORY", "ECOMMERCE", "REPAIRS", "TECH"],
  FASHION: ["CORE", "POS", "INVENTORY", "ECOMMERCE", "FITTING", "CONSIGNMENT"],
  CLINIC: ["CORE", "POS", "INVENTORY", "BOOKING", "ECOMMERCE"],
  GENERIC: ["CORE", "POS", "INVENTORY", "ECOMMERCE", "RESTAURANT", "BOOKING", "ACCOUNTING", "RENTALS", "REPAIRS", "FITTING", "CONSIGNMENT", "TEAM", "COMMUNITY", "TECH", "AMBASSADORS", "COACHING"], // Generic has all by default for testing
};

/**
 * Returns the final list of enabled modules for an organization.
 * Priority: 
 * 1. Organization's specific enabledModules
 * 2. Package's specific enabledModules
 * 3. Default modules based on BusinessType
 */
export function getActiveModules(
  businessType: string,
  orgModules?: string[],
  packageModules?: string[]
): ModuleName[] {
  if (orgModules && orgModules.length > 0) {
    return orgModules as ModuleName[];
  }
  if (packageModules && packageModules.length > 0) {
    return packageModules as ModuleName[];
  }
  return DEFAULT_MODULES_BY_BUSINESS_TYPE[businessType] || DEFAULT_MODULES_BY_BUSINESS_TYPE.GENERIC;
}

export function hasModule(activeModules: string[], moduleName: ModuleName): boolean {
  return activeModules.includes(moduleName);
}
