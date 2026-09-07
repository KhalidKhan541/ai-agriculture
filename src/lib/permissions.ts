import prisma from "./db";

// ═══════════════════════════════════════════════════════════════
// ROLE HIERARCHY
// ═══════════════════════════════════════════════════════════════

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  PLATFORM_ADMIN: 90,
  FARM_OWNER: 80,
  FARM_MANAGER: 70,
  AGRONOMIST: 60,
  FARM_WORKER: 50,
  BUYER: 40,
  VENDOR: 30,
  ANALYST: 20,
  VIEWER: 10,
};

// ═══════════════════════════════════════════════════════════════
// PERMISSION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type Permission =
  // Farm permissions
  | "farm:create"
  | "farm:read"
  | "farm:update"
  | "farm:delete"
  | "farm:manage_members"
  | "farm:archive"
  // Field permissions
  | "field:create"
  | "field:read"
  | "field:update"
  | "field:delete"
  // Crop permissions
  | "crop:create"
  | "crop:read"
  | "crop:update"
  | "crop:delete"
  | "crop:manage_plantings"
  // Irrigation permissions
  | "irrigation:create"
  | "irrigation:read"
  | "irrigation:update"
  | "irrigation:delete"
  | "irrigation:control"
  // Soil permissions
  | "soil:read"
  | "soil:create_sample"
  | "soil:analyze"
  // Weather permissions
  | "weather:read"
  | "weather:manage_alerts"
  // Pest permissions
  | "pest:read"
  | "pest:create_alert"
  | "pest:manage_alerts"
  // Harvest permissions
  | "harvest:create"
  | "harvest:read"
  | "harvest:update"
  | "harvest:delete"
  // Equipment permissions
  | "equipment:create"
  | "equipment:read"
  | "equipment:update"
  | "equipment:delete"
  | "equipment:assign"
  | "equipment:maintenance"
  // Market permissions
  | "market:read"
  | "market:create"
  | "market:update"
  | "market:delete"
  // Produce & Listing permissions
  | "produce:read"
  | "produce:create"
  | "produce:update"
  | "produce:delete"
  | "listing:create"
  | "listing:update"
  | "listing:delete"
  // Order permissions
  | "order:create"
  | "order:read"
  | "order:update"
  | "order:cancel"
  | "order:manage_all"
  // Contract permissions
  | "contract:create"
  | "contract:read"
  | "contract:update"
  | "contract:sign"
  | "contract:terminate"
  // Yield permissions
  | "yield:read"
  | "yield:create"
  | "yield:update"
  | "yield:forecast"
  // Satellite & Drone permissions
  | "satellite:read"
  | "satellite:upload"
  | "drone:read"
  | "drone:manage"
  | "drone:flight_plan"
  // Sensor permissions
  | "sensor:read"
  | "sensor:create"
  | "sensor:update"
  | "sensor:delete"
  | "sensor:readings"
  // Financial permissions
  | "financial:read"
  | "financial:create"
  | "financial:update"
  | "financial:delete"
  | "financial:reports"
  | "financial:export"
  // Notification permissions
  | "notification:read"
  | "notification:manage"
  // Audit permissions
  | "audit:read"
  | "audit:export"
  // User permissions
  | "user:read"
  | "user:update"
  | "user:delete"
  | "user:manage_roles"
  // System permissions
  | "system:admin"
  | "system:config"
  | "system:export"
  | "system:import";

// ═══════════════════════════════════════════════════════════════
// ROLE-TO-PERMISSION MAPPING
// ═══════════════════════════════════════════════════════════════

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "farm:create", "farm:read", "farm:update", "farm:delete", "farm:manage_members", "farm:archive",
    "field:create", "field:read", "field:update", "field:delete",
    "crop:create", "crop:read", "crop:update", "crop:delete", "crop:manage_plantings",
    "irrigation:create", "irrigation:read", "irrigation:update", "irrigation:delete", "irrigation:control",
    "soil:read", "soil:create_sample", "soil:analyze",
    "weather:read", "weather:manage_alerts",
    "pest:read", "pest:create_alert", "pest:manage_alerts",
    "harvest:create", "harvest:read", "harvest:update", "harvest:delete",
    "equipment:create", "equipment:read", "equipment:update", "equipment:delete", "equipment:assign", "equipment:maintenance",
    "market:read", "market:create", "market:update", "market:delete",
    "produce:read", "produce:create", "produce:update", "produce:delete",
    "listing:create", "listing:update", "listing:delete",
    "order:create", "order:read", "order:update", "order:cancel", "order:manage_all",
    "contract:create", "contract:read", "contract:update", "contract:sign", "contract:terminate",
    "yield:read", "yield:create", "yield:update", "yield:forecast",
    "satellite:read", "satellite:upload",
    "drone:read", "drone:manage", "drone:flight_plan",
    "sensor:read", "sensor:create", "sensor:update", "sensor:delete", "sensor:readings",
    "financial:read", "financial:create", "financial:update", "financial:delete", "financial:reports", "financial:export",
    "notification:read", "notification:manage",
    "audit:read", "audit:export",
    "user:read", "user:update", "user:delete", "user:manage_roles",
    "system:admin", "system:config", "system:export", "system:import",
  ],
  PLATFORM_ADMIN: [
    "farm:create", "farm:read", "farm:update", "farm:delete", "farm:manage_members",
    "field:create", "field:read", "field:update", "field:delete",
    "crop:create", "crop:read", "crop:update", "crop:delete",
    "equipment:read",
    "market:read", "market:create", "market:update", "market:delete",
    "produce:read",
    "order:read", "order:manage_all",
    "contract:read",
    "sensor:read",
    "financial:read", "financial:reports", "financial:export",
    "notification:read", "notification:manage",
    "audit:read", "audit:export",
    "user:read", "user:update", "user:delete", "user:manage_roles",
    "system:admin", "system:config", "system:export", "system:import",
  ],
  FARM_OWNER: [
    "farm:create", "farm:read", "farm:update", "farm:manage_members",
    "field:create", "field:read", "field:update", "field:delete",
    "crop:create", "crop:read", "crop:update", "crop:delete", "crop:manage_plantings",
    "irrigation:create", "irrigation:read", "irrigation:update", "irrigation:delete", "irrigation:control",
    "soil:read", "soil:create_sample", "soil:analyze",
    "weather:read", "weather:manage_alerts",
    "pest:read", "pest:create_alert", "pest:manage_alerts",
    "harvest:create", "harvest:read", "harvest:update", "harvest:delete",
    "equipment:create", "equipment:read", "equipment:update", "equipment:delete", "equipment:assign", "equipment:maintenance",
    "market:read", "market:create", "market:update",
    "produce:read", "produce:create", "produce:update", "produce:delete",
    "listing:create", "listing:update", "listing:delete",
    "order:create", "order:read", "order:update", "order:cancel",
    "contract:create", "contract:read", "contract:update", "contract:sign",
    "yield:read", "yield:create", "yield:update", "yield:forecast",
    "satellite:read", "satellite:upload",
    "drone:read", "drone:manage", "drone:flight_plan",
    "sensor:read", "sensor:create", "sensor:update", "sensor:delete", "sensor:readings",
    "financial:read", "financial:create", "financial:update", "financial:delete", "financial:reports", "financial:export",
    "notification:read", "notification:manage",
    "audit:read",
    "user:read", "user:update",
  ],
  FARM_MANAGER: [
    "farm:read", "farm:update",
    "field:create", "field:read", "field:update",
    "crop:create", "crop:read", "crop:update", "crop:manage_plantings",
    "irrigation:create", "irrigation:read", "irrigation:update", "irrigation:control",
    "soil:read", "soil:create_sample",
    "weather:read",
    "pest:read", "pest:create_alert", "pest:manage_alerts",
    "harvest:create", "harvest:read", "harvest:update",
    "equipment:create", "equipment:read", "equipment:update", "equipment:assign", "equipment:maintenance",
    "market:read",
    "produce:read", "produce:create", "produce:update",
    "listing:create", "listing:update",
    "order:read", "order:update",
    "contract:read",
    "yield:read", "yield:create", "yield:update",
    "satellite:read",
    "drone:read",
    "sensor:read", "sensor:create", "sensor:readings",
    "financial:read", "financial:create", "financial:reports",
    "notification:read",
    "audit:read",
    "user:read",
  ],
  AGRONOMIST: [
    "farm:read",
    "field:read",
    "crop:create", "crop:read", "crop:update", "crop:manage_plantings",
    "irrigation:read", "irrigation:update",
    "soil:read", "soil:create_sample", "soil:analyze",
    "weather:read",
    "pest:read", "pest:create_alert", "pest:manage_alerts",
    "harvest:read",
    "equipment:read",
    "market:read",
    "produce:read",
    "yield:read", "yield:create", "yield:update", "yield:forecast",
    "satellite:read",
    "sensor:read", "sensor:readings",
    "financial:read",
    "notification:read",
    "user:read",
  ],
  FARM_WORKER: [
    "farm:read",
    "field:read",
    "crop:read", "crop:update",
    "irrigation:read",
    "soil:read",
    "weather:read",
    "pest:read", "pest:create_alert",
    "harvest:read", "harvest:create",
    "equipment:read", "equipment:update",
    "produce:read",
    "sensor:read",
    "notification:read",
  ],
  BUYER: [
    "farm:read",
    "crop:read",
    "market:read",
    "produce:read",
    "listing:create", "listing:update",
    "order:create", "order:read", "order:update",
    "contract:create", "contract:read", "contract:update",
    "notification:read",
    "user:read", "user:update",
  ],
  VENDOR: [
    "farm:read",
    "crop:read",
    "market:read",
    "produce:read", "produce:create", "produce:update",
    "listing:create", "listing:update",
    "order:read", "order:update",
    "notification:read",
    "user:read", "user:update",
  ],
  ANALYST: [
    "farm:read",
    "field:read",
    "crop:read",
    "irrigation:read",
    "soil:read",
    "weather:read",
    "pest:read",
    "harvest:read",
    "equipment:read",
    "market:read",
    "produce:read",
    "order:read",
    "contract:read",
    "yield:read", "yield:forecast",
    "satellite:read",
    "sensor:read", "sensor:readings",
    "financial:read", "financial:reports", "financial:export",
    "audit:read", "audit:export",
    "user:read",
  ],
  VIEWER: [
    "farm:read",
    "field:read",
    "crop:read",
    "irrigation:read",
    "soil:read",
    "weather:read",
    "pest:read",
    "harvest:read",
    "equipment:read",
    "market:read",
    "produce:read",
    "order:read",
    "contract:read",
    "yield:read",
    "sensor:read",
    "notification:read",
  ],
};

// ═══════════════════════════════════════════════════════════════
// PERMISSION CHECKING
// ═══════════════════════════════════════════════════════════════

export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.VIEWER;
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = getPermissionsForRole(userRole);
  return permissions.includes(permission);
}

export function hasAllPermissions(
  userRole: string,
  permissions: Permission[]
): boolean {
  const userPermissions = getPermissionsForRole(userRole);
  return permissions.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(
  userRole: string,
  permissions: Permission[]
): boolean {
  const userPermissions = getPermissionsForRole(userRole);
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasHigherRole(
  userRole: string,
  targetRole: string
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  return userLevel > targetLevel;
}

export function hasEqualOrHigherRole(
  userRole: string,
  targetRole: string
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  return userLevel >= targetLevel;
}

// ═══════════════════════════════════════════════════════════════
// FARM MEMBERSHIP CHECKS
// ═══════════════════════════════════════════════════════════════

export async function isFarmMember(
  userId: string,
  farmId: string
): Promise<boolean> {
  const member = await prisma.farmMember.findUnique({
    where: {
      farmId_userId: { farmId, userId },
    },
  });
  return member !== null;
}

export async function getFarmRole(
  userId: string,
  farmId: string
): Promise<string | null> {
  const member = await prisma.farmMember.findUnique({
    where: {
      farmId_userId: { farmId, userId },
    },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function isFarmOwner(
  userId: string,
  farmId: string
): Promise<boolean> {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { ownerId: true },
  });
  return farm?.ownerId === userId;
}

export async function canAccessFarm(
  userId: string,
  farmId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "PLATFORM_ADMIN") {
    return true;
  }

  const isOwner = await isFarmOwner(userId, farmId);
  if (isOwner) return true;

  const isMember = await isFarmMember(userId, farmId);
  return isMember;
}

// ═══════════════════════════════════════════════════════════════
// RESOURCE-LEVEL PERMISSION CHECKS
// ═══════════════════════════════════════════════════════════════

export async function canManageCrop(
  userId: string,
  cropId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "PLATFORM_ADMIN") {
    return true;
  }

  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: { farmId: true },
  });

  if (!crop) return false;

  return canAccessFarm(userId, crop.farmId);
}

export async function canManageEquipment(
  userId: string,
  equipmentId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "PLATFORM_ADMIN") {
    return true;
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { farmId: true },
  });

  if (!equipment) return false;

  return canAccessFarm(userId, equipment.farmId);
}

export async function canManageOrder(
  userId: string,
  orderId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "PLATFORM_ADMIN") {
    return true;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      buyer: { select: { userId: true } },
    },
  });

  if (!order) return false;

  return order.buyer.userId === userId;
}

export async function canManageContract(
  userId: string,
  contractId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN" || user.role === "PLATFORM_ADMIN") {
    return true;
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { farmId: true },
  });

  if (!contract) return false;

  return canAccessFarm(userId, contract.farmId);
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL PERMISSION CHECK (for API routes)
// ═══════════════════════════════════════════════════════════════

export async function checkPermission(
  userId: string,
  permission: Permission,
  context?: { farmId?: string; resourceId?: string; resourceType?: string }
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (!user) {
    return { allowed: false, reason: "User not found" };
  }

  if (!user.isActive) {
    return { allowed: false, reason: "User account is inactive" };
  }

  const baseAllowed = hasPermission(user.role, permission);
  if (!baseAllowed) {
    return { allowed: false, reason: "Insufficient role permissions" };
  }

  if (context?.farmId) {
    const hasAccess = await canAccessFarm(userId, context.farmId);
    if (!hasAccess) {
      return { allowed: false, reason: "Not a member of this farm" };
    }
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE HELPER
// ═══════════════════════════════════════════════════════════════

export function requirePermission(permission: Permission) {
  return async (userId: string, context?: { farmId?: string }) => {
    const result = await checkPermission(userId, permission, context);
    if (!result.allowed) {
      throw new PermissionDeniedError(result.reason ?? "Access denied");
    }
    return true;
  };
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM ERROR
// ═══════════════════════════════════════════════════════════════

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL PERMISSIONS LIST
// ═══════════════════════════════════════════════════════════════

export function getAllPermissions(): Permission[] {
  return [
    "farm:create", "farm:read", "farm:update", "farm:delete", "farm:manage_members", "farm:archive",
    "field:create", "field:read", "field:update", "field:delete",
    "crop:create", "crop:read", "crop:update", "crop:delete", "crop:manage_plantings",
    "irrigation:create", "irrigation:read", "irrigation:update", "irrigation:delete", "irrigation:control",
    "soil:read", "soil:create_sample", "soil:analyze",
    "weather:read", "weather:manage_alerts",
    "pest:read", "pest:create_alert", "pest:manage_alerts",
    "harvest:create", "harvest:read", "harvest:update", "harvest:delete",
    "equipment:create", "equipment:read", "equipment:update", "equipment:delete", "equipment:assign", "equipment:maintenance",
    "market:read", "market:create", "market:update", "market:delete",
    "produce:read", "produce:create", "produce:update", "produce:delete",
    "listing:create", "listing:update", "listing:delete",
    "order:create", "order:read", "order:update", "order:cancel", "order:manage_all",
    "contract:create", "contract:read", "contract:update", "contract:sign", "contract:terminate",
    "yield:read", "yield:create", "yield:update", "yield:forecast",
    "satellite:read", "satellite:upload",
    "drone:read", "drone:manage", "drone:flight_plan",
    "sensor:read", "sensor:create", "sensor:update", "sensor:delete", "sensor:readings",
    "financial:read", "financial:create", "financial:update", "financial:delete", "financial:reports", "financial:export",
    "notification:read", "notification:manage",
    "audit:read", "audit:export",
    "user:read", "user:update", "user:delete", "user:manage_roles",
    "system:admin", "system:config", "system:export", "system:import",
  ];
}

export function getRoles(): string[] {
  return Object.keys(ROLE_PERMISSIONS);
}

export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
