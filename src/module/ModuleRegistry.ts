// Open/Closed Principle - Easy to extend with new modules
import type { IModule } from "../interfaces/IModule"

export class ModuleRegistry {
  private static modules: Map<string, IModule> = new Map()

  static registerModule(module: IModule): void {
    this.modules.set(module.id, module)
  }

  static getModule(id: string): IModule | undefined {
    return this.modules.get(id)
  }

  static getAllModules(): IModule[] {
    return Array.from(this.modules.values())
  }

  static getAvailableModules(permissions: string[]): IModule[] {
    return this.getAllModules().filter((module) =>
      module.requiredPermissions.some((permission) => permissions.includes(permission)),
    )
  }
}

// Register default modules
ModuleRegistry.registerModule({
  id: "inventory",
  name: "Inventory Management",
  description: "Manage products and stock",
  requiredPermissions: ["inventory:read"],
})

ModuleRegistry.registerModule({
  id: "customers",
  name: "Customer Management",
  description: "Manage customer data",
  requiredPermissions: ["customers:read"],
})

ModuleRegistry.registerModule({
  id: "analytics",
  name: "Analytics",
  description: "View reports and analytics",
  requiredPermissions: ["analytics:read"],
})

ModuleRegistry.registerModule({
  id: "products",
  name: "Product Management",
  description: "Manage product catalog",
  requiredPermissions: ["products:read"],
})
