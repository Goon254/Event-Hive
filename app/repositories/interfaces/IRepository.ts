// app/repositories/interfaces/IRepository.ts
/**
 * Generic repository interface that defines common CRUD operations
 * @template T The entity type
 * @template ID The ID type (usually string for Firebase)
 */
export interface IRepository<T, ID = string> {
  /**
   * Create a new entity
   * @param entity The entity to create
   * @returns Promise resolving to the created entity with ID
   */
  create(entity: Omit<T, 'id'>): Promise<T>;
  
  /**
   * Get an entity by ID
   * @param id The entity ID
   * @returns Promise resolving to the entity or null if not found
   */
  getById(id: ID): Promise<T | null>;
  
  /**
   * Update an existing entity
   * @param id The entity ID
   * @param entity The updated entity data
   * @returns Promise resolving to the updated entity
   */
  update(id: ID, entity: Partial<T>): Promise<T>;
  
  /**
   * Delete an entity by ID
   * @param id The entity ID
   * @returns Promise resolving when the entity is deleted
   */
  delete(id: ID): Promise<void>;
  
  /**
   * Get all entities (with optional filtering)
   * @param options Optional query options
   * @returns Promise resolving to an array of entities
   */
  getAll(options?: any): Promise<T[]>;
}