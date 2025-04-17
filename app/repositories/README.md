# Repository Pattern Implementation

This directory contains the implementation of the repository pattern for the ScanGo application. The repository pattern is a design pattern that abstracts the data access layer from the rest of the application, providing a clean separation between the business logic and data access code.

## Structure

The repository implementation is organized into the following components:

1. **Interfaces**: Define the contracts for repository operations
2. **Implementations**: Concrete implementations of the repository interfaces
3. **Factory**: A factory class for creating repository instances

### Directory Structure

```
app/repositories/
├── interfaces/                 # Repository interfaces
│   ├── IRepository.ts          # Base repository interface
│   ├── IPostRepository.ts      # Post repository interface
│   ├── ICommentRepository.ts   # Comment repository interface
│   ├── IConnectionRepository.ts # Connection repository interface
│   └── INotificationRepository.ts # Notification repository interface
├── implementations/            # Repository implementations
│   ├── FirebaseRepository.ts   # Base Firebase repository
│   ├── FirebasePostRepository.ts # Firebase post repository
│   ├── FirebaseCommentRepository.ts # Firebase comment repository
│   ├── FirebaseConnectionRepository.ts # Firebase connection repository
│   └── FirebaseNotificationRepository.ts # Firebase notification repository
└── RepositoryFactory.ts        # Factory for creating repository instances
```

## Repository Interfaces

The repository interfaces define the contracts for data access operations. Each interface extends the base `IRepository<T>` interface, which provides common CRUD operations:

```typescript
export interface IRepository<T, ID = string> {
  create(entity: Omit<T, 'id'>): Promise<T>;
  getById(id: ID): Promise<T | null>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  getAll(options?: any): Promise<T[]>;
}
```

Specific repository interfaces add domain-specific operations:

```typescript
export interface IPostRepository extends IRepository<SocialPost> {
  fetchPosts(options?: {...}): Promise<{ posts: SocialPost[]; lastDoc: any }>;
  setupPostsListener(callback: (posts: SocialPost[]) => void, options?: {...}): () => void;
  likePost(postId: string, userId: string): Promise<void>;
  // ...
}
```

## Repository Implementations

The repository implementations provide concrete implementations of the repository interfaces. Each implementation extends the base `FirebaseRepository<T>` class, which provides common CRUD operations using Firebase Firestore:

```typescript
export class FirebasePostRepository extends FirebaseRepository<SocialPost> implements IPostRepository {
  constructor() {
    super('socialPosts');
  }
  
  // Implement domain-specific operations
  async fetchPosts(options?: {...}): Promise<{ posts: SocialPost[]; lastDoc: any }> {
    // Implementation
  }
  
  // ...
}
```

## Repository Factory

The `RepositoryFactory` provides a centralized way to get repository instances:

```typescript
export class RepositoryFactory {
  private static postRepository: IPostRepository | null = null;
  
  static getPostRepository(): IPostRepository {
    if (!this.postRepository) {
      this.postRepository = new FirebasePostRepository();
    }
    return this.postRepository;
  }
  
  // ...
}
```

## Benefits of the Repository Pattern

1. **Separation of Concerns**: Separates data access logic from business logic
2. **Testability**: Makes it easy to mock repositories for unit testing
3. **Flexibility**: Makes it easy to switch between different data sources
4. **Maintainability**: Centralizes data access logic, making it easier to maintain
5. **Consistency**: Provides a consistent interface for data access operations

## Usage

Repositories should not be used directly by UI components. Instead, they should be used by service classes that provide business logic:

```typescript
// In a service class
import { RepositoryFactory } from '../repositories/RepositoryFactory';

export class PostService {
  private postRepository = RepositoryFactory.getPostRepository();
  
  async createPost(postData: {...}): Promise<SocialPost> {
    // Business logic
    return this.postRepository.create(postData);
  }
  
  // ...
}
```

This ensures that business logic is separated from data access logic, making the code more maintainable and testable.